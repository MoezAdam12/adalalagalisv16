// models/financial/payment.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Payment Schema
 * Represents payments received from clients
 */
const PaymentSchema = new Schema({
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
  payment_number: {
    type: String,
    required: true,
    trim: true
  },
  payment_date: {
    type: Date,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency_code: {
    type: String,
    default: 'SAR',
    trim: true
  },
  payment_method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'other'],
    required: true
  },
  reference_number: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true
  },
  receipt_url: {
    type: String,
    trim: true
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

// Compound index for tenant and payment number uniqueness
PaymentSchema.index({ tenant_id: 1, payment_number: 1 }, { unique: true });

// Virtual for payment applications
PaymentSchema.virtual('applications', {
  ref: 'PaymentApplication',
  localField: '_id',
  foreignField: 'payment_id'
});

// Pre-save hook to generate payment number if not provided
PaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.payment_number) {
    try {
      const Tenant = mongoose.model('Tenant');
      const tenant = await Tenant.findById(this.tenant_id);
      
      if (!tenant) {
        return next(new Error('Tenant not found'));
      }
      
      // Get the next payment number from tenant settings
      const nextNumber = tenant.settings.finance.next_payment_number || 1;
      const prefix = tenant.settings.finance.payment_prefix || 'PMT';
      
      // Format: PMT-00001
      this.payment_number = `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
      
      // Update the tenant's next payment number
      await Tenant.findByIdAndUpdate(this.tenant_id, {
        'settings.finance.next_payment_number': nextNumber + 1
      });
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to apply payment to invoices
PaymentSchema.methods.applyToInvoices = async function(invoiceApplications, userId) {
  const PaymentApplication = mongoose.model('PaymentApplication');
  const Invoice = mongoose.model('Invoice');
  
  // Validate total application amount doesn't exceed payment amount
  const totalApplied = invoiceApplications.reduce((sum, app) => sum + app.amount, 0);
  if (totalApplied > this.amount) {
    throw new Error('Total applied amount cannot exceed payment amount');
  }
  
  // Create payment applications
  for (const application of invoiceApplications) {
    const invoice = await Invoice.findById(application.invoice_id);
    if (!invoice) {
      throw new Error(`Invoice with ID ${application.invoice_id} not found`);
    }
    
    if (application.amount <= 0) {
      throw new Error('Application amount must be greater than zero');
    }
    
    if (application.amount > invoice.balance_due) {
      throw new Error(`Application amount ${application.amount} exceeds invoice balance due ${invoice.balance_due}`);
    }
    
    // Create payment application
    const paymentApplication = new PaymentApplication({
      payment_id: this._id,
      invoice_id: application.invoice_id,
      amount: application.amount
    });
    
    await paymentApplication.save();
    
    // Update invoice
    await invoice.recordPayment(application.amount, userId);
  }
  
  // Create journal entry for this payment
  await this.createJournalEntry(userId);
  
  return this;
};

// Method to create journal entry for payment
PaymentSchema.methods.createJournalEntry = async function(userId) {
  // Only create journal entry if not already created
  if (this.journal_entry_id) {
    return;
  }
  
  const JournalEntry = mongoose.model('JournalEntry');
  const JournalEntryDetail = mongoose.model('JournalEntryDetail');
  const Tenant = mongoose.model('Tenant');
  const PaymentApplication = mongoose.model('PaymentApplication');
  
  const tenant = await Tenant.findById(this.tenant_id);
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  
  // Get default accounts from tenant settings
  const cashAccountId = tenant.settings.finance.cash_account_id;
  const accountsReceivableId = tenant.settings.finance.accounts_receivable_account_id;
  
  if (!cashAccountId || !accountsReceivableId) {
    throw new Error('Default accounts not configured in tenant settings');
  }
  
  // Create journal entry
  const journalEntry = new JournalEntry({
    tenant_id: this.tenant_id,
    entry_date: this.payment_date,
    description: `Payment ${this.payment_number} from ${this.client_id}`,
    source_document: 'payment',
    source_id: this._id,
    source_model: 'Payment',
    status: 'draft',
    created_by: userId,
    updated_by: userId
  });
  
  await journalEntry.save();
  
  // Create journal entry details
  
  // Debit Cash/Bank
  const cashDetail = new JournalEntryDetail({
    entry_id: journalEntry._id,
    account_id: cashAccountId,
    debit_amount: this.amount,
    credit_amount: 0,
    description: `Payment ${this.payment_number}`,
    client_id: this.client_id
  });
  
  await cashDetail.save();
  
  // Credit Accounts Receivable
  const arDetail = new JournalEntryDetail({
    entry_id: journalEntry._id,
    account_id: accountsReceivableId,
    debit_amount: 0,
    credit_amount: this.amount,
    description: `Payment ${this.payment_number}`,
    client_id: this.client_id
  });
  
  await arDetail.save();
  
  // Post the journal entry
  await journalEntry.post(userId);
  
  // Update payment with journal entry reference
  this.journal_entry_id = journalEntry._id;
  await this.save();
};

module.exports = mongoose.model('Payment', PaymentSchema);
