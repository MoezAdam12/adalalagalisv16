// models/financial/invoice.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Invoice Schema
 * Represents invoices sent to clients
 */
const InvoiceSchema = new Schema({
  tenant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  invoice_number: {
    type: String,
    required: true,
    trim: true
  },
  invoice_date: {
    type: Date,
    required: true,
    index: true
  },
  due_date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
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
  amount_paid: {
    type: Number,
    default: 0,
    min: 0
  },
  balance_due: {
    type: Number,
    default: function() {
      return this.total_amount;
    },
    min: 0
  },
  currency_code: {
    type: String,
    default: 'SAR',
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    trim: true
  },
  footer: {
    type: String,
    trim: true
  },
  is_recurring: {
    type: Boolean,
    default: false
  },
  recurrence_pattern: {
    type: String,
    enum: ['monthly', 'quarterly', 'biannually', 'annually', null],
    default: null
  },
  next_recurrence_date: {
    type: Date,
    default: null
  },
  parent_invoice_id: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  sent_at: {
    type: Date,
    default: null
  },
  sent_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  cancelled_reason: {
    type: String,
    default: null
  },
  journal_entry_id: {
    type: Schema.Types.ObjectId,
    ref: 'JournalEntry',
    default: null
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for tenant and invoice number uniqueness
InvoiceSchema.index({ tenant_id: 1, invoice_number: 1 }, { unique: true });

// Virtual for invoice items
InvoiceSchema.virtual('items', {
  ref: 'InvoiceItem',
  localField: '_id',
  foreignField: 'invoice_id'
});

// Virtual for payments
InvoiceSchema.virtual('payments', {
  ref: 'PaymentApplication',
  localField: '_id',
  foreignField: 'invoice_id'
});

// Pre-save hook to generate invoice number if not provided
InvoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoice_number) {
    try {
      const Tenant = mongoose.model('Tenant');
      const tenant = await Tenant.findById(this.tenant_id);
      
      if (!tenant) {
        return next(new Error('Tenant not found'));
      }
      
      // Get the next invoice number from tenant settings
      const nextNumber = tenant.settings.finance.next_invoice_number || 1;
      const prefix = tenant.settings.finance.invoice_prefix || 'INV';
      
      // Format: INV-00001
      this.invoice_number = `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
      
      // Update the tenant's next invoice number
      await Tenant.findByIdAndUpdate(this.tenant_id, {
        'settings.finance.next_invoice_number': nextNumber + 1
      });
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to calculate balance due
InvoiceSchema.pre('save', function(next) {
  this.balance_due = this.total_amount - this.amount_paid;
  
  // Update status based on payment status
  if (this.status !== 'draft' && this.status !== 'cancelled') {
    if (this.balance_due <= 0) {
      this.status = 'paid';
    } else if (this.amount_paid > 0) {
      this.status = 'partially_paid';
    } else if (this.due_date < new Date() && this.status !== 'overdue') {
      this.status = 'overdue';
    }
  }
  
  next();
});

// Method to send invoice
InvoiceSchema.methods.send = async function(userId) {
  if (this.status === 'draft') {
    this.status = 'sent';
    this.sent_at = new Date();
    this.sent_by = userId;
    this.updated_by = userId;
    
    // Create journal entry for this invoice
    await this.createJournalEntry(userId);
    
    return this.save();
  }
  
  throw new Error('Only draft invoices can be sent');
};

// Method to record payment
InvoiceSchema.methods.recordPayment = async function(paymentAmount, userId) {
  if (this.status === 'cancelled') {
    throw new Error('Cannot record payment for cancelled invoice');
  }
  
  if (paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }
  
  if (paymentAmount > this.balance_due) {
    throw new Error('Payment amount cannot exceed balance due');
  }
  
  this.amount_paid += paymentAmount;
  this.balance_due = this.total_amount - this.amount_paid;
  
  if (this.balance_due <= 0) {
    this.status = 'paid';
  } else {
    this.status = 'partially_paid';
  }
  
  this.updated_by = userId;
  
  return this.save();
};

// Method to cancel invoice
InvoiceSchema.methods.cancel = async function(reason, userId) {
  if (this.status === 'paid' || this.status === 'partially_paid') {
    throw new Error('Cannot cancel invoice with payments');
  }
  
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  this.cancelled_reason = reason;
  this.updated_by = userId;
  
  // Void the journal entry if it exists
  if (this.journal_entry_id) {
    const JournalEntry = mongoose.model('JournalEntry');
    const journalEntry = await JournalEntry.findById(this.journal_entry_id);
    
    if (journalEntry) {
      await journalEntry.void('Invoice cancelled', userId);
    }
  }
  
  return this.save();
};

// Method to create journal entry for invoice
InvoiceSchema.methods.createJournalEntry = async function(userId) {
  // Only create journal entry if not already created
  if (this.journal_entry_id) {
    return;
  }
  
  const JournalEntry = mongoose.model('JournalEntry');
  const JournalEntryDetail = mongoose.model('JournalEntryDetail');
  const Tenant = mongoose.model('Tenant');
  
  const tenant = await Tenant.findById(this.tenant_id);
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  
  // Get default accounts from tenant settings
  const accountsReceivableId = tenant.settings.finance.accounts_receivable_account_id;
  const revenueAccountId = tenant.settings.finance.revenue_account_id;
  const taxPayableAccountId = tenant.settings.finance.tax_payable_account_id;
  
  if (!accountsReceivableId || !revenueAccountId) {
    throw new Error('Default accounts not configured in tenant settings');
  }
  
  // Create journal entry
  const journalEntry = new JournalEntry({
    tenant_id: this.tenant_id,
    entry_date: this.invoice_date,
    description: `Invoice ${this.invoice_number} for ${this.client_id}`,
    source_document: 'invoice',
    source_id: this._id,
    source_model: 'Invoice',
    status: 'draft',
    created_by: userId,
    updated_by: userId
  });
  
  await journalEntry.save();
  
  // Create journal entry details
  
  // Debit Accounts Receivable
  const arDetail = new JournalEntryDetail({
    entry_id: journalEntry._id,
    account_id: accountsReceivableId,
    debit_amount: this.total_amount,
    credit_amount: 0,
    description: `Invoice ${this.invoice_number}`,
    client_id: this.client_id
  });
  
  await arDetail.save();
  
  // Credit Revenue
  const revenueDetail = new JournalEntryDetail({
    entry_id: journalEntry._id,
    account_id: revenueAccountId,
    debit_amount: 0,
    credit_amount: this.subtotal,
    description: `Invoice ${this.invoice_number}`,
    client_id: this.client_id
  });
  
  await revenueDetail.save();
  
  // Credit Tax Payable (if applicable)
  if (this.tax_amount > 0 && taxPayableAccountId) {
    const taxDetail = new JournalEntryDetail({
      entry_id: journalEntry._id,
      account_id: taxPayableAccountId,
      debit_amount: 0,
      credit_amount: this.tax_amount,
      description: `Tax on Invoice ${this.invoice_number}`,
      client_id: this.client_id
    });
    
    await taxDetail.save();
  }
  
  // Post the journal entry
  await journalEntry.post(userId);
  
  // Update invoice with journal entry reference
  this.journal_entry_id = journalEntry._id;
  await this.save();
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
