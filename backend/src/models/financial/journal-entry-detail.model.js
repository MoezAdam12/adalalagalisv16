// models/financial/journal-entry-detail.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Journal Entry Detail Schema
 * Represents individual line items in a journal entry
 */
const JournalEntryDetailSchema = new Schema({
  entry_id: {
    type: Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: true,
    index: true
  },
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  debit_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  credit_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  case_id: {
    type: Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    default: null
  },
  contract_id: {
    type: Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
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

// Ensure a line item has either a debit or credit amount, but not both
JournalEntryDetailSchema.pre('save', function(next) {
  if (this.debit_amount > 0 && this.credit_amount > 0) {
    return next(new Error('A journal entry detail cannot have both debit and credit amounts'));
  }
  
  if (this.debit_amount === 0 && this.credit_amount === 0) {
    return next(new Error('A journal entry detail must have either a debit or credit amount'));
  }
  
  this.updated_at = new Date();
  next();
});

// Method to update account balance when journal entry is posted
JournalEntryDetailSchema.methods.updateAccountBalance = async function() {
  const Account = mongoose.model('Account');
  const account = await Account.findById(this.account_id);
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  // Update account balance based on account type and debit/credit amount
  // For asset and expense accounts:
  // - Debit increases the balance
  // - Credit decreases the balance
  // For liability, equity, and revenue accounts:
  // - Credit increases the balance
  // - Debit decreases the balance
  
  let balanceChange = 0;
  
  if (['asset', 'expense'].includes(account.account_type)) {
    balanceChange = this.debit_amount - this.credit_amount;
  } else {
    balanceChange = this.credit_amount - this.debit_amount;
  }
  
  account.current_balance += balanceChange;
  await account.save();
};

// Method to reverse account balance when journal entry is voided
JournalEntryDetailSchema.methods.reverseAccountBalance = async function() {
  const Account = mongoose.model('Account');
  const account = await Account.findById(this.account_id);
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  // Reverse the effect on account balance
  let balanceChange = 0;
  
  if (['asset', 'expense'].includes(account.account_type)) {
    balanceChange = this.debit_amount - this.credit_amount;
  } else {
    balanceChange = this.credit_amount - this.debit_amount;
  }
  
  account.current_balance -= balanceChange;
  await account.save();
};

module.exports = mongoose.model('JournalEntryDetail', JournalEntryDetailSchema);
