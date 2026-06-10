const { Router } = require('express');
const { sendVerificationCode, verifyCode } = require('../services/mail');
const prisma = require('../db');

const router = Router();

router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    await sendVerificationCode(email);
    res.json({ message: 'Code sent' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });
  const ok = await verifyCode(email, code);
  if (!ok) return res.status(400).json({ message: 'Invalid or expired code' });
  try {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });
    res.json({ message: 'Verified' });
  } catch (err) {
    console.error('Verify update error:', err);
    res.status(500).json({ message: 'Failed to update verification status' });
  }
});

module.exports = router;
