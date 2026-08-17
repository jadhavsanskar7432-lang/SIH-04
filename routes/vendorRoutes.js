const express = require("express");
const router = express.Router();
const { getVendors, getVendorById } = require("../controllers/vendorController");
const { protect, restrictTo } = require("../middleware/auth");

router.get("/", protect, restrictTo("admin"), getVendors);
router.get("/:id", protect, restrictTo("admin", "vendor"), getVendorById);

module.exports = router;
