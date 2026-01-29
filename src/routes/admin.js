const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");

const router = express.Router();

router.use(auth);
router.use(requireRole("admin"));

// Get all events with host details
router.get("/events", async (req, res) => {
    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "50", 10);
    try {
        const total = await Event.countDocuments();
        const events = await Event.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();

        // Get host details for each event
        const hostIds = [...new Set(events.map((e) => e.hostId))];
        const hosts = await User.find({ _id: { $in: hostIds } })
            .select("_id name email")
            .lean();
        const hostMap = Object.fromEntries(
            hosts.map((h) => [h._id.toString(), h]),
        );

        const items = events.map((e) => ({
            ...e,
            host: hostMap[e.hostId.toString()] || null,
        }));

        return res.json({ items, page, pageSize, total });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: "Failed to list events",
            },
        });
    }
});

// Get all registrations for an event
router.get("/events/:id/registrations", async (req, res) => {
    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "50", 10);
    try {
        const q = { eventId: req.params.id };
        const total = await Registration.countDocuments(q);
        const items = await Registration.find(q)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();
        return res.json({ items, page, pageSize, total });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: "Failed to list registrations",
            },
        });
    }
});

// Delete an event (admin can delete any event)
router.delete("/events/:id", async (req, res) => {
    try {
        const result = await Event.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0)
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Event not found",
                },
            });
        // Also delete all registrations for this event
        await Registration.deleteMany({ eventId: req.params.id });
        return res.status(204).send();
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: "Failed to delete event",
            },
        });
    }
});

// Get all hosts
router.get("/hosts", async (req, res) => {
    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "50", 10);
    try {
        const q = { role: "host" };
        const total = await User.countDocuments(q);
        const hosts = await User.find(q)
            .select("_id name email createdAt")
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();

        // Get event counts for each host
        const hostIds = hosts.map((h) => h._id);
        const eventCounts = await Event.aggregate([
            { $match: { hostId: { $in: hostIds } } },
            { $group: { _id: "$hostId", count: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(
            eventCounts.map((c) => [c._id.toString(), c.count]),
        );

        const items = hosts.map((h) => ({
            ...h,
            eventCount: countMap[h._id.toString()] || 0,
        }));

        return res.json({ items, page, pageSize, total });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: "Failed to list hosts",
            },
        });
    }
});

// Get dashboard statistics
router.get("/stats", async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const publishedEvents = await Event.countDocuments({
            status: "published",
        });
        const totalHosts = await User.countDocuments({ role: "host" });
        const totalVolunteers = await User.countDocuments({
            role: "volunteer",
        });
        const totalRegistrations = await Registration.countDocuments();

        return res.json({
            totalEvents,
            publishedEvents,
            totalHosts,
            totalVolunteers,
            totalRegistrations,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: { code: "SERVER_ERROR", message: "Failed to get stats" },
        });
    }
});

module.exports = router;
