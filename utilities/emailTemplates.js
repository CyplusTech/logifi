// utils/emailTemplates.js

// 🏡 OTP Email for Lodge Posting
exports.generatePostLodgeOtpEmail = (name, otp) => {
return `
  <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f4f6f8; padding: 5px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header with Circular Logo -->
      <div style="background-color: #FBBF24; padding: 30px 20px; text-align: center;">
        <img src="https://res.cloudinary.com/dsxav7i7t/image/upload/v1757617627/logifi_uploads/light-logo.png"
             alt="Logifi Logo"
             style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto; border: 3px solid #fff;">
        <h2 style="color: #ffffff; margin-top: 15px; font-size: 22px; font-weight: 700;">Verify Your Submission</h2>
      </div>

      <!-- Body -->
      <div style="padding: 30px 25px; color: #333; font-size: 16px; line-height: 1.6;">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thanks for your interest in becoming an agent on <b>Logifi</b>. To complete your request and activate posting privileges, please verify your email by entering the OTP below in the form:</p>

        <div style="background: #f0f4ff; padding: 20px; margin: 20px 0; border-left: 5px solid #FBBF24; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">
          ${otp}
        </div>

        <p style="color: #888;">⚠️ This OTP will expire in <strong>5 minutes</strong>. After verification you will gain access to the agent area — look for the <strong>"Make a Post"</strong> button to create lodge listings. If you did not request this, you can ignore this message.</p>

        <p style="text-align: center; margin-top: 30px; color: #555;">– The Logifi Team 🏡</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #e5e7eb;">
        <p>&copy; ${new Date().getFullYear()} Logifi. All rights reserved.</p>
      </div>

    </div>
  </div>
`;
};
// 🏡 OTP Success Email for Lodge Posting
exports.generatePotLodgeVerificationSuccessEmail = (name) => {
  return `
  <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #eef2f7; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

      <!-- Header with Circular Logo -->
      <div style="background-color: #10b981; padding: 40px 20px; text-align: center;">
        <img src="https://res.cloudinary.com/dsxav7i7t/image/upload/v1757617627/logifi_uploads/light-logo.png"
             alt="Logifi Logo"
             style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto; border: 3px solid #ffffff;">
        <h2 style="color: #ffffff; margin-top: 20px; font-size: 24px; font-weight: 700;">Verification Completed!</h2>
      </div>

      <!-- Body -->
      <div style="padding: 30px 25px; color: #333333; font-size: 16px; line-height: 1.6;">
        <p style="margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px;">Congratulations! Your email/OTP has been successfully verified. You now have full access to the features of <b>Logifi</b>.</p>
        <p style="margin-bottom: 20px;">You can now make a post, manage your listings, and complete your KYC to earn a trusted badge. Visit the post page to start using these features immediately.</p>
        <p style="text-align: center; margin-top: 30px; color: #555555; font-style: italic;">– The Logifi Team 🏡</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 25px; text-align: center; font-size: 13px; color: #777777; border-top: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Logifi. All rights reserved.</p>
      </div>

    </div>
  </div>
  `;
};


// 📬 OTP Email for Contact Agent
exports.generateContactAgentOtpEmail = (name, otp) => {
  return `
  <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f4f6f8; padding: 10px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header with Circular Logo -->
      <div style="background-color: #FBBF24; padding: 30px 20px; text-align: center;">
        <img src="https://res.cloudinary.com/dsxav7i7t/image/upload/v1757617627/logifi_uploads/light-logo.png"
             alt="Logifi Logo"
             style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto; border: 3px solid #fff;">
        <h2 style="color: #ffffff; margin-top: 15px; font-size: 22px; font-weight: 700;">Verify Your Contact Request</h2>
      </div>

      <!-- Body -->
      <div style="padding: 30px 25px; color: #333; font-size: 16px; line-height: 1.6;">
        <p>Hi <strong>${name}</strong>,</p>
        <p>You requested to contact an agent via <b>Logifi</b>. To proceed, please verify your request using the One-Time Password (OTP) below:</p>

        <div style="background: #e0f7f2; padding: 20px; margin: 20px 0; border-left: 5px solid #FBBF24; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #10b981;">
          ${otp}
        </div>

        <p style="color: #888;">⚠️ This OTP will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>

        <p style="text-align: center; margin-top: 30px; color: #555;">Thank you for using <b>Logifi</b> – making house hunting easier </p>
        
        <p style="text-align: center; margin-top: 30px; color: #555;">– The Logifi Team 🏡</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #e5e7eb;">
        <p>&copy; ${new Date().getFullYear()} Logifi. All rights reserved.</p>
      </div>

    </div>
  </div>
  `;
};

