const express = require("express");
const router = express.Router();
const {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipmentStatus,
} = require("../controllers/shipmentController");
const { protect, restrictTo } = require("../middleware/auth");

router.post("/", protect, restrictTo("vendor"), createShipment);
router.get("/", protect, getShipments);
router.get("/:id", protect, getShipmentById);
router.patch("/:id/status", protect, restrictTo("vendor", "admin"), updateShipmentStatus);

module.exports = router;
