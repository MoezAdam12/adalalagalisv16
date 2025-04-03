// models/hr/training.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Training Schema
 * Represents a training program or course
 */
const TrainingSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['internal', 'external', 'online', 'workshop', 'conference', 'certification'],
    required: true
  },
  provider: {
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
  duration: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'hours'
    }
  },
  location: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  max_participants: {
    type: Number,
    min: 1
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  materials: [{
    name: String,
    file_path: String,
    upload_date: {
      type: Date,
      default: Date.now
    }
  }],
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

/**
 * Validate training dates
 */
TrainingSchema.pre('save', function(next) {
  // Ensure end_date is not before start_date
  if (this.end_date < this.start_date) {
    return next(new Error('End date cannot be before start date'));
  }
  
  next();
});

/**
 * Get upcoming trainings
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Upcoming trainings
 */
TrainingSchema.statics.getUpcomingTrainings = function(tenantId) {
  const today = new Date();
  
  return this.find({
    tenant_id: tenantId,
    start_date: { $gt: today },
    status: 'planned'
  }).sort('start_date');
};

/**
 * Get ongoing trainings
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Ongoing trainings
 */
TrainingSchema.statics.getOngoingTrainings = function(tenantId) {
  const today = new Date();
  
  return this.find({
    tenant_id: tenantId,
    start_date: { $lte: today },
    end_date: { $gte: today },
    status: 'in_progress'
  }).sort('end_date');
};

/**
 * Get trainings by type
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} type - Training type
 * @returns {Promise<Array>} Trainings of the specified type
 */
TrainingSchema.statics.getTrainingsByType = function(tenantId, type) {
  return this.find({
    tenant_id: tenantId,
    type
  }).sort('-start_date');
};

/**
 * Get trainings by status
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} status - Training status
 * @returns {Promise<Array>} Trainings with the specified status
 */
TrainingSchema.statics.getTrainingsByStatus = function(tenantId, status) {
  return this.find({
    tenant_id: tenantId,
    status
  }).sort('-start_date');
};

const Training = mongoose.model('Training', TrainingSchema);

module.exports = Training;
