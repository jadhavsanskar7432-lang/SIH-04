const ConsumptionLog = require("../models/ConsumptionLog");
const Batch = require("../models/Batch");

// POST /api/consumption — hospital only
// Creates a ConsumptionLog and decrements batch quantities using FEFO
// (First-Expiry-First-Out): earliest expiryDate is consumed first.
const logConsumption = async (req, res) => {
  try {
    const { drug, quantityUsed, date } = req.body;

    if (!drug) return res.status(400).json({ message: "drug id is required" });
    if (!quantityUsed || quantityUsed <= 0) {
      return res.status(400).json({ message: "quantityUsed must be a positive number" });
    }

    const hospitalId = req.user._id;

    // Create the consumption log entry
    const log = await ConsumptionLog.create({
      hospital: hospitalId,
      drug,
      quantityUsed,
      date: date ? new Date(date) : new Date(),
    });

    // FEFO: find in-stock batches for this drug at this hospital, ordered by earliest expiry first
    const batches = await Batch.find({
      drug,
      currentLocation: hospitalId,
      status: "in_stock",
      quantity: { $gt: 0 },
    }).sort({ expiryDate: 1 });

    let remaining = quantityUsed;

    for (const batch of batches) {
      if (remaining <= 0) break;

      if (batch.quantity <= remaining) {
        // This batch is fully consumed
        remaining -= batch.quantity;
        batch.quantity = 0;
        batch.status = "consumed";
      } else {
        // Partial consumption from this batch
        batch.quantity -= remaining;
        remaining = 0;
      }

      await batch.save();
    }

    // If remaining > 0, we ran out of stock — log still recorded but stock is at 0
    // (the alert engine will detect the shortage separately)

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: "Could not log consumption", error: err.message });
  }
};

// GET /api/consumption — hospital sees own; admin sees all
// Optional query params: ?drug=<id>&days=<n>
const getConsumption = async (req, res) => {
  try {
    const { drug, days } = req.query;

    let filter = {};

    if (req.user.role === "hospital") {
      filter.hospital = req.user._id;
    }
    // admin: no hospital filter → sees all

    if (drug) {
      filter.drug = drug;
    }

    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days, 10));
      filter.date = { $gte: cutoff };
    }

    const logs = await ConsumptionLog.find(filter)
      .populate("hospital", "name email location")
      .populate("drug", "name genericName unit")
      .sort({ date: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch consumption logs", error: err.message });
  }
};

module.exports = { logConsumption, getConsumption };
