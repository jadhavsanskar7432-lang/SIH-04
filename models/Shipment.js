const mongoose = require("mongoose");

const ShipmentSchema = new mongoose.Schema(
  {
    // Optional: vendor→hospital shipments (created from an accepted Order)
    // set this. Hospital→hospital redistribution transfers don't have an
    // underlying Order, so this is left unset for those.
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],

    // "from"/"to" are generic Users, not necessarily vendor→hospital —
    // a redistribution transfer has a donor hospital as `from` and the
    // receiving hospital as `to`.
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    dispatchedAt: { type: Date },
    expectedDelivery: { type: Date },
    deliveredAt: { type: Date },

    // Computed once deliveredAt is set: "on_time" | "late". Null until delivered.
    // Compares deliveredAt against expectedDelivery — see updateShipmentStatus
    // in shipmentController.js. Dev 2's vendorReliability service should read
    // this field to adjust reliabilityScore on delivery (not yet wired here —
    // that file doesn't exist on this branch yet).
    deliveryStatus: {
      type: String,
      enum: ["on_time", "late", null],
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "in_transit", "delayed", "delivered", "failed"],
      default: "pending",
    },

    // simple stepper history for the frontend's status stepper UI
    trail: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", ShipmentSchema);