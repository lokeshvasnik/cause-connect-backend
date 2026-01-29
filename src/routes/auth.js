const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/User");

const router = express.Router();

const signupSchema = Joi.object({
    name: Joi.string().min(1).max(80).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid("host", "volunteer", "admin").required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
});

router.post("/signup", async (req, res) => {
    const { error, value } = signupSchema.validate(req.body);
    if (error)
        return res
            .status(400)
            .json({ error: { code: "VALIDATION", message: error.message } });
    const { name, email, password, role } = value;
    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing)
            return res
                .status(409)
                .json({
                    error: {
                        code: "CONFLICT",
                        message: "Email already registered",
                    },
                });
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            role,
        });
        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );
        return res
            .status(201)
            .json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({
                error: { code: "SERVER_ERROR", message: "Failed to signup" },
            });
    }
});

router.post("/login", async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error)
        return res
            .status(400)
            .json({ error: { code: "VALIDATION", message: error.message } });
    const { email, password } = value;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res
                .status(401)
                .json({
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Invalid credentials",
                    },
                });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return res
                .status(401)
                .json({
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Invalid credentials",
                    },
                });
        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );
        return res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({
                error: { code: "SERVER_ERROR", message: "Failed to login" },
            });
    }
});

router.get("/me", async (req, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
        return res
            .status(401)
            .json({
                error: { code: "UNAUTHORIZED", message: "Missing token" },
            });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id).select(
            "_id name email role",
        );
        if (!user)
            return res
                .status(404)
                .json({
                    error: { code: "NOT_FOUND", message: "User not found" },
                });
        return res.json({ user });
    } catch (err) {
        return res
            .status(401)
            .json({
                error: { code: "UNAUTHORIZED", message: "Invalid token" },
            });
    }
});

module.exports = router;
