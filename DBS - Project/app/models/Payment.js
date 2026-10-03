const { Schema, model } = require('mongoose');

/**
 * PAYMENTS
 * One record per checkout attempt on a Booking. Kept separate from Booking
 * so a failed/retried payment doesn't overwrite history, and so refunds are
 * their own auditable event.
 */
const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['card', 'upi', 'paypal', 'wallet'], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    providerTransactionId: { type: String }, // id from the payment gateway (Stripe/Razorpay/etc.)
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ providerTransactionId: 1 }, { unique: true, sparse: true });

module.exports = model('Payment', paymentSchema);
