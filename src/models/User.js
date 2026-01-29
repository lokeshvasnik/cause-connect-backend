const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, required: true, maxlength: 80 },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            unique: true,
        },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ["host", "volunteer", "admin"],
            required: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
