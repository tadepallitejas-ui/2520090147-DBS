const express = require('express');
const { Trainer } = require('../models');

const router = express.Router();

// GET /api/trainers
router.get('/', async (req, res) => {
  try {
    const trainers = await Trainer.find()
      .populate('user', 'name')
      .sort('-ratingAvg')
      .lean();
    res.json(trainers);
  } catch (err) {
    console.error('list trainers error:', err);
    res.status(500).json({ error: 'Could not load trainers.' });
  }
});

module.exports = router;
