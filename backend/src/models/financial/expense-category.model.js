// models/financial/expense-category.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Expense Category Schema
 * Represents categories for classifying expenses
 */
const ExpenseCategorySchema = new Schema({
  tenant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  is_billable_default: {
    type: Boolean,
    default: false
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
  }
});

// Compound index for tenant and category name uniqueness
ExpenseCategorySchema.index({ tenant_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
