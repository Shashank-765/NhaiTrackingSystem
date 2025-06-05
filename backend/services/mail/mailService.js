const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send credentials function
const sendCredentials = async (email, name, uniqueId, password, role) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your NHAI Account Credentials',
      html: `
        <h2>Welcome to NHAI Portal</h2>
        <p>Dear ${name},</p>
        <p>Your account has been created as ${role}. Here are your login credentials:</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Best regards,<br>NHAI Team</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

module.exports = {
  sendCredentials
};