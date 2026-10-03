require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, User, Trainer, Program } = require('./models');

const programsData = [
  {
    title: 'Weight Loss Program',
    category: 'weight-loss',
    tag: 'Weight Loss',
    description: 'High-intensity intervals and metabolic conditioning to burn fat and build lasting habits.',
    durationWeeks: 8,
    price: 1499,
  },
  {
    title: 'Muscle Building Program',
    category: 'strength',
    tag: 'Strength',
    description: 'Progressive strength training with structured hypertrophy blocks and form coaching.',
    durationWeeks: 12,
    price: 1999,
  },
  {
    title: 'Yoga & Flexibility',
    category: 'yoga',
    tag: 'Wellness',
    description: 'Guided flows to improve mobility, reduce stress, and restore balance between sessions.',
    durationWeeks: 6,
    price: 999,
  },
  {
    title: 'Home Workout Plan',
    category: 'home-workout',
    tag: 'Home',
    description: 'No-equipment routines designed for small spaces and busy schedules — anywhere, anytime.',
    durationWeeks: 4,
    price: 699,
  },
];

const trainersData = [
  { name: 'Kavya Menon', email: 'kavya.trainer@fitwell.app', specialties: ['weight-loss'], bio: 'HIIT & metabolic conditioning coach.' },
  { name: 'Rohan Iyer', email: 'rohan.trainer@fitwell.app', specialties: ['strength'], bio: 'Strength & hypertrophy specialist.' },
  { name: 'Ananya Das', email: 'ananya.trainer@fitwell.app', specialties: ['yoga', 'mindfulness'], bio: 'Certified yoga and mobility instructor.' },
  { name: 'Vikram Shah', email: 'vikram.trainer@fitwell.app', specialties: ['home-workout'], bio: 'No-equipment home training coach.' },
];

async function seed() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitwell');

  await Program.deleteMany({});
  await Trainer.deleteMany({});
  await User.deleteMany({ role: 'trainer' });

  await Program.insertMany(programsData);
  console.log(`Seeded ${programsData.length} programs.`);

  const passwordHash = await bcrypt.hash('trainer123', 10);
  for (const t of trainersData) {
    const user = await User.create({ name: t.name, email: t.email, passwordHash, role: 'trainer' });
    await Trainer.create({ user: user._id, bio: t.bio, specialties: t.specialties, isCertified: true, ratingAvg: 4.9 });
  }
  console.log(`Seeded ${trainersData.length} trainers.`);

  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
