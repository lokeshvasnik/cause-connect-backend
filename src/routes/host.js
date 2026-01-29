const express = require("express");
const Joi = require("joi");
const { auth, requireRole } = require("../middleware/auth");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

const router = express.Router();

const eventSchema = Joi.object({
    title: Joi.string().min(1).max(120).required(),
    date: Joi.date().iso().required(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional(),
    tag: Joi.string().min(1).max(60).required(),
    location: Joi.string().min(1).max(120).required(),
    description: Joi.string().min(1).max(2000).required(),
    image: Joi.string().uri().optional(),
    status: Joi.string().valid("draft", "published", "cancelled").optional(),
});

router.use(auth);
router.use(requireRole("host"));

router.get("/events", async (req, res) => {
    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "12", 10);
    try {
        const q = { hostId: req.user.id };
        const total = await Event.countDocuments(q);
        const items = await Event.find(q)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();
        return res.json({ items, page, pageSize, total });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to list events",
                },
            });
    }
});

router.post("/events", async (req, res) => {
    const { error, value } = eventSchema.validate(req.body);
    if (error)
        return res
            .status(400)
            .json({ error: { code: "VALIDATION", message: error.message } });
    try {
        if (
            (value.startTime && !value.endTime) ||
            (!value.startTime && value.endTime)
        ) {
            return res
                .status(400)
                .json({
                    error: {
                        code: "VALIDATION",
                        message:
                            "Both startTime and endTime must be provided together",
                    },
                });
        }
        if (value.startTime && value.endTime) {
            const s = new Date(value.startTime);
            const e = new Date(value.endTime);
            if (!(e > s)) {
                return res
                    .status(400)
                    .json({
                        error: {
                            code: "VALIDATION",
                            message: "endTime must be after startTime",
                        },
                    });
            }
        }
        const evt = await Event.create({
            ...value,
            date: new Date(value.date),
            startTime: value.startTime ? new Date(value.startTime) : undefined,
            endTime: value.endTime ? new Date(value.endTime) : undefined,
            hostId: req.user.id,
        });
        return res.status(201).json(evt);
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to create event",
                },
            });
    }
});

router.patch("/events/:id", async (req, res) => {
    const { error, value } = eventSchema
        .fork(
            [
                "title",
                "date",
                "startTime",
                "endTime",
                "tag",
                "location",
                "description",
                "image",
                "status",
            ],
            (s) => s.optional(),
        )
        .validate(req.body);
    if (error)
        return res
            .status(400)
            .json({ error: { code: "VALIDATION", message: error.message } });
    try {
        const evt = await Event.findOne({
            _id: req.params.id,
            hostId: req.user.id,
        });
        if (!evt)
            return res
                .status(404)
                .json({
                    error: {
                        code: "NOT_FOUND",
                        message: "Event not found or unauthorized",
                    },
                });
        Object.assign(evt, value);
        if (value.date) evt.date = new Date(value.date);
        if (Object.prototype.hasOwnProperty.call(value, "startTime")) {
            evt.startTime = value.startTime
                ? new Date(value.startTime)
                : undefined;
        }
        if (Object.prototype.hasOwnProperty.call(value, "endTime")) {
            evt.endTime = value.endTime ? new Date(value.endTime) : undefined;
        }
        if (evt.startTime && evt.endTime && !(evt.endTime > evt.startTime)) {
            return res
                .status(400)
                .json({
                    error: {
                        code: "VALIDATION",
                        message: "endTime must be after startTime",
                    },
                });
        }
        await evt.save();
        return res.json(evt);
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to update event",
                },
            });
    }
});

router.delete("/events/:id", async (req, res) => {
    try {
        const result = await Event.deleteOne({
            _id: req.params.id,
            hostId: req.user.id,
        });
        if (result.deletedCount === 0)
            return res
                .status(404)
                .json({
                    error: {
                        code: "NOT_FOUND",
                        message: "Event not found or unauthorized",
                    },
                });
        return res.status(204).send();
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to delete event",
                },
            });
    }
});

router.get("/events/:id/registrations", async (req, res) => {
    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "12", 10);
    try {
        const evt = await Event.findOne({
            _id: req.params.id,
            hostId: req.user.id,
        }).select("_id");
        if (!evt)
            return res
                .status(404)
                .json({
                    error: {
                        code: "NOT_FOUND",
                        message: "Event not found or unauthorized",
                    },
                });
        const q = { eventId: evt._id };
        const total = await Registration.countDocuments(q);
        const items = await Registration.find(q)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();
        return res.json({ items, page, pageSize, total });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({
                error: {
                    code: "SERVER_ERROR",
                    message: "Failed to list registrations",
                },
            });
    }
});

module.exports = router;
