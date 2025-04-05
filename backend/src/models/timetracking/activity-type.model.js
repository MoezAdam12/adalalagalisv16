// models/timetracking/activity-type.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Activity Type Schema
 * Represents a type of activity that can be tracked (e.g., Research, Document Drafting, Court Appearance)
 */
const ActivityTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  default_billable: {
    type: Boolean,
    default: true
  },
  default_rate: {
    type: Number,
    min: 0
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

// Ensure name is unique per tenant
ActivityTypeSchema.index({ name: 1, tenant_id: 1 }, { unique: true });

/**
 * Get all active activity types for a tenant
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Active activity types
 */
ActivityTypeSchema.statics.getActiveTypes = function(tenantId) {
  return this.find({
    tenant_id: tenantId,
    is_active: true
  }).sort('name');
};

const ActivityType = mongoose.model('ActivityType', ActivityTypeSchema);

module.exports = ActivityType;
