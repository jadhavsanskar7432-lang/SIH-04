const mongoose = require("mongoose");

// Master catalog entry. Actual stock quantities live on Batch documents
// (a drug can have many batches with different expiries/vendors).
const DrugSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    category: { type: String, trim: true }, // e.g. "Antibiotic", "Analgesic"
    unit: { type: String, default: "units" }, // strip, vial, box, etc.
    reorderThreshold: { type: Number, default: 50 }, // triggers 🟡/🔴 classifier
    criticalThreshold: { type: Number, default: 15 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Drug", DrugSchema);
