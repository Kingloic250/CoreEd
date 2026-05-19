const nodemailer = require('nodemailer');

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

const codes = new Map();

async function sendVerificationCode(email) {
  const code = makeCode();
  codes.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

  await transporter.sendMail({
    from: `"Greenfield Academy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}\nIt expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
  });

  return true;
}

function verifyCode(email, code) {
  const stored = codes.get(email);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    codes.delete(email);
    return false;
  }
  if (stored.code !== code) return false;
  codes.delete(email);
  return true;
}

module.exports = { sendVerificationCode, verifyCode };
