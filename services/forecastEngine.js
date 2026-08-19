/**
 * services/forecastEngine.js
 *
 * Pure-function forecast and redistribution helpers.
 * No DB access here — callers load the data and pass it in,
 * which keeps these functions unit-testable without mocking Mongoose.
 */

// ─── Burn-rate (moving average) ────────────────────────────────────────────

/**
 * calculateBurnRate(logs) → units/day
 *
 * Takes an array of ConsumptionLog documents (already filtered to one
 * hospital+drug pair), sums their quantityUsed, and divides by the number
 * of distinct calendar days spanned to produce a daily burn rate.
 *
 * Edge cases:
 *  - Empty or single-day logs → uses the span of 1 day so we don't divide by 0.
 *  - Zero total consumption  → returns 0 (caller decides what to do with it).
 *
 * @param {Array<{quantityUsed: number, date: Date}>} logs
 * @returns {number} average units consumed per day
 */
function calculateBurnRate(logs) {
  if (!logs || logs.length === 0) return 0;

  const totalUsed = logs.reduce((sum, l) => sum + (l.quantityUsed || 0), 0);

  // Distinct calendar days (earliest → latest date in the window)
  const dates = logs.map((l) => new Date(l.date).setHours(0, 0, 0, 0));
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const daySpan = Math.max(1, Math.round((maxDate - minDate) / 86_400_000) + 1);

  return totalUsed / daySpan;
}

// ─── Days of stock remaining ────────────────────────────────────────────────

/**
 * daysOfStockLeft(currentQuantity, burnRate) → number
 *
 * Simple projection: how many days will the current stock last at the
 * observed burn rate?  Returns Infinity when burnRate is 0 (no demand →
 * stock never runs out from consumption alone).
 *
 * @param {number} currentQuantity
 * @param {number} burnRate  units/day from calculateBurnRate
 * @returns {number}
 */
function daysOfStockLeft(currentQuantity, burnRate) {
  if (burnRate === 0) return Infinity;
  return currentQuantity / burnRate;
}

// ─── Severity classification ────────────────────────────────────────────────

/**
 * classifySeverity(daysLeft, drug) → { severity, reasons }
 *
 * Thresholds (easy to explain to judges):
 *   red    < 7 days  — critical shortage, order immediately
 *   yellow < 21 days — approaching reorder point, plan procurement
 *   green  ≥ 21 days — comfortable stock level
 *
 * `reasons` is a plain-English string[] explaining the classification
 * so the frontend can surface it directly without extra logic.
 *
 * @param {number} daysLeft
 * @param {{ name?: string }} drug  — drug document (name used in reason strings)
 * @returns {{ severity: "red"|"yellow"|"green", reasons: string[] }}
 */
function classifySeverity(daysLeft, drug) {
  const name = drug?.name || "this drug";
  const reasons = [];
  let severity;

  if (daysLeft === Infinity) {
    severity = "green";
    reasons.push(`No consumption recorded for ${name} — stock appears stable.`);
  } else if (daysLeft < 7) {
    severity = "red";
    reasons.push(
      `Only ${daysLeft.toFixed(1)} days of ${name} remaining at current usage rate.`
    );
    reasons.push("Immediate reorder required to prevent stockout.");
    if (daysLeft < 3) {
      reasons.push("Critical: supply may run out within 72 hours.");
    }
  } else if (daysLeft < 21) {
    severity = "yellow";
    reasons.push(
      `${daysLeft.toFixed(1)} days of ${name} remaining — within the 21-day reorder window.`
    );
    reasons.push("Plan procurement or consider redistribution from nearby hospitals.");
  } else {
    severity = "green";
    reasons.push(
      `${daysLeft.toFixed(1)} days of ${name} remaining — stock is adequate.`
    );
  }

  return { severity, reasons };
}

// ─── Redistribution suggestion ──────────────────────────────────────────────

/**
 * suggestRedistribution({ drug, shortHospitalId, allBatches, allHospitals })
 * → { fromHospital, toHospital, suggestedQuantity, reason } | null
 *
 * When a hospital has a red/yellow alert for a drug, this function scans
 * all OTHER hospitals' in-stock batches of that drug to find one that has
 * "comfortable" surplus — defined as quantity > reorderThreshold * 1.5
 * (50% headroom above their own safety stock, so the donor doesn't itself
 * go into shortage after giving stock away).
 *
 * reorderThreshold is approximated as burnRate × 21 (the yellow-zone
 * boundary). Since we don't load consumption logs here, the caller pre-
 * computes burnRateByHospital and passes it in.
 *
 * Returns null when no suitable donor hospital is found.
 *
 * @param {{
 *   drug: object,                          // populated Drug document
 *   shortHospitalId: string,               // ObjectId string of the needy hospital
 *   allBatches: Array,                     // all in-stock batches across all hospitals
 *   allHospitals: Array,                   // User documents with role=hospital
 *   burnRateByHospital: Object<string, number>  // { hospitalId: unitsPerDay }
 * }} params
 * @returns {{ fromHospital: object, toHospital: object, suggestedQuantity: number, reason: string } | null}
 */
function suggestRedistribution({
  drug,
  shortHospitalId,
  allBatches,
  allHospitals,
  burnRateByHospital,
}) {
  const drugStr = String(drug._id);

  // Group in-stock batch quantities at each hospital (excluding the short one)
  const stockByHospital = {};
  allBatches
    .filter(
      (b) =>
        String(b.drug) === drugStr &&
        b.status === "in_stock" &&
        b.quantity > 0 &&
        b.currentLocation != null &&
        String(b.currentLocation) !== shortHospitalId
    )
    .forEach((b) => {
      const hid = String(b.currentLocation);
      stockByHospital[hid] = (stockByHospital[hid] || 0) + b.quantity;
    });

  // Find the hospital with the most surplus above their reorder threshold
  let bestDonor = null;
  let bestSurplus = 0;

  for (const [hospitalId, totalStock] of Object.entries(stockByHospital)) {
    const burnRate = burnRateByHospital[hospitalId] || 0;
    // reorderThreshold = 21 days of stock (yellow zone boundary)
    const reorderThreshold = burnRate * 21;
    // Require 1.5× headroom so the donor stays safely above their own threshold
    const safetyFloor = reorderThreshold * 1.5;
    const surplus = totalStock - safetyFloor;

    if (surplus > 0 && surplus > bestSurplus) {
      bestSurplus = surplus;
      bestDonor = hospitalId;
    }
  }

  if (!bestDonor) return null;

  const fromHospital = allHospitals.find((h) => String(h._id) === bestDonor);
  const toHospital = allHospitals.find((h) => String(h._id) === shortHospitalId);

  if (!fromHospital || !toHospital) return null;

  // Suggest transferring half the surplus (conservative — leave some buffer)
  const suggestedQuantity = Math.floor(bestSurplus / 2);

  if (suggestedQuantity < 1) return null;

  return {
    drug,
    fromHospital,
    toHospital,
    suggestedQuantity,
    reason: `${fromHospital.name} has ~${Math.floor(bestSurplus)} units surplus of ${drug.name} above their safety stock. Transferring ${suggestedQuantity} units would cover the shortage at ${toHospital.name}.`,
  };
}

module.exports = {
  calculateBurnRate,
  daysOfStockLeft,
  classifySeverity,
  suggestRedistribution,
};
