const mongoose = require("mongoose");

// Covers both directions: a hospital raising a request, and the resulting
// supply order placed on a vendor once admin/procurement approves it.
const OrderItemSchema = new mongoose.Schema(
  {
    drug: { type: mongoose.Schema.Types.ObjectId, ref: "Drug", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // assigned on approval
    items: { type: [OrderItemSchema], required: true },

    status: {
      type: String,
      enum: [
        "requested",   // hospital raised it
        "approved",    // admin/procurement approved, vendor assigned
        "accepted",    // vendor accepted
        "dispatched",  // shipment created
        "delivered",
        "rejected",
        "cancelled",
      ],
      default: "requested",
    },

    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    // urgency drives vendor-matching logic: "urgent" → nearest vendor, "normal" → best-score vendor.
    // Intentionally separate from priority, which is the clinical triage level.
    urgency: { type: String, enum: ["urgent", "normal"], required: true, default: "normal" },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
