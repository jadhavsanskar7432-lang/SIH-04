const Drug = require("../models/Drug");
const Batch = require("../models/Batch");
const User = require("../models/User");
const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const ConsumptionLog = require("../models/ConsumptionLog");

const {
    calculateBurnRate,
    daysOfStockLeft,
} = require("./forecastEngine");

/**
 * Admin Analytics
 *
 * Returns one consolidated payload for the admin dashboard.
 *
 * Optional period:
 *   7d  -> last 7 days
 *   30d -> last 30 days (default)
 *   90d -> last 90 days
 */
const getAnalytics = async (period = "30d") => {
    const periodDays = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
    };

    const days = periodDays[period] || 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Load everything in parallel
    const [
        drugs,
        batches,
        hospitals,
        vendors,
        orders,
        shipments,
        consumptionLogs,
    ] = await Promise.all([
        Drug.find().lean(),

        Batch.find()
            .populate("drug", "name genericName category unit reorderThreshold criticalThreshold")
            .populate("currentLocation", "name role")
            .lean(),

        User.find({ role: "hospital", isActive: true })
            .select("name location")
            .lean(),

        User.find({ role: "vendor", isActive: true })
            .select("name location reliabilityScore")
            .lean(),

        Order.find({ createdAt: { $gte: since } })
            .populate("hospital", "name")
            .populate("vendor", "name reliabilityScore")
            .populate("items.drug", "name genericName unit")
            .lean(),

        Shipment.find({ createdAt: { $gte: since } })
            .populate("from", "name reliabilityScore")
            .populate("to", "name")
            .lean(),

        ConsumptionLog.find({ date: { $gte: since } })
            .populate("drug", "name genericName category unit")
            .populate("hospital", "name")
            .lean(),
    ]);

    // ============================================================
    // OVERVIEW
    // ============================================================

    const stockBatches = batches.filter(
        (b) => b.status === "in_stock" && b.quantity > 0
    );

    const totalStock = stockBatches.reduce(
        (sum, batch) => sum + batch.quantity,
        0
    );

    // Stock grouped by drug
    const stockByDrug = {};

    for (const batch of stockBatches) {
        if (!batch.drug) continue;

        const drugId = String(batch.drug._id);

        if (!stockByDrug[drugId]) {
            stockByDrug[drugId] = {
                drug: batch.drug,
                quantity: 0,
            };
        }

        stockByDrug[drugId].quantity += batch.quantity;
    }

    let lowStockDrugs = 0;
    let criticalStockDrugs = 0;

    const inventoryByDrug = drugs.map((drug) => {
        const entry = stockByDrug[String(drug._id)];
        const quantity = entry ? entry.quantity : 0;

        let stockStatus = "healthy";

        if (quantity <= drug.criticalThreshold) {
            stockStatus = "critical";
            criticalStockDrugs++;
        } else if (quantity <= drug.reorderThreshold) {
            stockStatus = "low";
            lowStockDrugs++;
        }

        return {
            drugId: drug._id,
            name: drug.name,
            genericName: drug.genericName,
            category: drug.category,
            unit: drug.unit,
            currentStock: quantity,
            reorderThreshold: drug.reorderThreshold,
            criticalThreshold: drug.criticalThreshold,
            stockStatus,
        };
    });

    // ============================================================
    // ORDERS
    // ============================================================

    const orderStatuses = [
        "requested",
        "approved",
        "accepted",
        "dispatched",
        "delivered",
        "rejected",
        "cancelled",
    ];

    const ordersByStatus = {};

    for (const status of orderStatuses) {
        ordersByStatus[status] = 0;
    }

    for (const order of orders) {
        if (ordersByStatus[order.status] !== undefined) {
            ordersByStatus[order.status]++;
        }
    }

    const ordersByPriority = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
    };

    const ordersByUrgency = {
        urgent: 0,
        normal: 0,
    };

    for (const order of orders) {
        if (ordersByPriority[order.priority] !== undefined) {
            ordersByPriority[order.priority]++;
        }

        if (ordersByUrgency[order.urgency] !== undefined) {
            ordersByUrgency[order.urgency]++;
        }
    }

    // ============================================================
    // SHIPMENTS
    // ============================================================

    const shipmentStatuses = [
        "pending",
        "in_transit",
        "delayed",
        "delivered",
        "failed",
    ];

    const shipmentsByStatus = {};

    for (const status of shipmentStatuses) {
        shipmentsByStatus[status] = 0;
    }

    let onTime = 0;
    let late = 0;

    for (const shipment of shipments) {
        if (shipmentsByStatus[shipment.status] !== undefined) {
            shipmentsByStatus[shipment.status]++;
        }

        if (shipment.deliveryStatus === "on_time") onTime++;
        if (shipment.deliveryStatus === "late") late++;
    }

    const completedDeliveries = onTime + late;

    const deliveryPerformance =
        completedDeliveries > 0
            ? parseFloat(((onTime / completedDeliveries) * 100).toFixed(1))
            : null;

    // ============================================================
    // CONSUMPTION
    // ============================================================

    let totalConsumed = 0;

    const consumptionByDrug = {};
    const consumptionByHospital = {};
    const dailyConsumptionMap = {};

    for (const log of consumptionLogs) {
        const quantity = log.quantityUsed || 0;

        totalConsumed += quantity;

        // Drug consumption
        if (log.drug) {
            const drugId = String(log.drug._id);

            if (!consumptionByDrug[drugId]) {
                consumptionByDrug[drugId] = {
                    drug: log.drug,
                    quantity: 0,
                };
            }

            consumptionByDrug[drugId].quantity += quantity;
        }

        // Hospital consumption
        if (log.hospital) {
            const hospitalId = String(log.hospital._id);

            if (!consumptionByHospital[hospitalId]) {
                consumptionByHospital[hospitalId] = {
                    hospital: log.hospital,
                    quantity: 0,
                };
            }

            consumptionByHospital[hospitalId].quantity += quantity;
        }

        // Daily trend
        const dateKey = new Date(log.date).toISOString().split("T")[0];

        dailyConsumptionMap[dateKey] =
            (dailyConsumptionMap[dateKey] || 0) + quantity;
    }

    const topConsumedDrugs = Object.values(consumptionByDrug)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
        .map((item) => ({
            drug: item.drug,
            quantityConsumed: item.quantity,
        }));

    const hospitalConsumption = Object.values(consumptionByHospital)
        .sort((a, b) => b.quantity - a.quantity)
        .map((item) => ({
            hospital: item.hospital,
            quantityConsumed: item.quantity,
        }));

    const dailyConsumption = Object.entries(dailyConsumptionMap)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, quantity]) => ({
            date,
            quantityConsumed: quantity,
        }));

    // ============================================================
    // INVENTORY BY HOSPITAL
    // ============================================================

    const stockByHospital = {};

    for (const batch of stockBatches) {
        if (!batch.currentLocation) continue;

        const hospitalId = String(batch.currentLocation._id);

        if (batch.currentLocation.role !== "hospital") continue;

        if (!stockByHospital[hospitalId]) {
            stockByHospital[hospitalId] = {
                hospital: batch.currentLocation,
                quantity: 0,
            };
        }

        stockByHospital[hospitalId].quantity += batch.quantity;
    }

    const inventoryByHospital = Object.values(stockByHospital)
        .sort((a, b) => b.quantity - a.quantity)
        .map((item) => ({
            hospital: item.hospital,
            totalStock: item.quantity,
        }));

    // ============================================================
    // EXPIRING BATCHES
    // ============================================================

    const now = new Date();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = batches
        .filter(
            (batch) =>
                batch.status === "in_stock" &&
                batch.quantity > 0 &&
                batch.expiryDate &&
                new Date(batch.expiryDate) >= now &&
                new Date(batch.expiryDate) <= thirtyDaysFromNow
        )
        .sort(
            (a, b) =>
                new Date(a.expiryDate) - new Date(b.expiryDate)
        )
        .map((batch) => ({
            batchId: batch._id,
            batchNumber: batch.batchNumber,
            drug: batch.drug,
            quantity: batch.quantity,
            expiryDate: batch.expiryDate,
            currentLocation: batch.currentLocation,
        }));

    // ============================================================
    // VENDOR PERFORMANCE
    // ============================================================

    const vendorStats = {};

    for (const vendor of vendors) {
        vendorStats[String(vendor._id)] = {
            vendor,
            shipments: 0,
            delivered: 0,
            onTime: 0,
            late: 0,
            failed: 0,
            delayed: 0,
        };
    }

    for (const shipment of shipments) {
        if (!shipment.from) continue;

        const vendorId = String(shipment.from._id);

        if (!vendorStats[vendorId]) continue;

        vendorStats[vendorId].shipments++;

        if (shipment.status === "delivered") {
            vendorStats[vendorId].delivered++;
        }

        if (shipment.deliveryStatus === "on_time") {
            vendorStats[vendorId].onTime++;
        }

        if (shipment.deliveryStatus === "late") {
            vendorStats[vendorId].late++;
        }

        if (shipment.status === "failed") {
            vendorStats[vendorId].failed++;
        }

        if (shipment.status === "delayed") {
            vendorStats[vendorId].delayed++;
        }
    }

    const vendorPerformance = Object.values(vendorStats)
        .map((item) => {
            const completed = item.onTime + item.late;

            return {
                vendor: {
                    _id: item.vendor._id,
                    name: item.vendor.name,
                    location: item.vendor.location,
                },
                reliabilityScore: item.vendor.reliabilityScore,
                totalShipments: item.shipments,
                delivered: item.delivered,
                onTime: item.onTime,
                late: item.late,
                delayed: item.delayed,
                failed: item.failed,
                onTimePercentage:
                    completed > 0
                        ? parseFloat(((item.onTime / completed) * 100).toFixed(1))
                        : null,
            };
        })
        .sort((a, b) => {
            return (b.reliabilityScore || 0) - (a.reliabilityScore || 0);
        });

    const averageVendorReliability =
        vendors.length > 0
            ? parseFloat(
                (
                    vendors.reduce(
                        (sum, vendor) => sum + (vendor.reliabilityScore || 0),
                        0
                    ) / vendors.length
                ).toFixed(1)
            )
            : 0;

    // ============================================================
    // RETURN COMPLETE DASHBOARD DATA
    // ============================================================

    return {
        period: {
            key: periodDays[period] ? period : "30d",
            days,
            from: since,
            to: new Date(),
        },

        overview: {
            totalDrugs: drugs.length,
            totalStock,
            lowStockDrugs,
            criticalStockDrugs,
            totalHospitals: hospitals.length,
            totalVendors: vendors.length,
        },

        orders: {
            total: orders.length,
            byStatus: ordersByStatus,
            byPriority: ordersByPriority,
            byUrgency: ordersByUrgency,
        },

        shipments: {
            total: shipments.length,
            byStatus: shipmentsByStatus,
            onTime,
            late,
            deliveryPerformance,
        },

        consumption: {
            totalConsumed,
            dailyTrend: dailyConsumption,
            topDrugs: topConsumedDrugs,
            byHospital: hospitalConsumption,
        },

        inventory: {
            byDrug: inventoryByDrug,
            byHospital: inventoryByHospital,
            expiringSoon,
        },

        vendors: {
            averageReliability: averageVendorReliability,
            performance: vendorPerformance,
        },
    };
};

module.exports = {
    getAnalytics,
};