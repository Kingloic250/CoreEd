const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { items: true, payments: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json(invoice);
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { studentId, studentName, semester, academicYear, totalAmount, dueDate, status, items } = req.body;
    if (!studentId || !totalAmount) {
      return res.status(400).json({ message: 'studentId and totalAmount are required.' });
    }

    const id = crypto.randomUUID();
    const invoice = await prisma.invoice.create({
      data: {
        id,
        studentId,
        studentName,
        semester,
        academicYear,
        totalAmount,
        dueDate,
        status: status ?? 'pending',
        items: items
          ? { create: items.map((item) => ({ id: crypto.randomUUID(), description: item.description, amount: item.amount })) }
          : undefined,
      },
      include: { items: true },
    });
    res.status(201).json(invoice);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const { status, dueDate, totalAmount } = req.body;
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status, dueDate, totalAmount },
    });
    res.json(updated);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
