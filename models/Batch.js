const mongoose = require("mongoose");

// A batch is a physical lot of a drug, tied to a location (hospital or
// vendor warehouse) at any given time. FEFO (First-Expiry-First-Out)
// sorting in the intelligence layer reads expiryDate off this model.
const BatchSchema = new mongoose.Schema(
  {
    batchNumber: { type: String, required: true, unique: true },
    drug: { type: mongoose.Schema.Types.ObjectId, ref: "Drug", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // current holder of this batch — null while in transit (see Shipment)
    currentLocation: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    quantity: { type: Number, required: true, min: 0 },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["in_stock", "in_transit", "consumed", "expired", "recalled"],
      default: "in_stock",
    },
  },
  { timestamps: true }
);

BatchSchema.index({ drug: 1, currentLocation: 1, status: 1 });
BatchSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("Batch", BatchSchema);
