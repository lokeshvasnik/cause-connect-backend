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
    const from = process.env.SMTP_FROM || "no-reply@causeconnect.local";
    const subject = `Registration confirmed: ${event.title}`;
    const dateStr = new Date(event.date).toLocaleString();

    const text = [
        `Hi ${registration.name},`,
        "",
        `You're registered for "${event.title}".`,
        `Date: ${dateStr}`,
        `Location: ${event.location}`,
        `Attendees: ${registration.attendees}`,
        "",
        "If you have any questions, reply to this email.",
        "",
        "— Cause Connect",
    ].join("\n");

    const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6;color:#111">
      <p>Hi ${registration.name},</p>
      <p>You're registered for <strong>${event.title}</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${dateStr}</li>
        <li><strong>Location:</strong> ${event.location}</li>
        <li><strong>Attendees:</strong> ${registration.attendees}</li>
      </ul>
      ${registration.notes ? `<p><strong>Your notes:</strong> ${registration.notes}</p>` : ""}
      <p>If you have any questions, reply to this email.</p>
      <p>— Cause Connect</p>
    </div>
  `;

    await transporter.sendMail({
        from,
        to: registration.email,
        subject,
        text,
        html,
    });
}

module.exports = { sendRegistrationConfirmation };
