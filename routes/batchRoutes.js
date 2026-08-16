const express = require("express");
const router = express.Router();
const { getBatches, getBatchById, createBatch } = require("../controllers/batchController");
const { protect, restrictTo } = require("../middleware/auth");

router.get("/", protect, getBatches);
router.get("/:id", protect, getBatchById);
router.post("/", protect, restrictTo("admin", "vendor"), createBatch);

module.exports = router;
