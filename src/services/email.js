const nodemailer = require("nodemailer");

function createTransport() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NODE_ENV } =
        process.env;
    if (SMTP_HOST && SMTP_PORT) {
        const port = Number(SMTP_PORT);
        const secure = port === 465; // common SSL port
        return nodemailer.createTransport({
            host: SMTP_HOST,
            port,
            secure,
            auth:
                SMTP_USER && SMTP_PASS
                    ? { user: SMTP_USER, pass: SMTP_PASS }
                    : undefined,
        });
    }
    // Fallback for local/dev: outputs the email as JSON to console
    if (NODE_ENV !== "production") {
        return nodemailer.createTransport({ jsonTransport: true });
    }
    throw new Error(
        "SMTP is not configured. Set SMTP_HOST/SMTP_PORT in environment.",
    );
}

const transporter = createTransport();

async function sendRegistrationConfirmation({ registration, event }) {
    console.log("📨 sendRegistrationConfirmation called", {
        to: registration.email,
        event: event.title,
    });

    const from = process.env.SMTP_FROM || "no-reply@causeconnect.local";
    const subject = `Registration confirmed: ${event.title}`;
    const dateStr = new Date(event.date).toLocaleString();

    try {
        console.log("🚀 Attempting to send email...");

        const info = await transporter.sendMail({
            from,
            to: registration.email,
            subject,
            text: `Hi ${registration.name}, you're registered for ${event.title}`,
            html: `<p>Hi ${registration.name}</p>`,
        });

        console.log("✅ Email sent successfully", {
            messageId: info.messageId,
            response: info.response,
        });
    } catch (error) {
        console.error("❌ Email sending failed", {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack,
        });
        throw error; // important so frontend knows it failed
    }
}

module.exports = { sendRegistrationConfirmation };
