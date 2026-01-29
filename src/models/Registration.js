const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        name: { type: String, trim: true, required: true, maxlength: 80 },
        email: { type: String, trim: true, lowercase: true, required: true },
        phone: { type: String, trim: true, required: true },
        attendees: { type: Number, required: true, min: 1 },
        notes: { type: String, trim: true, maxlength: 1000 },
    },
    { timestamps: true },
);

registrationSchema.index({ eventId: 1, email: 1 }, { unique: false });

module.exports = mongoose.model("Registration", registrationSchema);
