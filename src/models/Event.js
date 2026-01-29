const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        title: { type: String, trim: true, required: true, maxlength: 120 },
        date: { type: Date, required: true },
        // Optional explicit start and end times (full ISO datetimes)
        startTime: { type: Date },
        endTime: { type: Date },
        tag: { type: String, trim: true, required: true, maxlength: 60 },
        location: { type: String, trim: true, required: true, maxlength: 120 },
        description: {
            type: String,
            trim: true,
            required: true,
            maxlength: 2000,
        },
        image: { type: String, trim: true },
        status: {
            type: String,
            enum: ["draft", "published", "cancelled"],
            default: "published",
        },
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        registrationsCount: { type: Number, default: 0 },
    },
    { timestamps: true },
);

// Simple indexes for common queries
eventSchema.index({ hostId: 1 });
// For text search, we can use regex in queries; optionally define a text index:
// eventSchema.index({ title: 'text', tag: 'text', location: 'text', description: 'text' });

module.exports = mongoose.model("Event", eventSchema);
