const { getAnalytics } = require("../services/analyticsService");

// GET /api/insights/analytics — admin only
const getAdminAnalytics = async (req, res) => {
    try {
        const { period = "30d" } = req.query;

        const allowedPeriods = ["7d", "30d", "90d"];

        if (!allowedPeriods.includes(period)) {
            return res.status(400).json({
                message: "Invalid period. Use 7d, 30d, or 90d.",
            });
        }

        const analytics = await getAnalytics(period);

        res.json(analytics);
    } catch (err) {
        console.error("[analyticsController]", err);

        res.status(500).json({
            message: "Could not generate admin analytics",
            error: err.message,
        });
    }
};

module.exports = {
    getAdminAnalytics,
};