const Order = require("../models/Order");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Shipment = require("../models/Shipment");
const ConsumptionLog = require("../models/ConsumptionLog");
const Reminder = require("../models/Reminder");
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

// POST /api/insights/redistribution/remind — hospital only
//
// A hospital nudges admin about a pending redistribution recommendation
// that's still awaiting review. Stored so it's visible on the admin's
// Alerts/Redistribution pages even if no admin is online right now, and
// also pushed live over Socket.IO to any admin who is.
const sendReminder = async (req, res) => {
  try {
    const { fromHospital, drug, suggestedQuantity } = req.body;

    if (!fromHospital || !drug) {
      return res.status(400).json({ message: "fromHospital and drug are required" });
    }

    const reminder = await Reminder.create({
      fromHospital,
      toHospital: req.user._id, // the hospital sending the reminder is the one in need
      drug,
      suggestedQuantity,
    });

    const populated = await reminder.populate([
      { path: "fromHospital", select: "name location" },
      { path: "toHospital", select: "name location" },
      { path: "drug", select: "name genericName unit" },
    ]);

    const io = req.app.get("io");
    if (io) io.to("role:admin").emit("reminder:new", populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Could not send reminder", error: err.message });
  }
};

// GET /api/insights/reminders — admin only
// Recent reminders (last 14 days), newest first.
const getReminders = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const reminders = await Reminder.find({ createdAt: { $gte: since } })
      .populate("fromHospital", "name location")
      .populate("toHospital", "name location")
      .populate("drug", "name genericName unit")
      .sort({ createdAt: -1 });

    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: "Could not load reminders", error: err.message });
  }
};

// POST /api/insights/redistribution/approve — admin only
//
// Moves stock through the same lifecycle as a vendor delivery: pulls the
// requested quantity from the donor hospital's in-stock batches (FEFO —
// earliest-expiring first), splits/creates batch records for the
// transferred amount and marks them in_transit, then creates a Shipment
// (from: donor hospital, to: receiving hospital, no linked Order — this
// isn't a vendor delivery). It starts at "pending" — the existing
// PATCH /api/shipments/:id/status endpoint (already generic, not
// vendor-specific) is what an admin uses to progress it through
// in_transit → delivered, at which point the existing delivered-handler
// in shipmentController flips those batches to in_stock at the receiving
// hospital automatically. Nothing new needed there — reused as-is.
//
// Note: this does several sequential writes rather than a single Mongo
// transaction (multi-document transactions need a replica-set deployment,
// which this project doesn't assume). If stock genuinely changed between
// when the suggestion was computed and now, this may ship less than
// requested — the response reports exactly how much moved either way.
const approveRedistribution = async (req, res) => {
  try {
    const { fromHospital, toHospital, drug, quantity } = req.body;

    if (!fromHospital || !toHospital || !drug || !quantity) {
      return res.status(400).json({
        message: "fromHospital, toHospital, drug, and quantity are required",
      });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: "quantity must be a positive number" });
    }

    const sourceBatches = await Batch.find({
      drug,
      currentLocation: fromHospital,
      status: "in_stock",
      quantity: { $gt: 0 },
    }).sort({ expiryDate: 1 }); // FEFO — earliest-expiring donor stock ships first

    let remaining = quantity;
    const shipmentBatchIds = [];

    for (const batch of sourceBatches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);

      batch.quantity -= take;
      await batch.save();

      // In transit — no currentLocation until the shipment is delivered,
      // exactly like a vendor shipment's batches.
      const transitBatch = await Batch.create({
        batchNumber: `${batch.batchNumber}-RD${Date.now().toString().slice(-5)}`,
        drug: batch.drug,
        vendor: batch.vendor,
        currentLocation: null,
        quantity: take,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        status: "in_transit",
      });
      shipmentBatchIds.push(transitBatch._id);

      remaining -= take;
    }

    const shipped = quantity - remaining;

    if (shipped === 0) {
      return res.status(409).json({
        message: "No in-stock batches available at the donor hospital for this drug anymore — the situation may have changed since this suggestion was generated.",
      });
    }

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 2); // same 2-day default used elsewhere for local transfers

    const shipment = await Shipment.create({
      batches: shipmentBatchIds,
      from: fromHospital,
      to: toHospital,
      dispatchedAt: new Date(),
      expectedDelivery,
      status: "pending",
      trail: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Redistribution approved by admin",
        },
      ],
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${fromHospital}`).emit("shipment:update", shipment);
      io.to(`user:${toHospital}`).emit("shipment:update", shipment);
      io.to("role:admin").emit("shipment:update", shipment);
    }

    res.status(201).json({
      shipped,
      requested: quantity,
      partial: shipped < quantity,
      shipment,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not approve redistribution", error: err.message });
  }
};

module.exports = { suggestVendor, getAlerts, getRedistribution, sendReminder, getReminders, approveRedistribution };