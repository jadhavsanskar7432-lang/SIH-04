# PSS04 — Drug Inventory & Supply Chain Tracking — Backend

Node/Express + MongoDB backend for the SIH internal round (PSS04).

## Structure

config/ DB connection
models/ User, Drug, Batch, Order, Shipment, ConsumptionLog
controllers/ Route logic (auth done, drugs done as the pattern to copy)
routes/ Express routers
middleware/ JWT auth (protect + restrictTo role guard)
utils/ Token signing, Faker seed script
server.js Entry point (Express + Socket.io)


## Setup (PowerShell)

```powershell
cd pss04-backend
npm install
copy .env.example .env
```

Edit `.env` — at minimum set `MONGO_URI` (local Mongo or Atlas) and `JWT_SECRET`.

Seed demo data (5 vendors, 3 hospitals, 5 drugs, 20 batches, a 7-day
consumption trend for "ICU Antibiotic Combo" that's trending toward shortage
— useful for demoing the forecast engine later):

```powershell
npm run seed
```

Run the server:

```powershell
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

## Auth flow
- `POST /api/auth/register` — `{ name, email, password, role, location, contact }`, role is `vendor` | `hospital` | `admin`
- `POST /api/auth/login` — `{ email, password }` → returns `{ token, user }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`

Seeded accounts: `admin@pss04.gov.in` / `admin123`, `vendor1@pss04.gov.in` / `vendor123`, `hospital1@pss04.gov.in` / `hospital123`.

## What's built vs. what's next
Built: schema for all 6 core entities, JWT auth with role middleware, drug
CRUD as the reference pattern, Socket.io wired with role/user rooms for
the alert fan-out, Faker seed script.

Next, following your circuit map's tier order:
1. `Order` + `Shipment` routes/controllers (hospital request → admin approve → vendor accept → dispatch)
2. Consumption logging endpoint (feeds the forecast engine)
3. Forecast/alert engine — a moving-average stub in Node is enough for Day 2 AM; swap for the Python/pandas service later
4. Wire `io.to("role:hospital").emit(...)` etc. into the alert engine once it's live

Copy `drugController.js` + `drugRoutes.js` as the template for Order and Shipment — same protect/restrictTo pattern.