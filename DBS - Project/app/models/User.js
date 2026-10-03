const { Schema, model } = require('mongoose');

/**
 * USERS
 * Every person who can log in — members, trainers, and admins share this
 * collection. `role` decides what else applies:
 *   - "trainer" users get a matching Trainer document (see Trainer.js)
 *   - "member" users are the ones who create Bookings
 */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false }, // bcrypt hash, never store plaintext
    role: {
      type: String,
      enum: ['member', 'trainer', 'admin'],
      default: 'member',
    },
    avatarColor: { type: String, default: '#FF6B4A' }, // used for the initials-avatar bubble on cards
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true } // createdAt / updatedAt
);

module.exports = model('User', userSchema);
