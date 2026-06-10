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
    from: `"${process.env.APP_NAME || 'Greenfield Academy'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}\nIt expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
  });

  return true;
}

async function sendInvitationEmail(email, firstName, lastName, token) {
  const appName = process.env.APP_NAME || 'Greenfield Academy';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${frontendUrl}/set-password?token=${token}`;

  await transporter.sendMail({
    from: `"${appName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `You've been added as a lecturer — ${appName}`,
    text: `Hello ${firstName} ${lastName},\n\nYou've been registered as a lecturer at ${appName}.\n\nClick the link below to set your password and activate your account:\n${link}\n\nThis link expires in 48 hours.\n\nIf you didn't expect this invitation, you can ignore this email.`,
    html: `<p>Hello <strong>${firstName} ${lastName}</strong>,</p>
<p>You've been registered as a lecturer at <strong>${appName}</strong>.</p>
<p>Click the button below to set your password and activate your account:</p>
<div style="text-align:center;margin:24px 0">
  <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Set Your Password</a>
</div>
<p style="color:#6b7280;font-size:14px">This link expires in 48 hours.<br>If you didn't expect this invitation, you can ignore this email.</p>`,
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

module.exports = { sendVerificationCode, sendInvitationEmail, verifyCode };
