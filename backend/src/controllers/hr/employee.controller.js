// controllers/hr/employee.controller.js

const Employee = require('../../models/hr/employee.model');
const Qualification = require('../../models/hr/qualification.model');
const Leave = require('../../models/hr/leave.model');
const LeaveBalance = require('../../models/hr/leave-balance.model');
const EmployeeAppraisal = require('../../models/hr/employee-appraisal.model');
const TrainingAttendance = require('../../models/hr/training-attendance.model');
const { validationResult } = require('express-validator');

/**
 * Create a new employee
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.createEmployee = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const employeeData = {
      ...req.body,
      tenant_id: req.user.tenant_id,
      created_by: req.user._id,
      updated_by: req.user._id
    };

    // Check if email already exists
    const existingEmployee = await Employee.findOne({
      email: employeeData.email,
      tenant_id: req.user.tenant_id
    });

    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Create new employee
    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Failed to create employee', error: error.message });
  }
};

/**
 * Get all employees
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getEmployees = async (req, res) => {
  try {
    const { status, department, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { tenant_id: req.user.tenant_id };
    
    if (status) {
      query.employment_status = status;
    }
    
    if (department) {
      query.department = department;
    }
    
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { first_name: regex },
        { last_name: regex },
        { email: regex },
        { job_title: regex }
      ];
    }
    
    // Get employees with pagination
    const employees = await Employee.find(query)
      .sort({ last_name: 1, first_name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Employee.countDocuments(query);
    
    res.status(200).json({
      data: employees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ message: 'Failed to get employees', error: error.message });
  }
};

/**
 * Get employee by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.status(200).json({ data: employee });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({ message: 'Failed to get employee', error: error.message });
  }
};

/**
 * Update employee
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.updateEmployee = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const employeeData = {
      ...req.body,
      updated_by: req.user._id
    };
    
    // Check if email already exists for another employee
    if (employeeData.email) {
      const existingEmployee = await Employee.findOne({
        email: employeeData.email,
        tenant_id: req.user.tenant_id,
        _id: { $ne: req.params.id }
      });
      
      if (existingEmployee) {
        return res.status(400).json({ message: 'Another employee with this email already exists' });
      }
    }
    
    // Update employee
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenant_id: req.user.tenant_id },
      employeeData,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.status(200).json({
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Failed to update employee', error: error.message });
  }
};

/**
 * Delete employee
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.deleteEmployee = async (req, res) => {
  try {
    // Check if employee exists
    const employee = await Employee.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Instead of deleting, set employment status to terminated
    employee.employment_status = 'terminated';
    employee.updated_by = req.user._id;
    await employee.save();
    
    res.status(200).json({
      message: 'Employee status set to terminated',
      data: employee
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Failed to delete employee', error: error.message });
  }
};

/**
 * Get employee dashboard data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const tenantId = req.user.tenant_id;
    
    // Get employee details
    const employee = await Employee.findOne({
      _id: employeeId,
      tenant_id: tenantId
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Get qualifications
    const qualifications = await Qualification.find({
      employee_id: employeeId,
      tenant_id: tenantId
    }).sort('-date_obtained');
    
    // Get leave balances for current year
    const currentYear = new Date().getFullYear();
    const leaveBalances = await LeaveBalance.find({
      employee_id: employeeId,
      tenant_id: tenantId,
      year: currentYear
    }).populate('leave_type_id', 'name is_paid');
    
    // Get recent leaves
    const recentLeaves = await Leave.find({
      employee_id: employeeId,
      tenant_id: tenantId
    }).populate('leave_type', 'name is_paid')
      .sort('-start_date')
      .limit(5);
    
    // Get recent appraisals
    const recentAppraisals = await EmployeeAppraisal.find({
      employee_id: employeeId,
      tenant_id: tenantId
    }).populate('appraisal_cycle_id', 'name start_date end_date')
      .populate('appraiser_id', 'first_name last_name job_title')
      .sort('-appraisal_date')
      .limit(3);
    
    // Get upcoming trainings
    const upcomingTrainings = await TrainingAttendance.find({
      employee_id: employeeId,
      tenant_id: tenantId,
      attendance_status: 'registered'
    }).populate({
      path: 'training_id',
      match: { status: { $in: ['planned', 'in_progress'] } },
      select: 'title type start_date end_date status'
    }).sort('training_id.start_date')
      .limit(3);
    
    // Filter out null training_id (if training was deleted or status changed)
    const filteredUpcomingTrainings = upcomingTrainings.filter(
      attendance => attendance.training_id !== null
    );
    
    res.status(200).json({
      data: {
        employee,
        qualifications,
        leaveBalances,
        recentLeaves,
        recentAppraisals,
        upcomingTrainings: filteredUpcomingTrainings
      }
    });
  } catch (error) {
    console.error('Error getting employee dashboard:', error);
    res.status(500).json({ message: 'Failed to get employee dashboard', error: error.message });
  }
};

/**
 * Get employees by department
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getEmployeesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const employees = await Employee.getEmployeesByDepartment(
      req.user.tenant_id,
      department
    );
    
    res.status(200).json({ data: employees });
  } catch (error) {
    console.error('Error getting employees by department:', error);
    res.status(500).json({ message: 'Failed to get employees by department', error: error.message });
  }
};

/**
 * Get employees by manager
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getEmployeesByManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    
    const employees = await Employee.getEmployeesByManager(
      req.user.tenant_id,
      managerId
    );
    
    res.status(200).json({ data: employees });
  } catch (error) {
    console.error('Error getting employees by manager:', error);
    res.status(500).json({ message: 'Failed to get employees by manager', error: error.message });
  }
};

/**
 * Get employees with contracts ending soon
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getEmployeesWithContractsEndingSoon = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const employees = await Employee.getEmployeesWithContractsEndingSoon(
      req.user.tenant_id,
      parseInt(days)
    );
    
    res.status(200).json({ data: employees });
  } catch (error) {
    console.error('Error getting employees with contracts ending soon:', error);
    res.status(500).json({ message: 'Failed to get employees with contracts ending soon', error: error.message });
  }
};

/**
 * Search employees
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.searchEmployees = async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ message: 'Search term is required' });
    }
    
    const employees = await Employee.searchEmployees(
      req.user.tenant_id,
      term
    );
    
    res.status(200).json({ data: employees });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ message: 'Failed to search employees', error: error.message });
  }
};
