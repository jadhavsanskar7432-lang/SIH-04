const Order = require("../models/Order");

// Helper: emit socket events to hospital and (if assigned) vendor rooms.
// Wrapped in try/catch so a socket failure never breaks the HTTP response.
const emitOrderUpdate = (io, order) => {
  try {
    io.to(`user:${order.hospital}`).emit("order:update", order);
    if (order.vendor) {
      io.to(`user:${order.vendor}`).emit("order:update", order);
    }
  } catch (_) {
    // socket failure is non-fatal
  }
};

// POST /api/orders — hospital creates a request
const createOrder = async (req, res) => {
  try {
    const { items, priority, urgency, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required and must not be empty" });
    }

    const order = await Order.create({
      hospital: req.user._id,
      items,
      priority,
      urgency,
      notes,
      status: "requested",
    });

    emitOrderUpdate(req.app.get("io"), order);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not create order", error: err.message });
  }
};

// GET /api/orders — role-scoped list
const getOrders = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "hospital") {
      filter.hospital = req.user._id;
    } else if (req.user.role === "vendor") {
      filter.vendor = req.user._id;
    }
    // admin: no filter → sees all

    const orders = await Order.find(filter)
      .populate("hospital", "name email location")
      .populate("vendor", "name email location")
      .populate("items.drug")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch orders", error: err.message });
  }
};

// GET /api/orders/:id — fetch one, enforce ownership
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("hospital", "name email location")
      .populate("vendor", "name email location")
      .populate("items.drug");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // ownership check
    if (req.user.role === "hospital" && String(order.hospital._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied: not your order" });
    }
    if (req.user.role === "vendor" && (!order.vendor || String(order.vendor._id) !== String(req.user._id))) {
      return res.status(403).json({ message: "Access denied: not your order" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch order", error: err.message });
  }
};

// PATCH /api/orders/:id/approve — admin only
const approveOrder = async (req, res) => {
  try {
    const { vendor } = req.body;
    if (!vendor) return res.status(400).json({ message: "vendor id is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "requested") {
      return res.status(400).json({ message: `Cannot approve order with status "${order.status}"` });
    }

    order.status = "approved";
    order.vendor = vendor;
    await order.save();

    emitOrderUpdate(req.app.get("io"), order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not approve order", error: err.message });
  }
};

// PATCH /api/orders/:id/accept — vendor only (only the assigned vendor)
const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.vendor || String(order.vendor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied: you are not the assigned vendor" });
    }

    if (order.status !== "approved") {
      return res.status(400).json({ message: `Cannot accept order with status "${order.status}"` });
    }

    order.status = "accepted";
    await order.save();

    emitOrderUpdate(req.app.get("io"), order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not accept order", error: err.message });
  }
};

// PATCH /api/orders/:id/reject — vendor or admin
const rejectOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // vendor can only reject their own assigned order
    if (req.user.role === "vendor") {
      if (!order.vendor || String(order.vendor) !== String(req.user._id)) {
        return res.status(403).json({ message: "Access denied: you are not the assigned vendor" });
      }
    }

    order.status = "rejected";
    if (reason) order.notes = reason;
    await order.save();

    emitOrderUpdate(req.app.get("io"), order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not reject order", error: err.message });
  }
};

// PATCH /api/orders/:id/cancel — hospital (own order) or admin
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // hospital ownership check
    if (req.user.role === "hospital" && String(order.hospital) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied: not your order" });
    }

    if (!["requested", "approved"].includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel order with status "${order.status}" — only "requested" or "approved" orders can be cancelled`,
      });
    }

    order.status = "cancelled";
    await order.save();

    emitOrderUpdate(req.app.get("io"), order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not cancel order", error: err.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  approveOrder,
  acceptOrder,
  rejectOrder,
  cancelOrder,
};
