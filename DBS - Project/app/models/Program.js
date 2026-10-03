const { Schema, model } = require('mongoose');

/**
 * PROGRAMS
 * Covers both "Workout Plans" and "Wellness Programs" from the nav — they're
 * the same shape (title, category, duration, price), so one collection with
 * a `category` field avoids duplicating logic across two near-identical
 * collections. Filter by category to render either nav section.
 */
const programSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    category: {
      type: String,
      required: true,
      enum: ['weight-loss', 'strength', 'yoga', 'home-workout', 'nutrition', 'mindfulness'],
    },
    tag: { type: String, trim: true }, // short label shown on the card, e.g. "Weight Loss"
    description: { type: String, required: true, maxlength: 500 },
    durationWeeks: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // store in smallest currency unit (paise) if going multi-currency
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true }, // soft-hide instead of deleting so past bookings still resolve
  },
  { timestamps: true }
);

programSchema.index({ category: 1, isActive: 1 });

module.exports = model('Program', programSchema);
