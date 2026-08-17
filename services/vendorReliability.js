const User = require("../models/User");

// How much the reliability score changes for each shipment outcome
const OUTCOME_CHANGES = {
  delivered: 1,
  delayed: -5,
  failed: -15,
};

const adjustReliability = async (vendorId, outcome) => {
  if (!OUTCOME_CHANGES.hasOwnProperty(outcome)) {
    throw new Error(
      `Invalid outcome "${outcome}" — use "delivered", "delayed", or "failed"`
    );
  }

  const vendor = await User.findById(vendorId);

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  if (vendor.role !== "vendor") {
    throw new Error("User is not a vendor");
  }

  const change = OUTCOME_CHANGES[outcome];
  const newScore = vendor.reliabilityScore + change;

  // Keep score within allowed range (0 to 100)
  vendor.reliabilityScore = Math.min(100, Math.max(0, newScore));

  await vendor.save();

  return vendor;
};

module.exports = { adjustReliability };