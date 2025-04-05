// models/hr/qualification.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Qualification Schema
 * Represents an employee's qualification (educational, professional, license)
 */
const QualificationSchema = new Schema({
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: ['educational', 'professional', 'license'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  date_obtained: {
    type: Date,
    required: true
  },
  expiry_date: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  documents: [{
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
 * Get qualifications by employee
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Employee qualifications
 */
QualificationSchema.statics.getQualificationsByEmployee = function(employeeId, tenantId) {
  return this.find({
    employee_id: employeeId,
    tenant_id: tenantId
  }).sort('-date_obtained');
};

/**
 * Get qualifications by type
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} type - Qualification type
 * @returns {Promise<Array>} Qualifications of the specified type
 */
QualificationSchema.statics.getQualificationsByType = function(tenantId, type) {
  return this.find({
    tenant_id: tenantId,
    type
  }).populate('employee_id', 'first_name last_name email').sort('-date_obtained');
};

/**
 * Get expiring qualifications
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Number} daysThreshold - Days threshold
 * @returns {Promise<Array>} Qualifications expiring soon
 */
QualificationSchema.statics.getExpiringQualifications = function(tenantId, daysThreshold = 30) {
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() + daysThreshold);
  
  return this.find({
    tenant_id: tenantId,
    expiry_date: {
      $ne: null,
      $gte: today,
      $lte: thresholdDate
    }
  }).populate('employee_id', 'first_name last_name email').sort('expiry_date');
};

const Qualification = mongoose.model('Qualification', QualificationSchema);

module.exports = Qualification;
