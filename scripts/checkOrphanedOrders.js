// One-off diagnostic — NOT imported anywhere in the app. Run manually:
//
//   node scripts/checkOrphanedOrders.js
//
// Finds orders whose `hospital`, `vendor`, or any `items[].drug` reference
// points to a document that no longer exists — the cause of "—" (hospital)
// and "? x<qty>" (drug) showing up in the Orders table even though those
// fields are required on the Order schema. Populate silently returns null
// for a ref that doesn't resolve, so this only shows up at read time.
//
// Read-only. Does not modify any data.

require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Drug = require("../models/Drug");
const User = require("../models/User");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const orders = await Order.find({}).select("_id hospital vendor items status createdAt");
  const userIds = new Set((await User.find({}).select("_id")).map((u) => String(u._id)));
  const drugIds = new Set((await Drug.find({}).select("_id")).map((d) => String(d._id)));

  const orphaned = orders.filter((o) => {
    const missingHospital = !userIds.has(String(o.hospital));
    const missingVendor = o.vendor && !userIds.has(String(o.vendor));
    const missingDrug = o.items.some((it) => !drugIds.has(String(it.drug)));
    return missingHospital || missingVendor || missingDrug;
  });

  if (orphaned.length === 0) {
    console.log(`Checked ${orders.length} orders — no orphaned references found.`);
  } else {
    console.log(`Checked ${orders.length} orders — ${orphaned.length} have a missing reference:\n`);
    orphaned.forEach((o) => {
      const missing = [];
      if (!userIds.has(String(o.hospital))) missing.push("hospital");
      if (o.vendor && !userIds.has(String(o.vendor))) missing.push("vendor");
      if (o.items.some((it) => !drugIds.has(String(it.drug)))) missing.push("drug(s) in items");
      console.log(
        `  order ${o._id} (status "${o.status}", created ${o.createdAt.toISOString().slice(0, 10)}) ` +
        `— missing: ${missing.join(", ")}`
      );
    });
    console.log(
      "\nThese point to hospital/vendor/drug documents deleted after the order was created " +
      "(likely test data cleanup). Delete these test orders, or ignore — they're cosmetic, not functional bugs."
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Diagnostic failed:", err.message);
  process.exit(1);
});
