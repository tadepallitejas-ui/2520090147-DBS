const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
    if (!email || !emailPattern.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !emailPattern.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!password) return res.status(400).json({ error: 'Password is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'Incorrect email or password.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Incorrect email or password.' });

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Something went wrong logging you in.' });
  }
});

module.exports = router;
