// models/hr/salary.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Salary Schema
 * Represents an employee's salary record for a specific month
 */
const SalarySchema = new Schema({
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2000
  },
  base_salary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  bonuses: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  deductions: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  total_salary: {
    type: Number,
    required: true,
    min: 0
  },
  payment_date: {
    type: Date
  },
  payment_status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
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

// Ensure an employee has only one salary record per month/year
SalarySchema.index({ employee_id: 1, month: 1, year: 1 }, { unique: true });

/**
 * Calculate total salary
 */
SalarySchema.pre('save', function(next) {
  // Calculate total allowances
  const totalAllowances = this.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
  
  // Calculate total bonuses
  const totalBonuses = this.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  
  // Calculate total deductions
  const totalDeductions = this.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  
  // Calculate total salary
  this.total_salary = this.base_salary + totalAllowances + totalBonuses - totalDeductions;
  
  next();
});

/**
 * Get salary records by employee
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Employee salary records
 */
SalarySchema.statics.getSalariesByEmployee = function(employeeId, tenantId) {
  return this.find({
    employee_id: employeeId,
    tenant_id: tenantId
  }).sort('-year -month');
};

/**
 * Get salary records by month and year
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Promise<Array>} Salary records for the specified month and year
 */
SalarySchema.statics.getSalariesByMonthYear = function(tenantId, month, year) {
  return this.find({
    tenant_id: tenantId,
    month,
    year
  }).populate('employee_id', 'first_name last_name email job_title department').sort('employee_id.last_name');
};

/**
 * Get pending salary payments
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Pending salary payments
 */
SalarySchema.statics.getPendingSalaries = function(tenantId) {
  return this.find({
    tenant_id: tenantId,
    payment_status: 'pending'
  }).populate('employee_id', 'first_name last_name email job_title department').sort('-year -month');
};

/**
 * Generate salary records for all active employees
 * @param {Object} params - Parameters
 * @param {ObjectId} params.tenantId - Tenant ID
 * @param {Number} params.month - Month (1-12)
 * @param {Number} params.year - Year
 * @param {ObjectId} params.createdBy - User ID of creator
 * @returns {Promise<Array>} Generated salary records
 */
SalarySchema.statics.generateMonthlySalaries = async function(params) {
  const { tenantId, month, year, createdBy } = params;
  
  // Get all active employees
  const Employee = mongoose.model('Employee');
  const activeEmployees = await Employee.getActiveEmployees(tenantId);
  
  const salaries = [];
  
  // Create salary records for each employee
  for (const employee of activeEmployees) {
    // Check if salary record already exists
    const existingSalary = await this.findOne({
      employee_id: employee._id,
      month,
      year,
      tenant_id: tenantId
    });
    
    if (!existingSalary) {
      // Create new salary record
      const salary = new this({
        employee_id: employee._id,
        month,
        year,
        base_salary: employee.base_salary || 0,
        allowances: [],
        bonuses: [],
        deductions: [],
        total_salary: employee.base_salary || 0,
        payment_status: 'pending',
        tenant_id: tenantId,
        created_by: createdBy,
        updated_by: createdBy
      });
      
      await salary.save();
      salaries.push(salary);
    }
  }
  
  return salaries;
};

const Salary = mongoose.model('Salary', SalarySchema);

module.exports = Salary;
