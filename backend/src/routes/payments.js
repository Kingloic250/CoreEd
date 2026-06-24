const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, invoiceId } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (invoiceId) where.invoiceId = invoiceId;

    const payments = await prisma.payment.findMany({
      where,
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: true },
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    res.json(payment);
  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { invoiceId, studentId, amount, method, reference, paidAt } = req.body;
    if (!invoiceId || !amount || !method) {
      return res.status(400).json({ message: 'invoiceId, amount, and method are required.' });
    }

    const id = crypto.randomUUID();
    const payment = await prisma.payment.create({
      data: {
        id,
        invoiceId,
        studentId,
        amount,
        method,
        reference,
        paidAt: paidAt || new Date().toISOString(),
      },
    });
    res.status(201).json(payment);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
