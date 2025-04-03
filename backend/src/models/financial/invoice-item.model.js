// models/financial/invoice-item.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Invoice Item Schema
 * Represents individual line items in an invoice
 */
const InvoiceItemSchema = new Schema({
  invoice_id: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax_rate: {
    type: Number,
    default: 0,
    min: 0
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  case_id: {
    type: Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  contract_id: {
    type: Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  service_id: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    default: null
  },
  time_entry_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'TimeEntry'
  }],
  expense_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Expense'
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate amounts
InvoiceItemSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.quantity * this.unit_price;
  
  // Calculate discount amount
  if (this.discount_rate > 0) {
    this.discount_amount = (this.subtotal * this.discount_rate) / 100;
  } else {
    this.discount_amount = 0;
  }
  
  // Calculate tax amount (applied after discount)
  const taxableAmount = this.subtotal - this.discount_amount;
  if (this.tax_rate > 0) {
    this.tax_amount = (taxableAmount * this.tax_rate) / 100;
  } else {
    this.tax_amount = 0;
  }
  
  // Calculate total amount
  this.total_amount = taxableAmount + this.tax_amount;
  
  this.updated_at = new Date();
  next();
});

// Post-save hook to update invoice totals
InvoiceItemSchema.post('save', async function() {
  await updateInvoiceTotals(this.invoice_id);
});

// Post-remove hook to update invoice totals
InvoiceItemSchema.post('remove', async function() {
  await updateInvoiceTotals(this.invoice_id);
});

// Helper function to update invoice totals
async function updateInvoiceTotals(invoiceId) {
  const Invoice = mongoose.model('Invoice');
  const InvoiceItem = mongoose.model('InvoiceItem');
  
  // Get all items for this invoice
  const items = await InvoiceItem.find({ invoice_id: invoiceId });
  
  // Calculate totals
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;
  let totalAmount = 0;
  
  items.forEach(item => {
    subtotal += item.subtotal;
    taxAmount += item.tax_amount;
    discountAmount += item.discount_amount;
    totalAmount += item.total_amount;
  });
  
  // Update invoice
  await Invoice.findByIdAndUpdate(invoiceId, {
    subtotal,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    balance_due: totalAmount - (await Invoice.findById(invoiceId)).amount_paid
  });
}

module.exports = mongoose.model('InvoiceItem', InvoiceItemSchema);
