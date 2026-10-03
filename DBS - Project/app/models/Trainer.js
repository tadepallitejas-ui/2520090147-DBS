const { Schema, model } = require('mongoose');

/**
 * TRAINERS
 * One-to-one extension of a User with role "trainer". Kept separate from
 * User so member accounts don't carry unused trainer fields, and so trainer
 * profile data (bio, specialties, rating) can be queried/indexed on its own.
 */
const trainerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, maxlength: 1000 },
    certifications: [{ type: String, trim: true }],
    specialties: [
      {
        type: String,
        enum: ['weight-loss', 'strength', 'yoga', 'home-workout', 'nutrition', 'mindfulness'],
      },
    ],
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    isCertified: { type: Boolean, default: false },
    yearsExperience: { type: Number, min: 0 },
  },
  { timestamps: true }
);

trainerSchema.index({ specialties: 1 });
trainerSchema.index({ ratingAvg: -1 });

module.exports = model('Trainer', trainerSchema);
