const { Router } = require('express');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const { uploadBuffer, destroyFile } = require('../services/cloudinary');

const router = Router();

router.post('/', authenticate, uploadDocument.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required.' });

    const publicId = crypto.randomUUID();
    const folder = req.body.folder || 'coreed/uploads';
    const result = await uploadBuffer(req.file.buffer, {
      folder,
      publicId,
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
