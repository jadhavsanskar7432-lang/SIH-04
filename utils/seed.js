require("dotenv").config();
const { faker } = require("@faker-js/faker");
const connectDB = require("../config/db");
const User = require("../models/User");
const Drug = require("../models/Drug");
const Batch = require("../models/Batch");
const ConsumptionLog = require("../models/ConsumptionLog");

const DRUGS = [
  { name: "Amoxicillin 500mg", genericName: "Amoxicillin", category: "Antibiotic", unit: "strip" },
  { name: "Paracetamol 650mg", genericName: "Paracetamol", category: "Analgesic", unit: "strip" },
  { name: "ICU Antibiotic Combo", genericName: "Piperacillin-Tazobactam", category: "Antibiotic", unit: "vial" },
  { name: "Insulin Glargine", genericName: "Insulin", category: "Hormone", unit: "vial" },
  { name: "Normal Saline 500ml", genericName: "Sodium Chloride", category: "IV Fluid", unit: "bottle" },
];

const seed = async () => {
  await connectDB();
  console.log("[Seed] Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Drug.deleteMany({}),
    Batch.deleteMany({}),
    ConsumptionLog.deleteMany({}),
  ]);

  console.log("[Seed] Creating users...");
  const admin = await User.create({
    name: "System Admin",
    email: "admin@pss04.gov.in",
    password: "admin123",
    role: "admin",
    location: "Central Office",
  });

  // Hardcoded Maharashtra-region coordinates so haversine distances are
  // realistic and non-zero for the demo. Each vendor is in a different city.
  const VENDOR_COORDS = [
    { lat: 19.076, lng: 72.877 }, // Mumbai
    { lat: 18.520, lng: 73.856 }, // Pune
    { lat: 21.145, lng: 79.088 }, // Nagpur
    { lat: 19.997, lng: 73.789 }, // Nashik
    { lat: 16.700, lng: 74.243 }, // Kolhapur
  ];

  const vendors = [];
  for (let i = 0; i < 5; i++) {
    vendors.push(
      await User.create({
        name: `${faker.company.name()} Pharma`,
        email: `vendor${i + 1}@pss04.gov.in`,
        password: "vendor123",
        role: "vendor",
        location: faker.location.city(),
        contact: faker.phone.number(),
        reliabilityScore: faker.number.int({ min: 70, max: 100 }),
        latitude: VENDOR_COORDS[i].lat,
        longitude: VENDOR_COORDS[i].lng,
      })
    );
  }

  // Hospitals spread across Maharashtra so distance ranking is meaningful
  const HOSPITAL_COORDS = [
    { lat: 19.183, lng: 72.834 }, // Thane (near Mumbai vendor)
    { lat: 17.688, lng: 75.904 }, // Solapur (between Pune & Nagpur)
    { lat: 20.746, lng: 77.002 }, // Akola (central Maharashtra)
  ];

  const hospitals = [];
  for (let i = 0; i < 3; i++) {
    hospitals.push(
      await User.create({
        name: `${faker.location.city()} District Hospital`,
        email: `hospital${i + 1}@pss04.gov.in`,
        password: "hospital123",
        role: "hospital",
        location: faker.location.city(),
        contact: faker.phone.number(),
        latitude: HOSPITAL_COORDS[i].lat,
        longitude: HOSPITAL_COORDS[i].lng,
      })
    );
  }

  console.log("[Seed] Creating drug catalog...");
  const drugs = await Drug.insertMany(DRUGS);

  console.log("[Seed] Creating 20 batches...");
  // Reserved for the deliberate demo shortage batch below — excluded from the
  // random loop so no random roll can inflate stock for this exact pair and
  // mask the seeded shortage (this silently happened before: a random batch
  // landing on ICU Antibiotic Combo + hospitals[0] pushed severity to green).
  const demoIcuDrugName = "ICU Antibiotic Combo";
  const demoTargetHospitalIndex = 0;

  const batches = [];
  for (let i = 0; i < 20; i++) {
    let drug, location;
    do {
      drug = faker.helpers.arrayElement(drugs);
      location = faker.helpers.arrayElement([...hospitals, null]); // some in vendor warehouse
    } while (
      drug.name === demoIcuDrugName &&
      location &&
      location._id.equals(hospitals[demoTargetHospitalIndex]._id)
    );
    const vendor = faker.helpers.arrayElement(vendors);
    const manufactureDate = faker.date.past({ years: 1 });

    batches.push(
      await Batch.create({
        batchNumber: `BATCH-${faker.string.alphanumeric(8).toUpperCase()}`,
        drug: drug._id,
        vendor: vendor._id,
        currentLocation: location ? location._id : null,
        quantity: faker.number.int({ min: 10, max: 500 }),
        manufactureDate,
        expiryDate: faker.date.future({ years: 1, refDate: manufactureDate }),
        status: location ? "in_stock" : "in_transit",
      })
    );
  }

  // ── Demo shortage scenario ────────────────────────────────────────────────
  // Deliberately low stock — demo shortage scenario for ICU Antibiotic Combo
  // at targetHospital. Quantity = 60 vials; with a burn rate of ~11 units/day
  // (from the 7-day consumption log below) this gives ~5-6 days of stock left,
  // placing it firmly in the "red" severity zone (<7 days). This batch is
  // non-random so re-seeding always reproduces the same demo story.
  const iculAntibiotic = drugs.find((d) => d.name === "ICU Antibiotic Combo");
  const targetHospital = hospitals[0];
  const demoVendor = vendors[0]; // Mumbai vendor — closest to Thane hospital

  await Batch.create({
    batchNumber: "BATCH-DEMO-ICU01",
    drug: iculAntibiotic._id,
    vendor: demoVendor._id,
    currentLocation: targetHospital._id,
    quantity: 60,
    manufactureDate: new Date("2026-01-01"),
    expiryDate: new Date("2027-06-30"), // expiry is not the concern here — quantity is
    status: "in_stock",
  });
  // ─────────────────────────────────────────────────────────────────────────

  console.log("[Seed] Creating 7 days of consumption logs (ICU antibiotic running low)...");

  for (let day = 6; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    await ConsumptionLog.create({
      hospital: targetHospital._id,
      drug: iculAntibiotic._id,
      quantityUsed: faker.number.int({ min: 8, max: 15 }), // trending toward shortage
      date,
    });
  }

  console.log("[Seed] Done.");
  console.log(`  Admin login:    admin@pss04.gov.in / admin123`);
  console.log(`  Vendor login:   vendor1@pss04.gov.in / vendor123`);
  console.log(`  Hospital login: hospital1@pss04.gov.in / hospital123`);
  process.exit(0);
};

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});