require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./models');

const authRoutes = require('./routes/auth');
const programRoutes = require('./routes/programs');
const bookingRoutes = require('./routes/bookings');
const trainerRoutes = require('./routes/trainers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trainers', trainerRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the frontend (home.html, login.html, styles.css) as static files
app.use(express.static(path.join(__dirname, 'public')));

async function start() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitwell');
  app.listen(PORT, () => console.log(`FitWell server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
