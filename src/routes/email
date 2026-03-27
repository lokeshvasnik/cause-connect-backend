const express = require("express");
const Joi = require("joi");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { sendRegistrationConfirmation } = require("../services/email");

const router = express.Router();

const querySchema = Joi.object({
    term: Joi.string().allow("").optional(),
    location: Joi.string().optional(),
    tag: Joi.string().optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(50).default(12),
    sort: Joi.string().valid("date:asc", "date:desc").default("date:asc"),
});

router.get("/", async (req, res) => {
    const { error, value } = querySchema.validate(req.query);
    if (error)
        return res
            .status(400)
            .json({ error: { code: "VALIDATION", message: error.message } });
    const { term, location, tag, dateFrom, dateTo, page, pageSize, sort } =
        value;

    const q = { status: "published" };
    if (term) {
        const rx = new RegExp(term.trim(), "i");
        q.$or = [
            { title: rx },
            { tag: rx },
            { location: rx },
            { description: rx },
        ];
    }
    if (location) q.location = new RegExp(location.trim(), "i");
    if (tag) q.tag = new RegExp(tag.trim(), "i");
    if (dateFrom || dateTo) {
        q.date = {};
        if (dateFrom) q.date.$gte = new Date(dateFrom);
        if (dateTo) q.date.$lte = new Date(dateTo);
    }

    const sortObj = { date: sort.endsWith("asc") ? 1 : -1 };

    try {
        const total = await Event.countDocuments(q);
        const items = await Event.find(q)
            .sort(sortObj)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();
        return res.json({ items, page, pageSize, total });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: "Failed to fetch events",
            },
        });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const attendeeAgg = await Registration.aggregate([
            {
                $group: {
                    _id: null,
                    totalAttendees: { $sum: "$attendees" },
                },
            },
        ]);
        const totalRegisteredUsers = attendeeAgg[0]?.totalAttendees || 0;

        const [completedCampaigns, activeCampaigns] = await Promise.all([
            Event.countDocuments({
                status: "published",
                date: { $lt: todayStart },
            }),
            Event.countDocuments({
                status: "published",
                date: { $gte: todayStart },
            }),
        ]);

        return res.json({
            totalRegisteredUsers,
            completedCampaigns,
            activeCampaigns,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: "Failed to fetch event stats",
            },
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).lean();
        if (!event)
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "Event not found" },
            });
        return res.json(event);
    } catch (err) {
        return res.status(400).json({
            error: { code: "VALIDATION", message: "Invalid event id" },
        });
    }
});

const registrationSchema = Joi.object({
    name: Joi.string().min(1).max(80).required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
        .pattern(/^(?:\+91|0)?[6-9]\d{9}$/)
        .required()
        .messages({
            "string.pattern.base": "Invalid Indian phone number",
        }),
    attendees: Joi.number().integer().min(1).required(),
    notes: Joi.string().max(1000).allow("").optional(),
});

router.post("/:id/registrations", async (req, res) => {
    const { error, value } = registrationSchema.validate(req.body);
    if (error)
        return res
            .status(400)
            .json({ error: { code: "VALIDATION", message: error.message } });
    try {
        const event = await Event.findById(req.params.id);
        if (!event || event.status !== "published") {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Event not found or not published",
                },
            });
        }
        const reg = await Registration.create({ eventId: event._id, ...value });
        await Event.updateOne(
            { _id: event._id },
            { $inc: { registrationsCount: 1 } },
        );
        // Fire-and-forget email confirmation; do not block the response
        (async () => {
            try {
                await sendRegistrationConfirmation({
                    registration: reg.toObject(),
                    event: event.toObject(),
                });
            } catch (emailErr) {
                console.error(
                    "Failed to send registration confirmation:",
                    emailErr,
                );
            }
        })();
        return res.status(201).json({
            id: reg._id,
            eventId: reg.eventId,
            name: reg.name,
            email: reg.email,
            phone: reg.phone,
            attendees: reg.attendees,
            notes: reg.notes,
            createdAt: reg.createdAt,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: { code: "SERVER_ERROR", message: "Failed to register" },
        });
    }
});

module.exports = router;
