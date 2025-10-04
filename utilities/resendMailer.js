// utils/mailer.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, text, html }) {
  try {
    const response = await resend.emails.send({
      from: "Logifi <support@mylogifi.com>",  // ✅ now using your domain
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", response?.id || response?.data?.id || "no id");
    return response;
  } catch (error) {
    console.error("❌ Resend sendMail error:", error.message || error);
    if (error.response) {
      console.error("API Response:", error.response.body);
    }
    throw error;
  }
}

module.exports = { sendMail };
