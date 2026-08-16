const Order = require("../models/Order");
const User = require("../models/User");
const Batch = require("../models/Batch");
const ConsumptionLog = require("../models/ConsumptionLog");
const { findNearestVendor, findBestVendor } = require("../services/vendorMatching");
const {
  calculateBurnRate,
  daysOfStockLeft,
  classifySeverity,
  suggestRedistribution,
} = require("../services/forecastEngine");

// GET /api/insights/suggest-vendor/:orderId — admin only
// Reads the order's urgency field, calls the appropriate matching strategy,
// and returns a vendor suggestion. Does NOT assign the vendor — the admin
// still calls PATCH /api/orders/:id/approve with whichever vendor they choose.
const suggestVendor = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("hospital");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ message: "Order has no items" });
    }

    if (order.status !== "requested") {
      return res.status(400).json({
        message: `Vendor suggestion is only available for orders in "requested" status (current: "${order.status}")`,
      });
    }

    // Use the first item's drug as the primary matching target.
    // Multi-drug orders could be expanded later; for the MVP one drug drives the suggestion.
    const primaryDrugId = order.items[0].drug;

    // Load all vendors and all in-stock batches in one shot to keep DB round-trips minimal
    const [allVendors, allBatches] = await Promise.all([
      User.find({ role: "vendor", isActive: true }),
      Batch.find({ status: "in_stock", quantity: { $gt: 0 } }),
    ]);

    const urgency = order.urgency || "normal";
    let result;

    if (urgency === "urgent") {
      const hospital = order.hospital; // already populated
      const hospitalLocation = {
        lat: hospital.latitude ?? null,
        lng: hospital.longitude ?? null,
      };
      result = findNearestVendor(primaryDrugId, hospitalLocation, allVendors, allBatches);
    } else {
      result = findBestVendor(primaryDrugId, allVendors, allBatches);
    }

    if (!result) {
      return res.status(404).json({
        message: "No eligible vendor found with in-stock inventory for the requested drug",
      });
    }

    res.json({
      urgency,
      suggestedVendor: result.vendor,
      ...(result.distanceKm !== undefined && { distanceKm: result.distanceKm }),
      ...(result.score !== undefined && { score: result.score }),
      reason: result.reason,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not compute vendor suggestion", error: err.message });
  }
};

// ─── GET /api/insights/alerts — admin and hospital ──────────────────────────
//
// For each (hospital, drug) pair that has ConsumptionLog entries in the last
// 30 days, compute a burn rate and classify severity. Hospitals see only their
// own data; admin sees all hospitals.
//
// Response: array of { drug, hospital, severity, reasons, daysOfStockLeft }
//           sorted red → yellow → green.
const getAlerts = async (req, res) => {
  try {
    // Determine which hospitals to scope to
    const hospitalFilter =
      req.user.role === "hospital" ? { hospital: req.user._id } : {};

    // Load consumption logs for the last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [logs, batches] = await Promise.all([
      ConsumptionLog.find({ ...hospitalFilter, date: { $gte: since } })
        .populate("drug", "name genericName unit")
        .populate("hospital", "name location"),
      Batch.find({ status: "in_stock", quantity: { $gt: 0 } }),
    ]);

    // Group logs by hospital+drug
    const groups = {}; // key: `${hospitalId}::${drugId}`
    for (const log of logs) {
      if (!log.drug || !log.hospital) continue;
      const key = `${log.hospital._id}::${log.drug._id}`;
      if (!groups[key]) {
        groups[key] = { drug: log.drug, hospital: log.hospital, logs: [] };
      }
      groups[key].logs.push(log);
    }

    // For each group, compute current stock at that hospital for that drug
    const stockByHospitalDrug = {};
    for (const batch of batches) {
      if (!batch.currentLocation) continue;
      const key = `${batch.currentLocation}::${batch.drug}`;
      stockByHospitalDrug[key] = (stockByHospitalDrug[key] || 0) + batch.quantity;
    }

    const SEVERITY_ORDER = { red: 0, yellow: 1, green: 2 };
    const alerts = [];

    for (const [key, group] of Object.entries(groups)) {
      const burnRate = calculateBurnRate(group.logs);
      const currentQty = stockByHospitalDrug[key] || 0;
      const days = daysOfStockLeft(currentQty, burnRate);
      const { severity, reasons } = classifySeverity(days, group.drug);

      alerts.push({
        drug: group.drug,
        hospital: group.hospital,
        severity,
        reasons,
        daysOfStockLeft: days === Infinity ? null : parseFloat(days.toFixed(1)),
        currentStock: currentQty,
        burnRatePerDay: parseFloat(burnRate.toFixed(2)),
      });
    }

    alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

    // Push red/yellow alerts live to the affected hospital's dashboard.
    // Uses the existing role:hospital / user:<id> rooms joined in server.js —
    // no new socket wiring needed here.
    const io = req.app.get("io");
    if (io) {
      const urgent = alerts.filter((a) => a.severity === "red" || a.severity === "yellow");
      for (const alert of urgent) {
        io.to(`user:${alert.hospital._id}`).emit("stock:alert", alert);
      }
    }

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Could not compute alerts", error: err.message });
  }
};

