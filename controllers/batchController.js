const Batch = require("../models/Batch");

// GET /api/batches — role-scoped list with optional ?drug and ?status filters
const getBatches = async (req, res) => {
  try {
    const { drug, status } = req.query;
    const filter = {};

    if (req.user.role === "vendor") {
      filter.vendor = req.user._id;
    } else if (req.user.role === "hospital") {
      filter.currentLocation = req.user._id;
    }
    // admin: no ownership filter → sees all

    if (drug) filter.drug = drug;
    if (status) filter.status = status;

    const batches = await Batch.find(filter)
      .populate("drug", "name unit")
      .populate("vendor", "name")
      .sort({ expiryDate: 1 }); // FEFO order

    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch batches", error: err.message });
  }
};

// GET /api/batches/:id — fetch one, enforce ownership
const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("drug", "name unit")
      .populate("vendor", "name");

    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (req.user.role === "vendor" && String(batch.vendor._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied: not your batch" });
    }
    if (
      req.user.role === "hospital" &&
      (!batch.currentLocation || String(batch.currentLocation) !== String(req.user._id))
    ) {
      return res.status(403).json({ message: "Access denied: batch is not at your location" });
    }

    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch batch", error: err.message });
  }
};

// POST /api/batches — admin or vendor only
// Vendors are forced to vendor = req.user._id to prevent cross-vendor stock creation.
const createBatch = async (req, res) => {
  try {
    const { batchNumber, drug, vendor, quantity, manufactureDate, expiryDate } = req.body;

    if (!batchNumber || !drug || !quantity || !manufactureDate || !expiryDate) {
      return res
        .status(400)
        .json({ message: "batchNumber, drug, quantity, manufactureDate, expiryDate are required" });
    }

    const resolvedVendor = req.user.role === "vendor" ? req.user._id : vendor;

    if (!resolvedVendor) {
      return res.status(400).json({ message: "vendor id is required" });
    }

    const batch = await Batch.create({
      batchNumber,
      drug,
      vendor: resolvedVendor,
      quantity,
      manufactureDate,
      expiryDate,
      status: "in_stock",
      currentLocation: null,
    });

    res.status(201).json(batch);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "A batch with this batchNumber already exists" });
    }
    res.status(500).json({ message: "Could not create batch", error: err.message });
  }
};

module.exports = { getBatches, getBatchById, createBatch };
