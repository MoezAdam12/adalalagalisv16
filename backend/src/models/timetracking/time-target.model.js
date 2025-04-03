// models/timetracking/time-target.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Time Target Schema
 * Represents a target for billable and non-billable hours for a user
 */
const TimeTargetSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  billable_hours_target: {
    type: Number,
    required: true,
    min: 0
  },
  non_billable_hours_target: {
    type: Number,
    min: 0,
    default: 0
  },
  tenant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Ensure a user doesn't have overlapping targets for the same period
TimeTargetSchema.index({ user_id: 1, start_date: 1, end_date: 1 }, { unique: true });

/**
 * Get active time target for a user
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Date} date - Date to check (defaults to current date)
 * @returns {Promise<Object>} Active time target
 */
TimeTargetSchema.statics.getActiveTarget = function(userId, tenantId, date = new Date()) {
  return this.findOne({
    user_id: userId,
    tenant_id: tenantId,
    start_date: { $lte: date },
    end_date: { $gte: date }
  });
};

/**
 * Calculate progress towards target
 * @param {Object} timeEntries - Time entries summary
 * @returns {Object} Progress information
 */
TimeTargetSchema.methods.calculateProgress = function(timeEntries) {
  const billableProgress = timeEntries ? timeEntries.billable_hours / this.billable_hours_target : 0;
  const nonBillableProgress = this.non_billable_hours_target > 0 && timeEntries ? 
    timeEntries.non_billable_hours / this.non_billable_hours_target : 0;
  
  return {
    billable_target: this.billable_hours_target,
    billable_actual: timeEntries ? timeEntries.billable_hours : 0,
    billable_progress: billableProgress,
    billable_remaining: this.billable_hours_target - (timeEntries ? timeEntries.billable_hours : 0),
    non_billable_target: this.non_billable_hours_target,
    non_billable_actual: timeEntries ? timeEntries.non_billable_hours : 0,
    non_billable_progress: nonBillableProgress,
    non_billable_remaining: this.non_billable_hours_target - (timeEntries ? timeEntries.non_billable_hours : 0),
    total_target: this.billable_hours_target + this.non_billable_hours_target,
    total_actual: timeEntries ? timeEntries.total_hours : 0,
    total_progress: (timeEntries ? timeEntries.total_hours : 0) / (this.billable_hours_target + this.non_billable_hours_target),
    total_remaining: (this.billable_hours_target + this.non_billable_hours_target) - (timeEntries ? timeEntries.total_hours : 0)
  };
};

/**
 * Create monthly targets for a user
 * @param {Object} params - Parameters
 * @param {ObjectId} params.userId - User ID
 * @param {ObjectId} params.tenantId - Tenant ID
 * @param {Number} params.billableTarget - Monthly billable hours target
 * @param {Number} params.nonBillableTarget - Monthly non-billable hours target
 * @param {Date} params.startMonth - Start month (defaults to current month)
 * @param {Number} params.months - Number of months to create targets for
 * @param {ObjectId} params.createdBy - User ID of creator
 * @returns {Promise<Array>} Created time targets
 */
TimeTargetSchema.statics.createMonthlyTargets = async function(params) {
  const {
    userId,
    tenantId,
    billableTarget,
    nonBillableTarget = 0,
    startMonth = new Date(),
    months = 1,
    createdBy
  } = params;
  
  const targets = [];
  
  for (let i = 0; i < months; i++) {
    const targetMonth = new Date(startMonth);
    targetMonth.setMonth(targetMonth.getMonth() + i);
    
    const startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    
    const target = new this({
      user_id: userId,
      tenant_id: tenantId,
      period: 'monthly',
      start_date: startDate,
      end_date: endDate,
      billable_hours_target: billableTarget,
      non_billable_hours_target: nonBillableTarget,
      created_by: createdBy,
      updated_by: createdBy
    });
    
    await target.save();
    targets.push(target);
  }
  
  return targets;
};

const TimeTarget = mongoose.model('TimeTarget', TimeTargetSchema);

module.exports = TimeTarget;
