// scripts/resetStaleData.js
//
// Run this whenever you've re-run `npm run seed` (which wipes Users/Drugs
// but NOT Orders/Shipments/Reminders). This clears out the now-orphaned
// Orders, Shipments, and Reminders so the app doesn't show
// "Unknown hospital" / "Unknown drug" everywhere.
//
// Usage: node scripts/resetStaleData.js

require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const Reminder = require("../models/Reminder");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[Reset] Connected to MongoDB.");

    const [orders, shipments, reminders] = await Promise.all([
      Order.deleteMany({}),
      Shipment.deleteMany({}),
      Reminder.deleteMany({}),
    ]);

    console.log(`[Reset] Deleted ${orders.deletedCount} orders.`);
    console.log(`[Reset] Deleted ${shipments.deletedCount} shipments.`);
    console.log(`[Reset] Deleted ${reminders.deletedCount} reminders.`);
    console.log("[Reset] Done. Your data is now consistent with the current seed.");

    process.exit(0);
  } catch (err) {
    console.error("[Reset] Failed:", err);
    process.exit(1);
  }
})();