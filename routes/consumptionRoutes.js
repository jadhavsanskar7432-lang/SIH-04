const express = require("express");
const router = express.Router();
const { logConsumption, getConsumption } = require("../controllers/consumptionController");
const { protect, restrictTo } = require("../middleware/auth");

router.post("/", protect, restrictTo("hospital"), logConsumption);
router.get("/", protect, restrictTo("hospital", "admin"), getConsumption);

module.exports = router;
