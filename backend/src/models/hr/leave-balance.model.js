// models/hr/leave-balance.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Leave Balance Schema
 * Represents an employee's leave balance for a specific leave type and year
 */
const LeaveBalanceSchema = new Schema({
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leave_type_id: {
    type: Schema.Types.ObjectId,
    ref: 'LeaveType',
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000
  },
  initial_balance: {
    type: Number,
    required: true,
    min: 0
  },
  used_balance: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining_balance: {
    type: Number,
    min: 0
  },
  carried_over: {
    type: Number,
    default: 0,
    min: 0
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

// Ensure an employee has only one balance record per leave type and year
LeaveBalanceSchema.index({ employee_id: 1, leave_type_id: 1, year: 1 }, { unique: true });

/**
 * Calculate remaining balance
 */
LeaveBalanceSchema.pre('save', function(next) {
  this.remaining_balance = this.initial_balance + this.carried_over - this.used_balance;
  next();
});

/**
 * Get leave balances by employee
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Number} year - Year (optional, defaults to current year)
 * @returns {Promise<Array>} Employee leave balances
 */
LeaveBalanceSchema.statics.getLeaveBalancesByEmployee = function(employeeId, tenantId, year = new Date().getFullYear()) {
  return this.find({
    employee_id: employeeId,
    tenant_id: tenantId,
    year
  }).populate('leave_type_id', 'name is_paid').sort('leave_type_id.name');
};

/**
 * Get leave balance for specific leave type
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} leaveTypeId - Leave Type ID
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Number} year - Year (optional, defaults to current year)
 * @returns {Promise<Object>} Leave balance
 */
LeaveBalanceSchema.statics.getLeaveBalanceForType = function(employeeId, leaveTypeId, tenantId, year = new Date().getFullYear()) {
  return this.findOne({
    employee_id: employeeId,
    leave_type_id: leaveTypeId,
    tenant_id: tenantId,
    year
  }).populate('leave_type_id', 'name is_paid');
};

/**
 * Update used balance
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} leaveTypeId - Leave Type ID
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Number} days - Days to add to used balance
 * @param {Number} year - Year (optional, defaults to current year)
 * @returns {Promise<Object>} Updated leave balance
 */
LeaveBalanceSchema.statics.updateUsedBalance = async function(employeeId, leaveTypeId, tenantId, days, year = new Date().getFullYear()) {
  const leaveBalance = await this.findOne({
    employee_id: employeeId,
    leave_type_id: leaveTypeId,
    tenant_id: tenantId,
    year
  });
  
  if (!leaveBalance) {
    throw new Error('Leave balance not found');
  }
  
  leaveBalance.used_balance += days;
  leaveBalance.remaining_balance = leaveBalance.initial_balance + leaveBalance.carried_over - leaveBalance.used_balance;
  
  return leaveBalance.save();
};

/**
 * Generate leave balances for all active employees
 * @param {Object} params - Parameters
 * @param {ObjectId} params.tenantId - Tenant ID
 * @param {Number} params.year - Year
 * @param {ObjectId} params.createdBy - User ID of creator
 * @returns {Promise<Array>} Generated leave balances
 */
LeaveBalanceSchema.statics.generateYearlyLeaveBalances = async function(params) {
  const { tenantId, year, createdBy } = params;
  
  // Get all active employees
  const Employee = mongoose.model('Employee');
  const activeEmployees = await Employee.getActiveEmployees(tenantId);
  
  // Get all active leave types
  const LeaveType = mongoose.model('LeaveType');
  const activeLeaveTypes = await LeaveType.getActiveLeaveTypes(tenantId);
  
  const leaveBalances = [];
  
  // Create leave balance records for each employee and leave type
  for (const employee of activeEmployees) {
    for (const leaveType of activeLeaveTypes) {
      // Check if leave balance record already exists
      const existingBalance = await this.findOne({
        employee_id: employee._id,
        leave_type_id: leaveType._id,
        year,
        tenant_id: tenantId
      });
      
      if (!existingBalance) {
        // Get previous year's balance for carryover calculation
        const prevYear = year - 1;
        const prevYearBalance = await this.findOne({
          employee_id: employee._id,
          leave_type_id: leaveType._id,
          year: prevYear,
          tenant_id: tenantId
        });
        
        let carriedOver = 0;
        
        // Calculate carryover if applicable
        if (prevYearBalance && leaveType.is_carryover) {
          const remainingPrevYear = prevYearBalance.remaining_balance;
          carriedOver = leaveType.max_carryover 
            ? Math.min(remainingPrevYear, leaveType.max_carryover)
            : remainingPrevYear;
        }
        
        // Create new leave balance record
        const leaveBalance = new this({
          employee_id: employee._id,
          leave_type_id: leaveType._id,
          year,
          initial_balance: leaveType.annual_balance,
          used_balance: 0,
          remaining_balance: leaveType.annual_balance + carriedOver,
          carried_over: carriedOver,
          tenant_id: tenantId,
          created_by: createdBy,
          updated_by: createdBy
        });
        
        await leaveBalance.save();
        leaveBalances.push(leaveBalance);
      }
    }
  }
  
  return leaveBalances;
};

const LeaveBalance = mongoose.model('LeaveBalance', LeaveBalanceSchema);

module.exports = LeaveBalance;
