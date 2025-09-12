// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Gmail from .env
    pass: process.env.EMAIL_PASS, // App password from .env
  },
});

async function sendMail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: `"Logifi" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { transporter, sendMail };
