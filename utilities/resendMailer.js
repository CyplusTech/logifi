// utils/mailer.js
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email via Resend
 * @param {Object} param0
 * @param {string} param0.to - recipient email
 * @param {string} param0.subject - subject line
 * @param {string} [param0.text] - plain text body
 * @param {string} [param0.html] - HTML body
 */
async function sendMail({ to, subject, text, html }) {
  try {
    const response = await resend.emails.send({
      from: "Logifi <onboarding@resend.dev>", // fixed sender for free tier
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", response.id);
    return response;
  } catch (error) {
    console.error("❌ Resend sendMail error:", error);
    if (error.response) {
      console.error(error.response.body); // detailed API errors
    }
    throw error;
  }
}

module.exports = { sendMail };
