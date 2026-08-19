// One-off diagnostic — NOT imported anywhere in the app. Run manually:
//
//   node scripts/checkOrphanedShipments.js
//
// Finds shipments whose `from` (vendor) or `to` (hospital) reference points
// to a User document that no longer exists — the cause of "Unknown Vendor" /
// "Unknown Hospital" showing up in the UI even though `from`/`to` are
// required fields on the Shipment schema. Populate silently returns null
// for a ref that doesn't resolve, so this only shows up at read time.
//
// Read-only. Does not modify any data.

require("dotenv").config();
const mongoose = require("mongoose");
const Shipment = require("../models/Shipment");
const User = require("../models/User");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const shipments = await Shipment.find({}).select("_id order from to status createdAt");
  const userIds = new Set(
    (await User.find({}).select("_id")).map((u) => String(u._id))
  );

  const orphaned = shipments.filter(
    (s) => !userIds.has(String(s.from)) || !userIds.has(String(s.to))
  );

  if (orphaned.length === 0) {
    console.log(`Checked ${shipments.length} shipments — no orphaned from/to references found.`);
  } else {
    console.log(`Checked ${shipments.length} shipments — ${orphaned.length} have a missing vendor/hospital:\n`);
    orphaned.forEach((s) => {
      const missingFrom = !userIds.has(String(s.from));
      const missingTo = !userIds.has(String(s.to));
      console.log(
        `  shipment ${s._id} (order ${s.order}, status "${s.status}", created ${s.createdAt.toISOString().slice(0, 10)}) ` +
        `— missing: ${[missingFrom && "from/vendor", missingTo && "to/hospital"].filter(Boolean).join(", ")}`
      );
    });
    console.log(
      "\nThese point to vendor/hospital accounts that were deleted after the shipment was created. " +
      "Either delete these test shipments, or re-run the create-shipment flow with an active vendor account."
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Diagnostic failed:", err.message);
  process.exit(1);
});
