const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendRegistrationConfirmation({ registration, event }) {
    console.log("📨 sendRegistrationConfirmation called", {
        to: registration.email,
        event: event.title,
    });

    const dateStr = new Date(event.date).toLocaleString();

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

    try {
        console.log("🚀 Attempting to send email to", registration.email);

        const response = await resend.emails.send({
            from: "Cause Connect <onboarding@lokeshvasnik.codes>",
            to: registration.email,
            subject: `Registration confirmed: ${event.title}`,
            html,
        });

        console.log("✅ Email sent successfully", {
            response: response,
            id: response?.data?.id || response?.id,
        });
    } catch (error) {
        console.error("❌ Email sending failed", {
            message: error.message,
            stack: error.stack,
        });
        throw error;
    }
}

module.exports = { sendRegistrationConfirmation };
