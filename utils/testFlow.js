
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000/api";

const accounts = {
  admin: { email: "admin@pss04.gov.in", password: "admin123" },
  vendor: { email: "vendor1@pss04.gov.in", password: "vendor123" },
  hospital: { email: "hospital1@pss04.gov.in", password: "hospital123" },
};

let passCount = 0;
let failCount = 0;
const results = [];

function record(step, ok, detail) {
  results.push({ step, ok, detail });
  if (ok) passCount++;
  else failCount++;
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${step}${detail ? " — " + detail : ""}`);
}

async function request(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body — leave data null
  }

  return { status: res.status, ok: res.ok, data };
}

async function login(role) {
  const { email, password } = accounts[role];
  const { ok, status, data } = await request("POST", "/auth/login", {
    body: { email, password },
  });

  if (!ok) {
    record(`Login as ${role}`, false, `status ${status}: ${data?.message}`);
    return null;
  }

  record(`Login as ${role}`, true, `token acquired for ${data.user?.email}`);
  return { token: data.token, user: data.user };
}

async function run() {
  console.log(`\n--- PSS04 Golden Path Test — hitting ${BASE_URL} ---\n`);

  // 0. Health check
  const health = await request("GET", "/health");
  record("Server health check", health.ok, `status ${health.status}`);
  if (!health.ok) {
    console.log("\nServer isn't reachable — start it with `npm run dev` first.\n");
    return summarize();
  }

  // 1. Log in all three roles
  const admin = await login("admin");
  const vendor = await login("vendor");
  const hospital = await login("hospital");
  if (!admin || !vendor || !hospital) return summarize();

  // 2. Get a real drug ID to order (ICU Antibiotic Combo — matches the seeded shortage story)
  const drugsRes = await request("GET", "/drugs", { token: hospital.token });
  const icuDrug = drugsRes.data?.find((d) => d.name === "ICU Antibiotic Combo");
  record("Fetch drug catalog", drugsRes.ok && !!icuDrug, icuDrug ? `found "${icuDrug.name}"` : "ICU Antibiotic Combo not found — check seed data");
  if (!icuDrug) return summarize();

  // 3. Hospital creates an order
  const createOrder = await request("POST", "/orders", {
    token: hospital.token,
    body: {
      items: [{ drug: icuDrug._id, quantity: 50 }],
      priority: "critical",
      notes: "test:flow — ICU running low",
    },
  });
  record("Hospital creates order", createOrder.ok && createOrder.data?.status === "requested", `status: ${createOrder.data?.status}`);
  if (!createOrder.ok) return summarize();
  const orderId = createOrder.data._id;

  // 4. Admin approves, assigns vendor
  const approve = await request("PATCH", `/orders/${orderId}/approve`, {
    token: admin.token,
    body: { vendor: vendor.user.id },
  });
  record("Admin approves order", approve.ok && approve.data?.status === "approved", `status: ${approve.data?.status}`);
  if (!approve.ok) return summarize();

  // 5. Vendor accepts
  const accept = await request("PATCH", `/orders/${orderId}/accept`, { token: vendor.token });
  record("Vendor accepts order", accept.ok && accept.data?.status === "accepted", `status: ${accept.data?.status}`);
  if (!accept.ok) return summarize();

  // 6. Get a batch of this drug owned by this vendor, to ship
  const batchesRes = await request("GET", "/batches", { token: vendor.token }).catch(() => null);
  // fallback: batches route may not exist yet under this name — skip gracefully
  let batchId = null;
  if (batchesRes?.ok && Array.isArray(batchesRes.data)) {
    const match = batchesRes.data.find(
      (b) => b.drug === icuDrug._id || b.drug?._id === icuDrug._id
    );
    batchId = match?._id || null;
  }
  record(
    "Find a shippable batch",
    !!batchId,
    batchId ? `batch ${batchId}` : "no /api/batches route or no matching batch — shipment step will be skipped"
  );

  if (!batchId) {
    console.log("\nSkipping shipment + consumption steps (no batch found). Order flow itself is verified.\n");
    return summarize();
  }

  // 7. Vendor creates shipment (dispatch)
  const createShipment = await request("POST", "/shipments", {
    token: vendor.token,
    body: {
      order: orderId,
      batches: [batchId],
      expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  record("Vendor creates shipment", createShipment.ok && createShipment.data?.status === "pending", `status: ${createShipment.data?.status}`);
  if (!createShipment.ok) return summarize();
  const shipmentId = createShipment.data._id;

  // 8. Move to in_transit
  const inTransit = await request("PATCH", `/shipments/${shipmentId}/status`, {
    token: vendor.token,
    body: { status: "in_transit", note: "test:flow — left warehouse" },
  });
  record("Shipment: pending -> in_transit", inTransit.ok && inTransit.data?.status === "in_transit", `status: ${inTransit.data?.status}`);

  // 9. Move to delivered
  const delivered = await request("PATCH", `/shipments/${shipmentId}/status`, {
    token: vendor.token,
    body: { status: "delivered", note: "test:flow — arrived at hospital" },
  });
  record("Shipment: in_transit -> delivered", delivered.ok && delivered.data?.status === "delivered", `status: ${delivered.data?.status}`);

  // 10. Confirm the order flipped to delivered too
  const orderCheck = await request("GET", `/orders/${orderId}`, { token: hospital.token });
  record("Order auto-updates to delivered", orderCheck.ok && orderCheck.data?.status === "delivered", `status: ${orderCheck.data?.status}`);

  // 11. Hospital logs consumption
  const consumption = await request("POST", "/consumption", {
    token: hospital.token,
    body: { drug: icuDrug._id, quantityUsed: 10 },
  });
  record("Hospital logs consumption", consumption.ok, `status ${consumption.status}`);

  return summarize();
}

function summarize() {
  console.log(`\n--- Summary: ${passCount} passed, ${failCount} failed ---\n`);
  if (failCount > 0) {
    console.log("Failed steps:");
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.step}: ${r.detail}`));
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error("\nTest flow crashed:", err.message);
  process.exitCode = 1;
});