// 📬 OTP Sucess Email for Contact Agent
exports.generateContactVerificationSuccessEmail = (name) => {
  return `
  <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #eef2f7; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

      <!-- Header with Circular Logo -->
      <div style="background-color: #10b981; padding: 40px 20px; text-align: center;">
        <img src="https://res.cloudinary.com/dsxav7i7t/image/upload/v1757617627/logifi_uploads/light-logo.png"
             alt="Logifi Logo"
             style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto; border: 3px solid #ffffff;">
        <h2 style="color: #ffffff; margin-top: 20px; font-size: 24px; font-weight: 700;">Verification Successful!</h2>
      </div>

      <!-- Body -->
      <div style="padding: 30px 25px; color: #333333; font-size: 16px; line-height: 1.6;">
        <p style="margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px;">Your email/OTP has been successfully verified. You can now safely communicate and interact with agents on <b>Logifi</b>.</p>
        <p style="text-align: center; margin-top: 30px; color: #555555; font-style: italic;">– The Logifi Team 🏡</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 25px; text-align: center; font-size: 13px; color: #777777; border-top: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Logifi. All rights reserved.</p>
      </div>

    </div>
  </div>
  `;
};


exports.contactEmail = (name, email, message) => {
  return `
 <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Smart Chat Review Modal with DB Submit</title>
</head>
<style>
    @media only screen and (max-width: 600px) {
    .email-container {
      width: 95% !important;
      padding: 20px !important;
    }
    .email-body {
      padding: 20px !important;
    }
    .cta-button {
      padding: 12px 20px !important;
      font-size: 15px !important;
    }
  }
</style>
<body>
  <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #eef2f7; padding: 10px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header with Circular Logo -->
      <div style="background-color: #FBBF24; padding: 30px 20px; text-align: center;">
        <img src="https://res.cloudinary.com/dsxav7i7t/image/upload/v1757427225/lodgifi_uploads/1757427224715-upload_0.png"
             alt="Logifi Logo"
             style="width: 100px; height: 100px; border-radius: 50%; display: block; margin: 0 auto; object-fit: cover; border: 3px solid #fff;">
        <h1 style="color: #ffffff; margin-top: 15px; font-size: 24px; font-weight: 700;">New Logifi Contact Message</h1>
      </div>

      <!-- Body -->
      <div style="padding: 35px 30px; color: #333333; font-size: 16px; line-height: 1.6;">
        <p style="margin-bottom: 15px;">Hello <strong>Admin</strong>,</p>
        <p style="margin-bottom: 25px;">You have received a new message via the Logifi contact form. Here are the details:</p>

        <!-- Highlighted Message Box -->
        <div style="background-color: #f0f4ff; padding: 25px 10px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #FBBF24; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
          <p style="margin: 12px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 12px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 12px 0;"><strong>Message:</strong><br/>${message}</p>
        </div>

        <p style="margin-bottom: 30px;">Please respond promptly to this message.</p>

        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="mailto:${email}" 
             style="text-decoration: none; background: linear-gradient(90deg, #2563eb, #1e40af); color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.3s ease;">
             Reply to Sender
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 25px; text-align: center; font-size: 13px; color: #777777; border-top: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Logifi. All rights reserved.</p>
        <p style="margin: 5px 0;">123 Logifi Street, Lagos, Nigeria</p>
      </div>

    </div>
  </div>
</body>
</html>

  `;
};
