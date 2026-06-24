const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, folder } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const where = folder === 'sent'
      ? { senderId: userId }
      : { recipientId: userId };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    res.json(message);
  } catch (err) {
    console.error('Get message error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { senderId, senderName, senderRole, recipientId, recipientName, recipientRole, subject, body, parentId } = req.body;
    if (!senderId || !recipientId || !subject || !body) {
      return res.status(400).json({ message: 'senderId, recipientId, subject, and body are required.' });
    }

    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        senderId,
        senderName,
        senderRole,
        recipientId,
        recipientName,
        recipientRole,
        subject,
        body,
        parentId: parentId || null,
      },
    });
    res.status(201).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const existing = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Message not found.' });

    const updated = await prisma.message.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(updated);
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
