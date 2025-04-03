// models/financial/expense.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Expense Schema
 * Represents expenses incurred by the law firm
 */
const ExpenseSchema = new Schema({
  tenant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  expense_number: {
    type: String,
    required: true,
    trim: true
  },
  expense_date: {
    type: Date,
    required: true,
    index: true
  },
  vendor_id: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
  },
  vendor_name: {
    type: String,
    trim: true
  },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
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
  total_amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency_code: {
    type: String,
    default: 'SAR',
    trim: true
  },
  is_billable: {
    type: Boolean,
    default: false
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    default: null
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
  invoice_id: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  payment_status: {
    type: String,
    enum: ['unpaid', 'paid', 'partially_paid'],
    default: 'unpaid'
  },
  payment_date: {
    type: Date,
    default: null
  },
  payment_method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'other', null],
    default: null
  },
  reference_number: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  receipt_url: {
    type: String,
    trim: true
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approved_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approved_at: {
    type: Date,
    default: null
  },
  rejection_reason: {
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

// Compound index for tenant and expense number uniqueness
ExpenseSchema.index({ tenant_id: 1, expense_number: 1 }, { unique: true });

// Pre-save hook to generate expense number if not provided
ExpenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expense_number) {
    try {
      const Tenant = mongoose.model('Tenant');
      const tenant = await Tenant.findById(this.tenant_id);
      
      if (!tenant) {
        return next(new Error('Tenant not found'));
      }
      
      // Get the next expense number from tenant settings
      const nextNumber = tenant.settings.finance.next_expense_number || 1;
      const prefix = tenant.settings.finance.expense_prefix || 'EXP';
      
      // Format: EXP-00001
      this.expense_number = `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
      
      // Update the tenant's next expense number
      await Tenant.findByIdAndUpdate(this.tenant_id, {
        'settings.finance.next_expense_number': nextNumber + 1
      });
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to calculate tax and total amount
ExpenseSchema.pre('save', function(next) {
  // Calculate tax amount
  if (this.tax_rate > 0) {
    this.tax_amount = (this.amount * this.tax_rate) / 100;
  } else {
    this.tax_amount = 0;
  }
  
  // Calculate total amount
  this.total_amount = this.amount + this.tax_amount;
  
  next();
});

// Method to approve expense
ExpenseSchema.methods.approve = async function(userId) {
  if (this.approval_status !== 'pending') {
    throw new Error('Only pending expenses can be approved');
  }
  
  this.approval_status = 'approved';
  this.approved_by = userId;
  this.approved_at = new Date();
  this.updated_by = userId;
  
  // Create journal entry for this expense
  await this.createJournalEntry(userId);
  
  return this.save();
};

// Method to reject expense
ExpenseSchema.methods.reject = async function(reason, userId) {
  if (this.approval_status !== 'pending') {
    throw new Error('Only pending expenses can be rejected');
  }
  
  this.approval_status = 'rejected';
  this.rejection_reason = reason;
  this.updated_by = userId;
  
  return this.save();
};

// Method to mark expense as paid
ExpenseSchema.methods.markAsPaid = async function(paymentMethod, paymentDate, referenceNumber, userId) {
  if (this.payment_status === 'paid') {
    throw new Error('Expense is already paid');
  }
  
  this.payment_status = 'paid';
  this.payment_method = paymentMethod;
  this.payment_date = paymentDate || new Date();
  this.reference_number = referenceNumber;
  this.updated_by = userId;
  
  return this.save();
};

// Method to create journal entry for expense
ExpenseSchema.methods.createJournalEntry = async function(userId) {
  // Only create journal entry if not already created and expense is approved
  if (this.journal_entry_id || this.approval_status !== 'approved') {
    return;
  }
  
  const JournalEntry = mongoose.model('JournalEntry');
  const JournalEntryDetail = mongoose.model('JournalEntryDetail');
  const Tenant = mongoose.model('Tenant');
  const ExpenseCategory = mongoose.model('ExpenseCategory');
  
  const tenant = await Tenant.findById(this.tenant_id);
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  
  // Get expense category to determine expense account
  const category = await ExpenseCategory.findById(this.category_id);
  if (!category) {
    throw new Error('Expense category not found');
  }
  
  // Get default accounts from tenant settings
  const cashAccountId = tenant.settings.finance.cash_account_id;
  const accountsPayableId = tenant.settings.finance.accounts_payable_account_id;
  const expenseAccountId = category.account_id;
  
  if (!expenseAccountId || (!cashAccountId && !accountsPayableId)) {
    throw new Error('Default accounts not configured properly');
  }
  
  // Create journal entry
  const journalEntry = new JournalEntry({
    tenant_id: this.tenant_id,
    entry_date: this.expense_date,
    description: `Expense ${this.expense_number}: ${this.description}`,
    source_document: 'expense',
    source_id: this._id,
    source_model: 'Expense',
    status: 'draft',
    created_by: userId,
    updated_by: userId
  });
  
  await journalEntry.save();
  
  // Create journal entry details
  
  // Debit Expense Account
  const expenseDetail = new JournalEntryDetail({
    entry_id: journalEntry._id,
    account_id: expenseAccountId,
    debit_amount: this.amount,
    credit_amount: 0,
    description: `Expense ${this.expense_number}`,
    case_id: this.case_id,
    client_id: this.client_id
  });
  
  await expenseDetail.save();
  
  // If there's tax, debit Tax Expense Account
  if (this.tax_amount > 0) {
    const taxAccountId = tenant.settings.finance.tax_expense_account_id;
    
    if (taxAccountId) {
      const taxDetail = new JournalEntryDetail({
        entry_id: journalEntry._id,
        account_id: taxAccountId,
        debit_amount: this.tax_amount,
        credit_amount: 0,
        description: `Tax on Expense ${this.expense_number}`,
        case_id: this.case_id,
        client_id: this.client_id
      });
      
      await taxDetail.save();
    }
  }
  
  // Credit Cash or Accounts Payable based on payment status
  const creditAccountId = this.payment_status === 'paid' ? cashAccountId : accountsPayableId;
  
  const creditDetail = new JournalEntryDetail({
    entry_id: journalEntry._id,
    account_id: creditAccountId,
    debit_amount: 0,
    credit_amount: this.total_amount,
    description: `Expense ${this.expense_number}`,
    case_id: this.case_id,
    client_id: this.client_id
  });
  
  await creditDetail.save();
  
  // Post the journal entry
  await journalEntry.post(userId);
  
  // Update expense with journal entry reference
  this.journal_entry_id = journalEntry._id;
  await this.save();
};

module.exports = mongoose.model('Expense', ExpenseSchema);
