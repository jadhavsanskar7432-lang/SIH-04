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

// GET /api/auth/demo-accounts
//
// Public, read-only endpoint used ONLY by the dev QuickSwitch component.
// The fixed demo emails (admin@pss04.gov.in, hospital1-3@pss04.gov.in,
// vendor1-5@pss04.gov.in) and their passwords never change across reseeds —
// but the `name` faker generates for each vendor/hospital DOES change every
// time `npm run seed` runs. Hardcoding names in the frontend goes stale the
// moment someone reseeds. This endpoint returns the CURRENT real names so
// QuickSwitch always matches what's actually in the database.
//
// Only returns name/email/role — never passwords or ids. Safe to leave
// public since it's demo/dev convenience data, not sensitive info.
const DEMO_EMAILS = [
  "admin@pss04.gov.in",
  "hospital1@pss04.gov.in",
  "hospital2@pss04.gov.in",
  "hospital3@pss04.gov.in",
  "vendor1@pss04.gov.in",
  "vendor2@pss04.gov.in",
  "vendor3@pss04.gov.in",
  "vendor4@pss04.gov.in",
  "vendor5@pss04.gov.in",
];

const getDemoAccounts = async (req, res) => {
  try {
    const users = await User.find({ email: { $in: DEMO_EMAILS } }).select("name email role");

    // Preserve DEMO_EMAILS order (admin, hospitals, vendors) and skip any
    // that don't exist yet (e.g. before first seed).
    const byEmail = {};
    for (const u of users) byEmail[u.email] = u;

    const accounts = DEMO_EMAILS
      .filter((email) => byEmail[email])
      .map((email) => ({
        label: byEmail[email].name,
        email: byEmail[email].email,
        role: byEmail[email].role,
      }));

    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: "Could not load demo accounts", error: err.message });
  }
};

module.exports = { register, login, getMe, getDemoAccounts };