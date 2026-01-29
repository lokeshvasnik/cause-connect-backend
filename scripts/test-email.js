require("dotenv").config();
const { sendRegistrationConfirmation } = require("../src/services/email");

async function main() {
    const registration = {
        name: "Test User",
        email: process.env.TEST_EMAIL || "lokeshvasnik2003@gmail.com",
        attendees: 2,
        notes: "Looking forward to it!",
    };
    const event = {
        title: "Community Clean-Up",
        date: new Date().toISOString(),
        location: "Central Park",
    };
    await sendRegistrationConfirmation({ registration, event });
    console.log(
        "Sent test registration confirmation (or printed JSON in dev).",
    );
}

main().catch((err) => {
    console.error("Test email failed:", err);
    process.exit(1);
});
