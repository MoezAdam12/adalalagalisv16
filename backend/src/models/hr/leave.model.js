// models/hr/leave.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Leave Schema
 * Represents an employee's leave request
 */
const LeaveSchema = new Schema({
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leave_type: {
    type: Schema.Types.ObjectId,
    ref: 'LeaveType',
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
  days: {
    type: Number,
    required: true,
    min: 0.5
  },
  reason: {
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approved_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approval_date: {
    type: Date
  },
  notes: {
    type: String
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

/**
 * Validate leave dates
 */
LeaveSchema.pre('save', function(next) {
  // Ensure end_date is not before start_date
  if (this.end_date < this.start_date) {
    return next(new Error('End date cannot be before start date'));
  }
  
  // Calculate days if not provided
  if (!this.days) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((this.end_date - this.start_date) / oneDay)) + 1;
    this.days = diffDays;
  }
  
  next();
});

/**
 * Get leaves by employee
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Employee leaves
 */
LeaveSchema.statics.getLeavesByEmployee = function(employeeId, tenantId) {
  return this.find({
    employee_id: employeeId,
    tenant_id: tenantId
  }).populate('leave_type', 'name is_paid').sort('-start_date');
};

/**
 * Get leaves by status
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} status - Leave status
 * @returns {Promise<Array>} Leaves with the specified status
 */
LeaveSchema.statics.getLeavesByStatus = function(tenantId, status) {
  return this.find({
    tenant_id: tenantId,
    status
  }).populate('employee_id', 'first_name last_name email job_title department')
    .populate('leave_type', 'name is_paid')
    .sort('-created_at');
};

/**
 * Get current and upcoming leaves
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Current and upcoming approved leaves
 */
LeaveSchema.statics.getCurrentAndUpcomingLeaves = function(tenantId) {
  const today = new Date();
  
  return this.find({
    tenant_id: tenantId,
    status: 'approved',
    end_date: { $gte: today }
  }).populate('employee_id', 'first_name last_name email job_title department')
    .populate('leave_type', 'name is_paid')
    .sort('start_date');
};

/**
 * Check for overlapping leaves
 * @param {ObjectId} employeeId - Employee ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {ObjectId} excludeLeaveId - Leave ID to exclude (for updates)
 * @returns {Promise<Boolean>} True if overlapping leaves exist
 */
LeaveSchema.statics.hasOverlappingLeaves = async function(employeeId, startDate, endDate, excludeLeaveId = null) {
  const query = {
    employee_id: employeeId,
    status: { $ne: 'rejected' },
    $or: [
      { start_date: { $lte: endDate }, end_date: { $gte: startDate } }
    ]
  };
  
  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }
  
  const count = await this.countDocuments(query);
  return count > 0;
};

const Leave = mongoose.model('Leave', LeaveSchema);

module.exports = Leave;
