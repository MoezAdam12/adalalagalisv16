// models/hr/leave-type.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Leave Type Schema
 * Represents a type of leave (e.g., annual, sick, maternity)
 */
const LeaveTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  annual_balance: {
    type: Number,
    required: true,
    min: 0
  },
  is_carryover: {
    type: Boolean,
    default: false
  },
  max_carryover: {
    type: Number,
    min: 0
  },
  is_paid: {
    type: Boolean,
    default: true
  },
  payment_percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  is_active: {
    type: Boolean,
    default: true
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

// Ensure leave type name is unique per tenant
LeaveTypeSchema.index({ name: 1, tenant_id: 1 }, { unique: true });

/**
 * Get active leave types
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Active leave types
 */
LeaveTypeSchema.statics.getActiveLeaveTypes = function(tenantId) {
  return this.find({
    tenant_id: tenantId,
    is_active: true
  }).sort('name');
};

/**
 * Get leave type by name
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} name - Leave type name
 * @returns {Promise<Object>} Leave type
 */
LeaveTypeSchema.statics.getLeaveTypeByName = function(tenantId, name) {
  return this.findOne({
    tenant_id: tenantId,
    name: name
  });
};

const LeaveType = mongoose.model('LeaveType', LeaveTypeSchema);

module.exports = LeaveType;
