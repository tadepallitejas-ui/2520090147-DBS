const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitwell') {
  await mongoose.connect(uri);
  console.log('MongoDB connected:', uri);
  return mongoose.connection;
}

module.exports = {
  connectDB,
  User: require('./User'),
  Trainer: require('./Trainer'),
  Program: require('./Program'),
  Booking: require('./Booking'),
  Payment: require('./Payment'),
  Review: require('./Review'),
};
