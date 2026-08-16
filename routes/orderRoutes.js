const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  approveOrder,
  acceptOrder,
  rejectOrder,
  cancelOrder,
} = require("../controllers/orderController");
const { protect, restrictTo } = require("../middleware/auth");

router.post("/", protect, restrictTo("hospital"), createOrder);
router.get("/", protect, getOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/approve", protect, restrictTo("admin"), approveOrder);
router.patch("/:id/accept", protect, restrictTo("vendor"), acceptOrder);
router.patch("/:id/reject", protect, restrictTo("vendor", "admin"), rejectOrder);
router.patch("/:id/cancel", protect, restrictTo("hospital", "admin"), cancelOrder);

module.exports = router;
