require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const drugRoutes = require("./routes/drugRoutes");
const orderRoutes = require("./routes/orderRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const consumptionRoutes = require("./routes/consumptionRoutes");
const batchRoutes = require("./routes/batchRoutes");
const insightsRoutes = require("./routes/insightsRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const procurementRoutes = require("./routes/procurementRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "*" },
});

// make io accessible in controllers via req.app.get("io")
app.set("io", io);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/consumption", consumptionRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/procurement", procurementRoutes);

// Socket.io: role-based rooms so alerts fan out only to the right dashboard
// (mirrors the "Alert & notification" node in the circuit map).
io.on("connection", (socket) => {
  socket.on("join", ({ role, userId }) => {
    if (role) socket.join(`role:${role}`);
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on("disconnect", () => { });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Server] PSS04 backend running on port ${PORT}`);
  });
};

start();