const { Schema, model } = require('mongoose');

/**
 * REVIEWS
 * Powers the "Member Stories" testimonials and trainer star ratings.
 * A review is left by a member after a completed Booking.
 */
const reviewSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 600 },
    isFeatured: { type: Boolean, default: false }, // hand-picked for the homepage testimonial grid
  },
  { timestamps: true }
);

reviewSchema.index({ trainer: 1 });
reviewSchema.index({ booking: 1 }, { unique: true }); // one review per booking

module.exports = model('Review', reviewSchema);
