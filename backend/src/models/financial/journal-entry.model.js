// models/financial/journal-entry.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Journal Entry Schema
 * Represents accounting journal entries for financial transactions
 */
const JournalEntrySchema = new Schema({
  tenant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  entry_number: {
    type: String,
    required: true,
    trim: true
  },
  entry_date: {
    type: Date,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  source_document: {
    type: String,
    enum: ['invoice', 'payment', 'expense', 'manual', 'other'],
    default: 'manual'
  },
  source_id: {
    type: Schema.Types.ObjectId,
    refPath: 'source_model'
  },
  source_model: {
    type: String,
    enum: ['Invoice', 'Payment', 'Expense', null],
    default: null
  },
  is_recurring: {
    type: Boolean,
    default: false
  },
  recurrence_pattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', null],
    default: null
  },
  next_recurrence_date: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'posted', 'voided'],
    default: 'draft'
  },
  posted_at: {
    type: Date,
    default: null
  },
  voided_at: {
    type: Date,
    default: null
  },
  voided_reason: {
    type: String,
    default: null
  },
  fiscal_period_id: {
    type: Schema.Types.ObjectId,
    ref: 'FiscalPeriod',
    index: true
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

// Compound index for tenant and entry number uniqueness
JournalEntrySchema.index({ tenant_id: 1, entry_number: 1 }, { unique: true });

// Virtual for entry details
JournalEntrySchema.virtual('details', {
  ref: 'JournalEntryDetail',
  localField: '_id',
  foreignField: 'entry_id'
});

// Pre-save hook to generate entry number if not provided
JournalEntrySchema.pre('save', async function(next) {
  if (this.isNew && !this.entry_number) {
    try {
      const Tenant = mongoose.model('Tenant');
      const tenant = await Tenant.findById(this.tenant_id);
      
      if (!tenant) {
        return next(new Error('Tenant not found'));
      }
      
      // Get the next journal entry number from tenant settings
      const nextNumber = tenant.settings.finance.next_journal_entry_number || 1;
      const prefix = tenant.settings.finance.journal_entry_prefix || 'JE';
      
      // Format: JE-00001
      this.entry_number = `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
      
      // Update the tenant's next journal entry number
      await Tenant.findByIdAndUpdate(this.tenant_id, {
        'settings.finance.next_journal_entry_number': nextNumber + 1
      });
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to check if entry is balanced
JournalEntrySchema.methods.isBalanced = async function() {
  await this.populate('details');
  
  let totalDebits = 0;
  let totalCredits = 0;
  
  this.details.forEach(detail => {
    totalDebits += detail.debit_amount;
    totalCredits += detail.credit_amount;
  });
  
  // Check if debits equal credits (accounting equation)
  return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding differences
};

// Method to post journal entry
JournalEntrySchema.methods.post = async function(userId) {
  if (this.status !== 'draft') {
    throw new Error('Only draft entries can be posted');
  }
  
  // Check if entry is balanced
  const balanced = await this.isBalanced();
  if (!balanced) {
    throw new Error('Journal entry must be balanced before posting');
  }
  
  // Update account balances
  await this.populate('details');
  
  for (const detail of this.details) {
    await detail.updateAccountBalance();
  }
  
  // Update entry status
  this.status = 'posted';
  this.posted_at = new Date();
  this.updated_by = userId;
  
  return this.save();
};

// Method to void journal entry
JournalEntrySchema.methods.void = async function(reason, userId) {
  if (this.status !== 'posted') {
    throw new Error('Only posted entries can be voided');
  }
  
  // Reverse the effect on account balances
  await this.populate('details');
  
  for (const detail of this.details) {
    await detail.reverseAccountBalance();
  }
  
  // Update entry status
  this.status = 'voided';
  this.voided_at = new Date();
  this.voided_reason = reason;
  this.updated_by = userId;
  
  return this.save();
};

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
