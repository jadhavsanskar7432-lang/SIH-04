const mongoose = require("mongoose");

// A hospital's nudge to admin about a redistribution recommendation that
// hasn't been actioned yet. Purely informational — creating one doesn't
// trigger procurement or shipment logic, it just surfaces on the admin's
// Alerts/Redistribution pages so the request isn't silently missed.
const ReminderSchema = new mongoose.Schema(
  {
    fromHospital: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // has surplus
    toHospital: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // sent the reminder, needs stock
    drug: { type: mongoose.Schema.Types.ObjectId, ref: "Drug", required: true },
    suggestedQuantity: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", ReminderSchema);
