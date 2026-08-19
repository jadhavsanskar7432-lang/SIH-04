const Shipment = require("../models/Shipment");
const Order = require("../models/Order");
const Batch = require("../models/Batch");
const User = require("../models/User");
const { adjustReliability } = require("../services/vendorReliability");

// Valid status transitions for a shipment
const VALID_TRANSITIONS = {
  pending: ["in_transit"],
  in_transit: ["delivered"],
  // from any state
  _any: ["delayed", "failed"],
};

const isValidTransition = (from, to) => {
  if (VALID_TRANSITIONS._any.includes(to)) return true;
  return (VALID_TRANSITIONS[from] || []).includes(to);
};

// Helper: emit socket events to vendor (from) and hospital (to) rooms.
const emitShipmentUpdate = (io, shipment) => {
  try {
    io.to(`user:${shipment.from}`).emit("shipment:update", shipment);
    io.to(`user:${shipment.to}`).emit("shipment:update", shipment);
    // Admin dashboards aren't scoped to a single vendor/hospital, so also
    // fan out to the shared admin room (joined via the "join" handler below).
    io.to("role:admin").emit("shipment:update", shipment);
  } catch (_) {
    // socket failure is non-fatal
  }
};

// POST /api/shipments — vendor only
const createShipment = async (req, res) => {
  try {
    const { order: orderId, batches, expectedDelivery } = req.body;

    if (!orderId) return res.status(400).json({ message: "order id is required" });
    if (!batches || !Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({ message: "batches array is required and must not be empty" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Validate the order belongs to this vendor and is in the right state
    if (!order.vendor || String(order.vendor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied: this order is not assigned to you" });
    }
    if (order.status !== "accepted") {
      return res.status(400).json({
        message: `Cannot create shipment for order with status "${order.status}" — order must be "accepted"`,
      });
    }

    // Create the shipment
    const shipment = await Shipment.create({
      order: orderId,
      batches,
      from: req.user._id,
      to: order.hospital,
      expectedDelivery,
      dispatchedAt: new Date(),
      status: "pending",
      trail: [{ status: "pending", timestamp: new Date(), note: "Shipment created" }],
    });

    // Flip order to dispatched
    order.status = "dispatched";
    await order.save();

    // Flip all referenced batches to in_transit
    await Batch.updateMany({ _id: { $in: batches } }, { status: "in_transit", currentLocation: null });

    emitShipmentUpdate(req.app.get("io"), shipment);

    res.status(201).json(shipment);
  } catch (err) {
    res.status(500).json({ message: "Could not create shipment", error: err.message });
  }
};

// GET /api/shipments — role-scoped list
const getShipments = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "vendor") {
      filter.from = req.user._id;
    } else if (req.user.role === "hospital") {
      // Hospitals can be the recipient of a vendor delivery (to) OR the
      // donor in a redistribution transfer (from) — show both directions.
      filter.$or = [{ to: req.user._id }, { from: req.user._id }];
    }
    // admin: no filter → sees all

    const shipments = await Shipment.find(filter)
      .populate("order")
      .populate({ path: "batches", populate: { path: "drug" } })
      .populate("from", "name email location latitude longitude role")
      .populate("to", "name email location latitude longitude")
      .sort({ createdAt: -1 });

    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch shipments", error: err.message });
  }
};

// GET /api/shipments/:id — fetch one, enforce ownership
const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate("order")
      .populate({ path: "batches", populate: { path: "drug" } })
      .populate("from", "name email location latitude longitude role")
      .populate("to", "name email location latitude longitude");

    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    if (req.user.role === "vendor" && String(shipment.from._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied: not your shipment" });
    }
    if (
      req.user.role === "hospital" &&
      String(shipment.to._id) !== String(req.user._id) &&
      String(shipment.from._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied: not your shipment" });
    }

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch shipment", error: err.message });
  }
};

// PATCH /api/shipments/:id/status — vendor (owner) or admin
const updateShipmentStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    // vendor can only update their own shipment
    if (req.user.role === "vendor" && String(shipment.from) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied: not your shipment" });
    }

    // Validate transition
    if (!isValidTransition(shipment.status, status)) {
      return res.status(400).json({
        message: `Invalid status transition: "${shipment.status}" → "${status}"`,
      });
    }

    // Push to trail
    shipment.trail.push({ status, timestamp: new Date(), note: note || "" });
    shipment.status = status;

    if (status === "delivered") {
      shipment.deliveredAt = new Date();

      // On-time vs late: compare deliveredAt against expectedDelivery.
      // If expectedDelivery wasn't set on this shipment, leave deliveryStatus
      // null rather than guessing — nothing to compare against.
      if (shipment.expectedDelivery) {
        shipment.deliveryStatus =
          shipment.deliveredAt <= shipment.expectedDelivery ? "on_time" : "late";
      }

      // Flip the linked order to delivered — only vendor→hospital shipments
      // have one; redistribution transfers don't, so skip if unset.
      if (shipment.order) {
        await Order.findByIdAndUpdate(shipment.order, { status: "delivered" });
      }

      // Flip every batch: back in stock at the hospital (to)
      await Batch.updateMany(
        { _id: { $in: shipment.batches } },
        { status: "in_stock", currentLocation: shipment.to }
      );
    }

    if (status === "delayed" || status === "failed") {
      // TODO: re-trigger alert engine check
    }

    await shipment.save();

    // Adjust vendor reliability based on shipment outcome. Wrapped so a
    // reliability-update failure never blocks the shipment status response
    // (per BACKEND_TASKS.md Lane B requirements). Skipped for redistribution
    // transfers, where `from` is a donor hospital, not a vendor.
    const fromUser = await User.findById(shipment.from).select("role");
    if (fromUser?.role === "vendor" && ["delivered", "delayed", "failed"].includes(status)) {
      try {
        await adjustReliability(shipment.from, status);
      } catch (reliabilityErr) {
        console.error("[shipmentController] reliability update failed:", reliabilityErr.message);
      }
    }

    emitShipmentUpdate(req.app.get("io"), shipment);

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: "Could not update shipment status", error: err.message });
  }
};

module.exports = {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipmentStatus,
};