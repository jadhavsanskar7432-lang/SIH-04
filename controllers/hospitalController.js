const User = require("../models/User");

// GET /api/hospitals — admin only
// Returns hospital users only, excludes password
const getHospitals = async (req, res) => {
  try {
    const hospitals = await User.find({ role: "hospital" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch hospitals", error: err.message });
  }
};

// PATCH /api/hospitals/:id/status — admin only
// Updates isActive status of a hospital user
const updateHospitalStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const hospital = await User.findOne({ _id: req.params.id, role: "hospital" });
    
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    hospital.isActive = isActive;
    await hospital.save();

    // Re-fetch to return without password
    const updatedHospital = await User.findById(hospital._id).select("-password");

    res.json(updatedHospital);
  } catch (err) {
    res.status(500).json({ message: "Could not update hospital status", error: err.message });
  }
};

module.exports = {
  getHospitals,
  updateHospitalStatus,
};
