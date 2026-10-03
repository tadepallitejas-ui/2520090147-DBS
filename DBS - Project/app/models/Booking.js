const { Schema, model } = require('mongoose');

/**
 * BOOKINGS
 * A member booking a trainer for a program. This is what "My Bookings"
 * lists. One Booking can have at most one Payment (see Payment.js).
 */
const bookingSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
    scheduledAt: { type: Date, required: true }, // first/next session time
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'completed', 'cancelled'],
      default: 'pending_payment',
    },
    cancelledAt: { type: Date },
    cancelReason: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

bookingSchema.index({ member: 1, createdAt: -1 }); // powers "My Bookings" list
bookingSchema.index({ trainer: 1, scheduledAt: 1 }); // powers a trainer's schedule/availability check

module.exports = model('Booking', bookingSchema);
