// models/financial/account.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Account Schema
 * Represents financial accounts in the chart of accounts
 */
const AccountSchema = new Schema({
  tenant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  account_code: {
    type: String,
    required: true,
    trim: true
  },
  account_name: {
    type: String,
    required: true,
    trim: true
  },
  account_type: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
    index: true
  },
  parent_account_id: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  currency_code: {
    type: String,
    default: 'SAR',
    trim: true
  },
  current_balance: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_system: {
    type: Boolean,
    default: false
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

// Compound index for tenant and account code uniqueness
AccountSchema.index({ tenant_id: 1, account_code: 1 }, { unique: true });

// Virtual for child accounts
AccountSchema.virtual('child_accounts', {
  ref: 'Account',
  localField: '_id',
  foreignField: 'parent_account_id'
});

// Pre-save hook to ensure account code format
AccountSchema.pre('save', function(next) {
  // Ensure account code follows the required format
  if (this.isModified('account_code')) {
    // Format validation logic here
  }
  next();
});

// Method to calculate account balance
AccountSchema.methods.calculateBalance = async function() {
  // Logic to calculate account balance from journal entries
  // This would be implemented based on accounting principles
};

// Static method to get full chart of accounts
AccountSchema.statics.getChartOfAccounts = async function(tenantId) {
  return this.find({ tenant_id: tenantId, parent_account_id: null })
    .sort('account_code')
    .populate({
      path: 'child_accounts',
      options: { sort: { account_code: 1 } },
      populate: {
        path: 'child_accounts',
        options: { sort: { account_code: 1 } }
      }
    });
};

module.exports = mongoose.model('Account', AccountSchema);
