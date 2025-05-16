const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentHash: { type: String, required: true },
  paymentRequest: String,
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  amount: Number,
  fee: Number,
  memo: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);