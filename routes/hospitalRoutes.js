const express = require("express");
const router = express.Router();
const { getHospitals, updateHospitalStatus } = require("../controllers/hospitalController");
const { protect, restrictTo } = require("../middleware/auth");

router.get("/", protect, restrictTo("admin"), getHospitals);
router.patch("/:id/status", protect, restrictTo("admin"), updateHospitalStatus);

module.exports = router;