// ─── GET /api/insights/redistribution — admin and hospital ──────────────────
//
// For every red or yellow alert produced by the alerts logic, check whether
// another hospital has comfortable surplus stock and can donate some. Returns
// an array of redistribution suggestions.
const getRedistribution = async (req, res) => {
  try {
    const hospitalFilter =
      req.user.role === "hospital" ? { hospital: req.user._id } : {};

    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Load everything needed in parallel
    const [logs, allBatches, allHospitals] = await Promise.all([
      ConsumptionLog.find({ ...hospitalFilter, date: { $gte: since } })
        .populate("drug", "name genericName unit"),
      Batch.find({ status: "in_stock", quantity: { $gt: 0 } }),
      User.find({ role: "hospital", isActive: true }, "name location"),
    ]);

    // Build burnRateByHospital per drug — needed by suggestRedistribution
    // Key: `${hospitalId}::${drugId}`
    const logsByHospitalDrug = {};
    for (const log of logs) {
      if (!log.drug) continue;
      const key = `${log.hospital}::${log.drug._id}`;
      if (!logsByHospitalDrug[key]) logsByHospitalDrug[key] = [];
      logsByHospitalDrug[key].push(log);
    }

    // Compute stock at each hospital per drug
    const stockByHospitalDrug = {};
    for (const batch of allBatches) {
      if (!batch.currentLocation) continue;
      const key = `${batch.currentLocation}::${batch.drug}`;
      stockByHospitalDrug[key] = (stockByHospitalDrug[key] || 0) + batch.quantity;
    }

    // Find all red/yellow hospital+drug pairs in scope
    const suggestions = [];
    const seen = new Set(); // avoid duplicate suggestions for the same pair

    for (const [key, groupLogs] of Object.entries(logsByHospitalDrug)) {
      const [hospitalId, drugId] = key.split("::");
      const drug = groupLogs[0].drug;

      const burnRate = calculateBurnRate(groupLogs);
      const currentQty = stockByHospitalDrug[key] || 0;
      const days = daysOfStockLeft(currentQty, burnRate);
      const { severity } = classifySeverity(days, drug);

      if (severity !== "red" && severity !== "yellow") continue;
      if (seen.has(key)) continue;
      seen.add(key);

      // Build a per-hospital burn rate map so the donor threshold can be computed
      const burnRateByHospital = {};
      for (const [k, hLogs] of Object.entries(logsByHospitalDrug)) {
        const [hid, did] = k.split("::");
        if (did === drugId) {
          burnRateByHospital[hid] = calculateBurnRate(hLogs);
        }
      }

      const suggestion = suggestRedistribution({
        drug,
        shortHospitalId: hospitalId,
        allBatches,
        allHospitals,
        burnRateByHospital,
      });

      if (suggestion) suggestions.push(suggestion);
    }

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: "Could not compute redistribution suggestions", error: err.message });
  }
};

module.exports = { suggestVendor, getAlerts, getRedistribution };