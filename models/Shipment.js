const mongoose = require("mongoose");

const ShipmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],

    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // vendor
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // hospital

    dispatchedAt: { type: Date },
    expectedDelivery: { type: Date },
    deliveredAt: { type: Date },

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
