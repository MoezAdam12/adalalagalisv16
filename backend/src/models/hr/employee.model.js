// models/hr/employee.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Employee Schema
 * Represents an employee in the law firm
 */
const EmployeeSchema = new Schema({
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    trim: true
  },
  birth_date: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  nationality: {
    type: String,
    trim: true
  },
  id_number: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  hire_date: {
    type: Date,
    required: true
  },
  contract_end_date: {
    type: Date
  },
  job_title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  manager_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  contract_type: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'intern'],
    default: 'full_time'
  },
  base_salary: {
    type: Number,
    min: 0
  },
  employment_status: {
    type: String,
    enum: ['active', 'on_leave', 'terminated', 'retired'],
    default: 'active'
  },
  profile_image: {
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

// Virtual for employee's full name
EmployeeSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Ensure email is unique per tenant
EmployeeSchema.index({ email: 1, tenant_id: 1 }, { unique: true });

/**
 * Get active employees
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Active employees
 */
EmployeeSchema.statics.getActiveEmployees = function(tenantId) {
  return this.find({
    tenant_id: tenantId,
    employment_status: 'active'
  }).sort('last_name first_name');
};

/**
 * Get employees by department
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} department - Department name
 * @returns {Promise<Array>} Employees in the department
 */
EmployeeSchema.statics.getEmployeesByDepartment = function(tenantId, department) {
  return this.find({
    tenant_id: tenantId,
    department,
    employment_status: 'active'
  }).sort('last_name first_name');
};

/**
 * Get employees by manager
 * @param {ObjectId} tenantId - Tenant ID
 * @param {ObjectId} managerId - Manager ID
 * @returns {Promise<Array>} Employees under the manager
 */
EmployeeSchema.statics.getEmployeesByManager = function(tenantId, managerId) {
  return this.find({
    tenant_id: tenantId,
    manager_id: managerId,
    employment_status: 'active'
  }).sort('last_name first_name');
};

/**
 * Get employees with contracts ending soon
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Number} daysThreshold - Days threshold
 * @returns {Promise<Array>} Employees with contracts ending soon
 */
EmployeeSchema.statics.getEmployeesWithContractsEndingSoon = function(tenantId, daysThreshold = 30) {
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() + daysThreshold);
  
  return this.find({
    tenant_id: tenantId,
    employment_status: 'active',
    contract_end_date: {
      $ne: null,
      $gte: today,
      $lte: thresholdDate
    }
  }).sort('contract_end_date');
};

/**
 * Search employees
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} searchTerm - Search term
 * @returns {Promise<Array>} Matching employees
 */
EmployeeSchema.statics.searchEmployees = function(tenantId, searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  
  return this.find({
    tenant_id: tenantId,
    $or: [
      { first_name: regex },
      { last_name: regex },
      { email: regex },
      { job_title: regex },
      { department: regex }
    ]
  }).sort('last_name first_name');
};

const Employee = mongoose.model('Employee', EmployeeSchema);

module.exports = Employee;
