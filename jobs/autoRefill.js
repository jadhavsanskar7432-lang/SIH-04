/**
 * jobs/autoRefill.js
 *
 * Scheduled job that runs every 15 minutes to auto-create orders
 * for hospital+drug pairs that hit red severity (< 7 days of stock).
 *
 * Reuses:
 *   - orderController.js: buildOrder (shared order-creation logic)
 *   - forecastEngine.js: calculateBurnRate, daysOfStockLeft, classifySeverity
 *   - vendorMatching.js: findBestVendor
 *   - emailService.js: sendAutoRefillEmail
 *
 * Does NOT duplicate order-creation logic — calls buildOrder() which is
 * the same function orderController.createOrder uses internally.
 */

const cron = require("node-cron");

const Order = require("../models/Order"); // used for cooldown query only
const { buildOrder } = require("../controllers/orderController");
const Batch = require("../models/Batch");
const Drug = require("../models/Drug");
const User = require("../models/User");
const ConsumptionLog = require("../models/ConsumptionLog");

const { calculateBurnRate, daysOfStockLeft, classifySeverity } = require("../services/forecastEngine");
const { findBestVendor } = require("../services/vendorMatching");
const { sendAutoRefillEmail } = require("../services/emailService");

// ─── Config constants ─────────────────────────────────────────────────────

const COOLDOWN_HOURS = 24;          // skip if auto order exists from last 24h
const MAX_ORDER_QTY = 500;          // hard cap on auto-order quantity
const CONSUMPTION_LOOKBACK_DAYS = 30; // burn-rate window

// ─── Core logic ───────────────────────────────────────────────────────────

/**
 * Runs one pass of the auto-refill check.
 * Exported so it can be called directly in tests or manually.
 */
async function runAutoRefillCheck() {
  try {
    console.log("[AutoRefill] Running check…");

    // 1. Load all hospitals
    const hospitals = await User.find({ role: "hospital", isActive: true });

    if (hospitals.length === 0) {
      console.log("[AutoRefill] No active hospitals found, skipping.");
      return;
    }

    // 2. Load shared data once (same pattern as insightsController)
    const since = new Date();
    since.setDate(since.getDate() - CONSUMPTION_LOOKBACK_DAYS);

    const [allLogs, allBatches, allVendors, allDrugs] = await Promise.all([
      ConsumptionLog.find({ date: { $gte: since } }),
      Batch.find({ status: "in_stock", quantity: { $gt: 0 } }),
      User.find({ role: "vendor", isActive: true }),
      Drug.find({}),
    ]);

    // Build a map of drug ID → Drug document for quick lookup
    const drugMap = {};
    for (const d of allDrugs) {
      drugMap[String(d._id)] = d;
    }

    // 3. Group logs by hospital+drug (same as insightsController.getAlerts)
    const groups = {}; // key: `${hospitalId}::${drugId}`
    for (const log of allLogs) {
      const key = `${log.hospital}::${log.drug}`;
      if (!groups[key]) groups[key] = { hospitalId: String(log.hospital), drugId: String(log.drug), logs: [] };
      groups[key].logs.push(log);
    }

    // 4. Compute current stock per hospital+drug
    const stockByKey = {};
    for (const batch of allBatches) {
      if (!batch.currentLocation) continue;
      const key = `${batch.currentLocation}::${batch.drug}`;
      stockByKey[key] = (stockByKey[key] || 0) + batch.quantity;
    }

    // 5. For each group, check severity and auto-order if red
    let ordersCreated = 0;

    for (const [key, group] of Object.entries(groups)) {
      const burnRate = calculateBurnRate(group.logs);
      const currentQty = stockByKey[key] || 0;
      const days = daysOfStockLeft(currentQty, burnRate);
      const { severity } = classifySeverity(days, drugMap[group.drugId]);

      // Only auto-order for RED severity
      if (severity !== "red") continue;

      const hospital = hospitals.find((h) => String(h._id) === group.hospitalId);
      const drug = drugMap[group.drugId];

      if (!hospital || !drug) continue;

      // 6. Cooldown check: skip if an auto order for the same hospital+drug
      //    already exists from the last 24 hours
      const cooldownCutoff = new Date();
      cooldownCutoff.setHours(cooldownCutoff.getHours() - COOLDOWN_HOURS);

      const recentAutoOrder = await Order.findOne({
        hospital: hospital._id,
        origin: "auto",
        "items.drug": drug._id,
        createdAt: { $gte: cooldownCutoff },
      });

      if (recentAutoOrder) {
        console.log(`[AutoRefill] Cooldown active for ${drug.name} at ${hospital.name}, skipping.`);
        continue;
      }

      // 7. Find the best vendor using the existing vendorMatching service
      const vendorResult = findBestVendor(drug._id, allVendors, allBatches);

      if (!vendorResult) {
        console.log(`[AutoRefill] No vendor with stock for ${drug.name}, skipping.`);
        continue;
      }

      // 8. Calculate order quantity: up to reorderThreshold, capped at MAX_ORDER_QTY
      const targetQty = drug.reorderThreshold || 50;
      const orderQty = Math.min(targetQty, MAX_ORDER_QTY);

      // 9. Create the order via the shared buildOrder() from orderController
      const order = await buildOrder({
        hospital: hospital._id,
        vendor: vendorResult.vendor._id,
        items: [{ drug: drug._id, quantity: orderQty }],
        priority: "high",
        urgency: "urgent",
        origin: "auto",
        notes: `Auto-refill: ${days.toFixed(1)} days of stock remaining at current burn rate.`,
      });

      console.log(
        `[AutoRefill] Created order ${order._id} for ${drug.name} at ${hospital.name} ` +
        `(qty: ${orderQty}, vendor: ${vendorResult.vendor.name})`
      );

      // 10. Send email notification (never throws)
      await sendAutoRefillEmail({
        drug: drug.name,
        hospital: hospital.name,
        severity,
        daysOfStockRemaining: days === Infinity ? null : days,
        orderId: String(order._id),
      });

      ordersCreated++;
    }

    console.log(`[AutoRefill] Check complete. Orders created: ${ordersCreated}`);
  } catch (err) {
    // Top-level catch — job must never crash the server
    console.error("[AutoRefill] Error during check:", err.message);
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────

/**
 * Start the cron schedule. Called once from server.js after DB is connected.
 * Runs every 15 minutes.
 */
function startAutoRefillJob() {
  // "*/15 * * * *" = every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    runAutoRefillCheck();
  });

  console.log("[AutoRefill] Cron job scheduled — runs every 15 minutes.");
}

module.exports = { startAutoRefillJob, runAutoRefillCheck };
