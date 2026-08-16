const express = require("express");
const router = express.Router();
const { getDrugs, createDrug, getDrugById, updateDrug } = require("../controllers/drugController");
const { protect, restrictTo } = require("../middleware/auth");

router.get("/", protect, getDrugs);
router.get("/:id", protect, getDrugById);
router.post("/", protect, restrictTo("admin"), createDrug);
router.patch("/:id", protect, restrictTo("admin"), updateDrug);

module.exports = router;
