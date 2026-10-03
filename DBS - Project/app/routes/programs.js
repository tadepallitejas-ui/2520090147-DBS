const express = require('express');
const { Program } = require('../models');

const router = express.Router();

// GET /api/programs
router.get('/', async (req, res) => {
  try {
    const programs = await Program.find({ isActive: true }).sort('createdAt').lean();
    res.json(programs);
  } catch (err) {
    console.error('list programs error:', err);
    res.status(500).json({ error: 'Could not load programs.' });
  }
});

module.exports = router;
