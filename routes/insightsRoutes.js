const express = require("express");
const router = express.Router();
const {
  suggestVendor,
  getAlerts,
  getRedistribution,
} = require("../controllers/insightsController");
const { protect, restrictTo } = require("../middleware/auth");

// GET /api/insights/suggest-vendor/:orderId — admin only
router.get("/suggest-vendor/:orderId", protect, restrictTo("admin"), suggestVendor);

// GET /api/insights/alerts — admin and hospital
router.get("/alerts", protect, restrictTo("admin", "hospital"), getAlerts);

// GET /api/insights/redistribution — admin and hospital
router.get("/redistribution", protect, restrictTo("admin", "hospital"), getRedistribution);

module.exports = router;
