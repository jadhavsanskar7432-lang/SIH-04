const express = require("express");
const router = express.Router();
const { register, login, getMe, getDemoAccounts } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/demo-accounts", getDemoAccounts); // public — dev QuickSwitch only

module.exports = router;