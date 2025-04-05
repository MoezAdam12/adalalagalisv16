// models/hr/employee-appraisal.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Employee Appraisal Schema
 * Represents an employee's performance appraisal
 */
const EmployeeAppraisalSchema = new Schema({
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  appraisal_cycle_id: {
    type: Schema.Types.ObjectId,
    ref: 'AppraisalCycle',
    required: true
  },
  appraiser_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  appraisal_date: {
    type: Date,
    required: true
  },
  overall_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  ratings: [{
    category: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comments: String
  }],
  strengths: {
    type: String
  },
  areas_for_improvement: {
    type: String
  },
  development_plan: {
    type: String
  },
  comments: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved'],
    default: 'draft'
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

// Ensure an employee has only one appraisal per cycle
EmployeeAppraisalSchema.index({ employee_id: 1, appraisal_cycle_id: 1 }, { unique: true });

/**
 * Get appraisals by employee
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Employee appraisals
 */
EmployeeAppraisalSchema.statics.getAppraisalsByEmployee = function(employeeId, tenantId) {
  return this.find({
    employee_id: employeeId,
    tenant_id: tenantId
  }).populate('appraisal_cycle_id', 'name start_date end_date')
    .populate('appraiser_id', 'first_name last_name job_title')
    .sort('-appraisal_date');
};

/**
 * Get appraisals by cycle
 * @param {ObjectId} cycleId - Appraisal Cycle ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Appraisals for the specified cycle
 */
EmployeeAppraisalSchema.statics.getAppraisalsByCycle = function(cycleId, tenantId) {
  return this.find({
    appraisal_cycle_id: cycleId,
    tenant_id: tenantId
  }).populate('employee_id', 'first_name last_name job_title department')
    .populate('appraiser_id', 'first_name last_name job_title')
    .sort('employee_id.last_name employee_id.first_name');
};

/**
 * Get appraisals by appraiser
 * @param {ObjectId} appraiserId - Appraiser ID
 * @param {ObjectId} tenantId - Tenant ID
 * @param {ObjectId} cycleId - Appraisal Cycle ID (optional)
 * @returns {Promise<Array>} Appraisals by the specified appraiser
 */
EmployeeAppraisalSchema.statics.getAppraisalsByAppraiser = function(appraiserId, tenantId, cycleId = null) {
  const query = {
    appraiser_id: appraiserId,
    tenant_id: tenantId
  };
  
  if (cycleId) {
    query.appraisal_cycle_id = cycleId;
  }
  
  return this.find(query)
    .populate('employee_id', 'first_name last_name job_title department')
    .populate('appraisal_cycle_id', 'name start_date end_date')
    .sort('-appraisal_date');
};

/**
 * Get appraisals by status
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} status - Appraisal status
 * @param {ObjectId} cycleId - Appraisal Cycle ID (optional)
 * @returns {Promise<Array>} Appraisals with the specified status
 */
EmployeeAppraisalSchema.statics.getAppraisalsByStatus = function(tenantId, status, cycleId = null) {
  const query = {
    tenant_id: tenantId,
    status
  };
  
  if (cycleId) {
    query.appraisal_cycle_id = cycleId;
  }
  
  return this.find(query)
    .populate('employee_id', 'first_name last_name job_title department')
    .populate('appraiser_id', 'first_name last_name job_title')
    .populate('appraisal_cycle_id', 'name start_date end_date')
    .sort('-updated_at');
};

const EmployeeAppraisal = mongoose.model('EmployeeAppraisal', EmployeeAppraisalSchema);

module.exports = EmployeeAppraisal;
