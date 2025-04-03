// models/hr/appraisal-cycle.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Appraisal Cycle Schema
 * Represents a performance appraisal cycle
 */
const AppraisalCycleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed'],
    default: 'planned'
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

// Ensure appraisal cycle name is unique per tenant
AppraisalCycleSchema.index({ name: 1, tenant_id: 1 }, { unique: true });

/**
 * Validate appraisal cycle dates
 */
AppraisalCycleSchema.pre('save', function(next) {
  // Ensure end_date is not before start_date
  if (this.end_date < this.start_date) {
    return next(new Error('End date cannot be before start date'));
  }
  
  next();
});

/**
 * Get active appraisal cycle
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Object>} Active appraisal cycle
 */
AppraisalCycleSchema.statics.getActiveAppraisalCycle = function(tenantId) {
  const today = new Date();
  
  return this.findOne({
    tenant_id: tenantId,
    start_date: { $lte: today },
    end_date: { $gte: today },
    status: 'in_progress'
  });
};

/**
 * Get appraisal cycles by status
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} status - Appraisal cycle status
 * @returns {Promise<Array>} Appraisal cycles with the specified status
 */
AppraisalCycleSchema.statics.getAppraisalCyclesByStatus = function(tenantId, status) {
  return this.find({
    tenant_id: tenantId,
    status
  }).sort('-start_date');
};

/**
 * Get upcoming appraisal cycles
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Upcoming appraisal cycles
 */
AppraisalCycleSchema.statics.getUpcomingAppraisalCycles = function(tenantId) {
  const today = new Date();
  
  return this.find({
    tenant_id: tenantId,
    start_date: { $gt: today },
    status: 'planned'
  }).sort('start_date');
};

const AppraisalCycle = mongoose.model('AppraisalCycle', AppraisalCycleSchema);

module.exports = AppraisalCycle;
