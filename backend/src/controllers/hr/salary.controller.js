// controllers/hr/salary.controller.js

const Salary = require('../../models/hr/salary.model');
const Employee = require('../../models/hr/employee.model');
const { validationResult } = require('express-validator');

/**
 * Create a new salary record
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.createSalary = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const salaryData = {
      ...req.body,
      tenant_id: req.user.tenant_id,
      created_by: req.user._id,
      updated_by: req.user._id
    };

    // Check if employee exists
    const employee = await Employee.findOne({
      _id: salaryData.employee_id,
      tenant_id: req.user.tenant_id
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if salary record already exists for this month/year
    const existingSalary = await Salary.findOne({
      employee_id: salaryData.employee_id,
      month: salaryData.month,
      year: salaryData.year,
      tenant_id: req.user.tenant_id
    });

    if (existingSalary) {
      return res.status(400).json({ message: 'Salary record already exists for this month and year' });
    }

    // Create new salary record
    const salary = new Salary(salaryData);
    await salary.save();

    res.status(201).json({
      message: 'Salary record created successfully',
      data: salary
    });
  } catch (error) {
    console.error('Error creating salary record:', error);
    res.status(500).json({ message: 'Failed to create salary record', error: error.message });
  }
};

/**
 * Get all salary records
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getSalaries = async (req, res) => {
  try {
    const { employee_id, month, year, payment_status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { tenant_id: req.user.tenant_id };
    
    if (employee_id) {
      query.employee_id = employee_id;
    }
    
    if (month) {
      query.month = parseInt(month);
    }
    
    if (year) {
      query.year = parseInt(year);
    }
    
    if (payment_status) {
      query.payment_status = payment_status;
    }
    
    // Get salaries with pagination
    const salaries = await Salary.find(query)
      .populate('employee_id', 'first_name last_name email job_title department')
      .sort('-year -month')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Salary.countDocuments(query);
    
    res.status(200).json({
      data: salaries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting salary records:', error);
    res.status(500).json({ message: 'Failed to get salary records', error: error.message });
  }
};

/**
 * Get salary record by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getSalary = async (req, res) => {
  try {
    const salary = await Salary.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    }).populate('employee_id', 'first_name last_name email job_title department');
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.status(200).json({ data: salary });
  } catch (error) {
    console.error('Error getting salary record:', error);
    res.status(500).json({ message: 'Failed to get salary record', error: error.message });
  }
};

/**
 * Update salary record
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.updateSalary = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const salaryData = {
      ...req.body,
      updated_by: req.user._id
    };
    
    // Check if salary record exists
    const currentSalary = await Salary.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    });
    
    if (!currentSalary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Check if payment status is already paid
    if (currentSalary.payment_status === 'paid' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot update salary record that is already paid' });
    }
    
    // Update salary record
    const salary = await Salary.findOneAndUpdate(
      { _id: req.params.id, tenant_id: req.user.tenant_id },
      salaryData,
      { new: true, runValidators: true }
    ).populate('employee_id', 'first_name last_name email job_title department');
    
    res.status(200).json({
      message: 'Salary record updated successfully',
      data: salary
    });
  } catch (error) {
    console.error('Error updating salary record:', error);
    res.status(500).json({ message: 'Failed to update salary record', error: error.message });
  }
};

/**
 * Delete salary record
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.deleteSalary = async (req, res) => {
  try {
    // Check if salary record exists
    const salary = await Salary.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    });
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Check if payment status is already paid
    if (salary.payment_status === 'paid' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot delete salary record that is already paid' });
    }
    
    // Delete salary record
    await Salary.deleteOne({ _id: req.params.id, tenant_id: req.user.tenant_id });
    
    res.status(200).json({
      message: 'Salary record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting salary record:', error);
    res.status(500).json({ message: 'Failed to delete salary record', error: error.message });
  }
};

/**
 * Get salary records by employee
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getSalariesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Check if employee exists
    const employee = await Employee.findOne({
      _id: employeeId,
      tenant_id: req.user.tenant_id
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const salaries = await Salary.getSalariesByEmployee(
      employeeId,
      req.user.tenant_id
    );
    
    res.status(200).json({ data: salaries });
  } catch (error) {
    console.error('Error getting salaries by employee:', error);
    res.status(500).json({ message: 'Failed to get salaries by employee', error: error.message });
  }
};

/**
 * Get salary records by month and year
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getSalariesByMonthYear = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    const salaries = await Salary.getSalariesByMonthYear(
      req.user.tenant_id,
      parseInt(month),
      parseInt(year)
    );
    
    res.status(200).json({ data: salaries });
  } catch (error) {
    console.error('Error getting salaries by month and year:', error);
    res.status(500).json({ message: 'Failed to get salaries by month and year', error: error.message });
  }
};

/**
 * Get pending salary payments
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getPendingSalaries = async (req, res) => {
  try {
    const salaries = await Salary.getPendingSalaries(
      req.user.tenant_id
    );
    
    res.status(200).json({ data: salaries });
  } catch (error) {
    console.error('Error getting pending salaries:', error);
    res.status(500).json({ message: 'Failed to get pending salaries', error: error.message });
  }
};

/**
 * Generate monthly salaries for all active employees
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.generateMonthlySalaries = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    const salaries = await Salary.generateMonthlySalaries({
      tenantId: req.user.tenant_id,
      month: parseInt(month),
      year: parseInt(year),
      createdBy: req.user._id
    });
    
    res.status(200).json({
      message: `Generated ${salaries.length} salary records for ${month}/${year}`,
      data: salaries
    });
  } catch (error) {
    console.error('Error generating monthly salaries:', error);
    res.status(500).json({ message: 'Failed to generate monthly salaries', error: error.message });
  }
};

/**
 * Process salary payments
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.processSalaryPayments = async (req, res) => {
  try {
    const { salaryIds, payment_date } = req.body;
    
    if (!salaryIds || !Array.isArray(salaryIds) || salaryIds.length === 0) {
      return res.status(400).json({ message: 'Salary IDs are required' });
    }
    
    const paymentDate = payment_date ? new Date(payment_date) : new Date();
    
    // Update salary records
    const result = await Salary.updateMany(
      {
        _id: { $in: salaryIds },
        tenant_id: req.user.tenant_id,
        payment_status: { $ne: 'paid' }
      },
      {
        payment_status: 'paid',
        payment_date: paymentDate,
        updated_by: req.user._id
      }
    );
    
    res.status(200).json({
      message: `Processed ${result.nModified} salary payments`,
      modified: result.nModified
    });
  } catch (error) {
    console.error('Error processing salary payments:', error);
    res.status(500).json({ message: 'Failed to process salary payments', error: error.message });
  }
};
