const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, location, contact } = req.body;

    if (!name || !email || !password || !role || !location) {
      return res.status(400).json({ message: "name, email, password, role, location are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const user = await User.create({ name, email, password, role, location, contact });
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
