const mongoose = require("mongoose");

// Daily consumption entries. The forecast + alert engine (Python service,
// or a Node-side moving-average stub for the MVP) reads this collection
// directly to predict shortages per hospital/drug.
const ConsumptionLogSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    drug: { type: mongoose.Schema.Types.ObjectId, ref: "Drug", required: true },
    quantityUsed: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

ConsumptionLogSchema.index({ hospital: 1, drug: 1, date: -1 });

module.exports = mongoose.model("ConsumptionLog", ConsumptionLogSchema);
