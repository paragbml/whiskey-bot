require('dotenv').config();
const nodemailer = require('nodemailer');

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

module.exports = { sendEmail };
