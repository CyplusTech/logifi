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



// sendMail({
//   to: "chigozieemmanueladim@gmail.com",
//   subject: "Your Logifi Agent Login Details",
// html: `
//   <div style="background:#f6f8fb;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
//     <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

//       <!-- Header -->
//       <div style="background:#1f2937;padding:20px 30px;color:#ffffff;">
//         <h2 style="margin:0;font-size:20px;">Logifi Agent Portal</h2>
//       </div>

//       <!-- Body -->
//       <div style="padding:30px;color:#111827;">

//         <h3 style="margin-top:0;">Greetings 👋</h3> 

//         <p style="font-size:14px;color:#374151;">
//           Your agent account has been successfully created. Below are your login credentials:
//         </p>

//         <!-- Credentials Box -->
//         <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:15px 20px;margin:20px 0;">
//           <p style="margin:0 0 10px;"><strong>Email:</strong> chigozieemmanueladim@gmail.com</p>
//           <p style="margin:0;"><strong>Password:</strong> CHEl654$</p>
//         </div>

//         <!-- CTA Button -->
//         <div style="text-align:center;margin:30px 0;">
//           <a href="https://www.mylogifi.com/agent/login/auth"
//              style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:bold;">
//             Login to Your Account
//           </a>
//         </div>

//         <p style="font-size:13px;color:#6b7280;">
//           If the button doesn't work, copy and paste this link into your browser:
//         </p>

//         <p style="font-size:13px;word-break:break-all;color:#2563eb;">
//           https://www.mylogifi.com/agent/login/auth
//         </p>

//         <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;">

//         <p style="font-size:12px;color:#9ca3af;">
//           ⚠️ Please keep your credentials safe and do not share them with anyone.
//         </p>

//       </div>

//       <!-- Footer -->
//       <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#6b7280;">
//         © ${new Date().getFullYear()} Logifi. All rights reserved.
//       </div>

//     </div>
//   </div>
// `
// });
module.exports = { sendMail };
