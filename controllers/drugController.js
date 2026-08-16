const Drug = require("../models/Drug");

// GET /api/drugs
const getDrugs = async (req, res) => {
  const drugs = await Drug.find().sort({ name: 1 });
  res.json(drugs);
};

// POST /api/drugs  (admin only)
const createDrug = async (req, res) => {
  try {
    const drug = await Drug.create(req.body);
    res.status(201).json(drug);
  } catch (err) {
    res.status(400).json({ message: "Could not create drug", error: err.message });
  }
};

// GET /api/drugs/:id
const getDrugById = async (req, res) => {
  const drug = await Drug.findById(req.params.id);
  if (!drug) return res.status(404).json({ message: "Drug not found" });
  res.json(drug);
};

// PATCH /api/drugs/:id  (admin only)
const updateDrug = async (req, res) => {
  const drug = await Drug.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!drug) return res.status(404).json({ message: "Drug not found" });
  res.json(drug);
};

module.exports = { getDrugs, createDrug, getDrugById, updateDrug };
