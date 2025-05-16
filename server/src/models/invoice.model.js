const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  memo: String,
  amount: Number,
  paymentHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'settled', 'expired'], default: 'pending' },
  settledAt: Date,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);