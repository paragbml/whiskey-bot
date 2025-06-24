require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(subject, text) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.ALERT_EMAIL,
    subject,
    text,
  });
  console.log('📧 Email sent:', subject);
}

async function sendSMS(message) {
  if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) return;
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: process.env.TARGET_PHONE,
  });
  console.log('📱 SMS sent:', message);
}

module.exports = { sendEmail, sendSMS };
