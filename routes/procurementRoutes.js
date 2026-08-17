const express = require("express");
const { protect, restrictTo } = require("../middleware/auth");
const { recommendVendors } = require("../controllers/procurementController");

const router = express.Router();

router.get(
  "/recommend/:drugId",
  protect,
  restrictTo("admin"),
  recommendVendors
);

module.exports = router;