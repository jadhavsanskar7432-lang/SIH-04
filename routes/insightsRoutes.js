const express = require("express");
const router = express.Router();

const {
  suggestVendor,
  getAlerts,
  getRedistribution,
} = require("../controllers/insightsController");

const {
  getAdminAnalytics,
} = require("../controllers/analyticsController");

const { protect, restrictTo } = require("../middleware/auth");

// GET /api/insights/suggest-vendor/:orderId — admin only
router.get(
  "/suggest-vendor/:orderId",
  protect,
  restrictTo("admin"),
  suggestVendor
);

// GET /api/insights/alerts — admin and hospital
router.get(
  "/alerts",
  protect,
  restrictTo("admin", "hospital"),
  getAlerts
);

// GET /api/insights/redistribution — admin and hospital
router.get(
  "/redistribution",
  protect,
  restrictTo("admin", "hospital"),
  getRedistribution
);

// GET /api/insights/analytics — admin only
router.get(
  "/analytics",
  protect,
  restrictTo("admin"),
  getAdminAnalytics
);

module.exports = router;