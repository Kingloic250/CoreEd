const nodemailer = require('nodemailer');
const { redis } = require('../redis');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationCode(email) {
  const code = makeCode();
  await redis.set(`verify:${email}`, code, 'EX', 600);

  await transporter.sendMail({
    from: `"Greenfield Academy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}\nIt expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
  });

  return true;
}

async function verifyCode(email, code) {
  const stored = await redis.get(`verify:${email}`);
  if (!stored) return false;
  if (stored !== code) return false;
  await redis.del(`verify:${email}`);
  return true;
}

module.exports = { sendVerificationCode, verifyCode };
