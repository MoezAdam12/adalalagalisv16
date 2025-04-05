// models/financial/payment-application.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Payment Application Schema
 * Represents the application of payments to specific invoices
 */
const PaymentApplicationSchema = new Schema({
  payment_id: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  invoice_id: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a payment is applied to an invoice only once
PaymentApplicationSchema.index({ payment_id: 1, invoice_id: 1 }, { unique: true });

// Pre-save hook to update timestamp
PaymentApplicationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('PaymentApplication', PaymentApplicationSchema);
