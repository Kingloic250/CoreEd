const { Router } = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { uploadBuffer } = require('../services/cloudinary');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ message: 'Email already in use.' });
      }
      data.email = email;
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided.' });

    const result = await uploadBuffer(req.file.buffer, {
      folder: 'coreed/avatars',
      publicId: req.user.id,
      transformation: { width: 256, height: 256, crop: 'fill', format: 'webp' },
    });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: result.secure_url },
    });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Failed to upload avatar.' });
  }
});

module.exports = router;
