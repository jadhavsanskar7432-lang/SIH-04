const User = require("../models/User");
const Batch = require("../models/Batch");
const Shipment = require("../models/Shipment");
const { scoreVendorsForDrug } = require("../services/procurementScoring");

const recommendVendors = async (req, res) => {
  const { drugId } = req.params;

  const allVendors = await User.find({ role: "vendor" });

  const allBatches = await Batch.find({ drug: drugId });

  const allShipments = await Shipment.find({
    status: "delivered",
  });

  const results = scoreVendorsForDrug(
    drugId,
    allVendors,
    allBatches,
    allShipments
  );

  res.json(results);
};

module.exports = { recommendVendors };