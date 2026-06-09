const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const { uploadBuffer } = require('../services/cloudinary');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId } = req.query;
    const where = courseId ? { courseId } : {};
    const materials = await prisma.courseMaterial.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(materials);
  } catch (err) {
    console.error('Get materials error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, uploadDocument.single('file'), async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { title, type, courseId, courseName, description } = req.body;
    if (!title || !courseId) return res.status(400).json({ message: 'Title and courseId are required.' });

    let fileUrl = null;
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, {
        folder: 'coreed/materials',
        publicId: crypto.randomUUID(),
      });
      fileUrl = result.secure_url;
    }

    const id = crypto.randomUUID();
    const material = await prisma.courseMaterial.create({
      data: {
        id, title,
        type: type ?? 'reading',
        courseId, courseName: courseName ?? null,
        fileName: fileUrl ?? req.body.fileUrl ?? null,
        description: description ?? null,
        uploadedBy: req.user.id,
      },
    });
    res.status(201).json(material);
  } catch (err) {
    console.error('Create material error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    await prisma.courseMaterial.delete({ where: { id: req.params.id } });
    res.json({ message: 'Material deleted.' });
  } catch (err) {
    console.error('Delete material error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
