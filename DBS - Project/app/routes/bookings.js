const express = require('express');
const { Program, Trainer, Booking, Payment } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings  { programId }
// One-click "Book Now": picks a trainer for the program's category, creates the
// booking, and records a (mocked) successful payment in the same request.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { programId } = req.body;
    if (!programId) return res.status(400).json({ error: 'programId is required.' });

    const program = await Program.findById(programId);
    if (!program || !program.isActive) return res.status(404).json({ error: 'Program not found.' });

    let trainer = await Trainer.findOne({ specialties: program.category });
    if (!trainer) trainer = await Trainer.findOne(); // fallback: any trainer
    if (!trainer) return res.status(503).json({ error: 'No trainers available right now.' });

    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // next-day placeholder slot

    const booking = await Booking.create({
      member: req.user.id,
      program: program._id,
      trainer: trainer._id,
      scheduledAt,
      status: 'confirmed',
    });

    const payment = await Payment.create({
      booking: booking._id,
      member: req.user.id,
      amount: program.price,
      currency: program.currency,
      method: 'card',
      status: 'paid',
      paidAt: new Date(),
    });

    const populated = await booking.populate([
      { path: 'program' },
      { path: 'trainer', populate: { path: 'user', select: 'name' } },
    ]);

    res.status(201).json({ booking: populated, payment });
  } catch (err) {
    console.error('create booking error:', err);
    res.status(500).json({ error: 'Could not complete the booking.' });
  }
});

// GET /api/bookings/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ member: req.user.id })
      .sort('-createdAt')
      .populate('program')
      .populate({ path: 'trainer', populate: { path: 'user', select: 'name' } })
      .lean();
    res.json(bookings);
  } catch (err) {
    console.error('list bookings error:', err);
    res.status(500).json({ error: 'Could not load your bookings.' });
  }
});

module.exports = router;
