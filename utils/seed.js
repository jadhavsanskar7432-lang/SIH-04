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
      })
    );
  }

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
      })
    );
  }

  console.log("[Seed] Creating drug catalog...");
  const drugs = await Drug.insertMany(DRUGS);

  console.log("[Seed] Creating 20 batches...");
  const batches = [];
  for (let i = 0; i < 20; i++) {
    const drug = faker.helpers.arrayElement(drugs);
    const vendor = faker.helpers.arrayElement(vendors);
    const location = faker.helpers.arrayElement([...hospitals, null]); // some in vendor warehouse
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

  console.log("[Seed] Creating 7 days of consumption logs (ICU antibiotic running low)...");
  const iculAntibiotic = drugs.find((d) => d.name === "ICU Antibiotic Combo");
  const targetHospital = hospitals[0];

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
