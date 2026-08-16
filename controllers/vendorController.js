const User = require("../models/User");

// Fields to return for vendor responses
const VENDOR_FIELDS = "name location contact reliabilityScore";

// GET /api/vendors  (admin only)
const getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" })
      .select(VENDOR_FIELDS)
      .sort({ reliabilityScore: -1 });

    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch vendors", error: err.message });
  }
};

// GET /api/vendors/:id  (admin: any vendor, vendor: own record only)
const getVendorById = async (req, res) => {
  try {
    // Vendor can only view their own record
    if (req.user.role === "vendor" && String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ message: "Access denied: you can only view your own vendor record" });
    }

    // Hospital (or any other non-admin, non-vendor role) should not reach here,
    // but guard just in case
    if (req.user.role !== "admin" && req.user.role !== "vendor") {
      return res.status(403).json({ message: `Access denied for role: ${req.user.role}` });
    }

    // Single query: find by ID AND ensure role is vendor
    const vendor = await User.findOne({ _id: req.params.id, role: "vendor" })
      .select(VENDOR_FIELDS);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch vendor", error: err.message });
  }
};


module.exports = { getVendors, getVendorById };
