// controllers/hr/leave.controller.js

const Leave = require('../../models/hr/leave.model');
const LeaveType = require('../../models/hr/leave-type.model');
const LeaveBalance = require('../../models/hr/leave-balance.model');
const Employee = require('../../models/hr/employee.model');
const { validationResult } = require('express-validator');

/**
 * Create a new leave request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.createLeave = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const leaveData = {
      ...req.body,
      tenant_id: req.user.tenant_id,
      created_by: req.user._id,
      updated_by: req.user._id
    };

    // Check if employee exists
    const employee = await Employee.findOne({
      _id: leaveData.employee_id,
      tenant_id: req.user.tenant_id
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if leave type exists
    const leaveType = await LeaveType.findOne({
      _id: leaveData.leave_type,
      tenant_id: req.user.tenant_id
    });

    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    // Check for overlapping leaves
    const hasOverlap = await Leave.hasOverlappingLeaves(
      leaveData.employee_id,
      leaveData.start_date,
      leaveData.end_date
    );

    if (hasOverlap) {
      return res.status(400).json({ message: 'Employee already has leave scheduled for this period' });
    }

    // Check leave balance if leave type is not unpaid
    if (leaveType.is_paid) {
      const currentYear = new Date(leaveData.start_date).getFullYear();
      const leaveBalance = await LeaveBalance.getLeaveBalanceForType(
        leaveData.employee_id,
        leaveData.leave_type,
        req.user.tenant_id,
        currentYear
      );

      if (!leaveBalance) {
        return res.status(404).json({ message: 'Leave balance not found for this leave type' });
      }

      if (leaveBalance.remaining_balance < leaveData.days) {
        return res.status(400).json({ 
          message: 'Insufficient leave balance',
          available: leaveBalance.remaining_balance,
          requested: leaveData.days
        });
      }
    }

    // Create new leave request
    const leave = new Leave(leaveData);
    await leave.save();

    // If leave is auto-approved (e.g., by admin), update leave balance
    if (leave.status === 'approved' && leaveType.is_paid) {
      const currentYear = new Date(leave.start_date).getFullYear();
      await LeaveBalance.updateUsedBalance(
        leave.employee_id,
        leave.leave_type,
        req.user.tenant_id,
        leave.days,
        currentYear
      );
    }

    res.status(201).json({
      message: 'Leave request created successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Failed to create leave request', error: error.message });
  }
};

/**
 * Get all leave requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getLeaves = async (req, res) => {
  try {
    const { status, employee_id, start_date, end_date, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { tenant_id: req.user.tenant_id };
    
    if (status) {
      query.status = status;
    }
    
    if (employee_id) {
      query.employee_id = employee_id;
    }
    
    if (start_date && end_date) {
      query.$or = [
        { start_date: { $lte: new Date(end_date), $gte: new Date(start_date) } },
        { end_date: { $lte: new Date(end_date), $gte: new Date(start_date) } },
        { 
          start_date: { $lte: new Date(start_date) },
          end_date: { $gte: new Date(end_date) }
        }
      ];
    } else if (start_date) {
      query.start_date = { $gte: new Date(start_date) };
    } else if (end_date) {
      query.end_date = { $lte: new Date(end_date) };
    }
    
    // Get leaves with pagination
    const leaves = await Leave.find(query)
      .populate('employee_id', 'first_name last_name email job_title department')
      .populate('leave_type', 'name is_paid')
      .sort('-created_at')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Leave.countDocuments(query);
    
    res.status(200).json({
      data: leaves,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting leave requests:', error);
    res.status(500).json({ message: 'Failed to get leave requests', error: error.message });
  }
};

/**
 * Get leave request by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    })
    .populate('employee_id', 'first_name last_name email job_title department')
    .populate('leave_type', 'name is_paid')
    .populate('approved_by', 'first_name last_name email');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    res.status(200).json({ data: leave });
  } catch (error) {
    console.error('Error getting leave request:', error);
    res.status(500).json({ message: 'Failed to get leave request', error: error.message });
  }
};

/**
 * Update leave request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.updateLeave = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get current leave request
    const currentLeave = await Leave.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    }).populate('leave_type', 'name is_paid');
    
    if (!currentLeave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Check if leave is already approved or rejected
    if (currentLeave.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({ 
        message: `Cannot update leave request that is already ${currentLeave.status}` 
      });
    }
    
    const leaveData = {
      ...req.body,
      updated_by: req.user._id
    };
    
    // If dates are changing, check for overlaps
    if (
      (leaveData.start_date && new Date(leaveData.start_date).getTime() !== currentLeave.start_date.getTime()) ||
      (leaveData.end_date && new Date(leaveData.end_date).getTime() !== currentLeave.end_date.getTime())
    ) {
      const startDate = leaveData.start_date || currentLeave.start_date;
      const endDate = leaveData.end_date || currentLeave.end_date;
      
      const hasOverlap = await Leave.hasOverlappingLeaves(
        currentLeave.employee_id,
        startDate,
        endDate,
        currentLeave._id
      );
      
      if (hasOverlap) {
        return res.status(400).json({ message: 'Employee already has leave scheduled for this period' });
      }
    }
    
    // If days are changing, check leave balance
    if (leaveData.days && leaveData.days !== currentLeave.days && currentLeave.leave_type.is_paid) {
      const currentYear = new Date(currentLeave.start_date).getFullYear();
      const leaveBalance = await LeaveBalance.getLeaveBalanceForType(
        currentLeave.employee_id,
        currentLeave.leave_type._id,
        req.user.tenant_id,
        currentYear
      );
      
      if (!leaveBalance) {
        return res.status(404).json({ message: 'Leave balance not found for this leave type' });
      }
      
      // Calculate adjusted balance (add back current days, then subtract new days)
      const adjustedBalance = leaveBalance.remaining_balance + 
        (currentLeave.status === 'approved' ? currentLeave.days : 0) - 
        leaveData.days;
      
      if (adjustedBalance < 0) {
        return res.status(400).json({ 
          message: 'Insufficient leave balance',
          available: leaveBalance.remaining_balance + 
            (currentLeave.status === 'approved' ? currentLeave.days : 0),
          requested: leaveData.days
        });
      }
    }
    
    // Handle status change to approved
    if (leaveData.status === 'approved' && currentLeave.status !== 'approved') {
      leaveData.approved_by = req.user._id;
      leaveData.approval_date = new Date();
      
      // Update leave balance if leave type is paid
      if (currentLeave.leave_type.is_paid) {
        const currentYear = new Date(currentLeave.start_date).getFullYear();
        await LeaveBalance.updateUsedBalance(
          currentLeave.employee_id,
          currentLeave.leave_type._id,
          req.user.tenant_id,
          leaveData.days || currentLeave.days,
          currentYear
        );
      }
    }
    
    // Handle status change from approved to rejected
    if (leaveData.status === 'rejected' && currentLeave.status === 'approved') {
      // Restore leave balance if leave type is paid
      if (currentLeave.leave_type.is_paid) {
        const currentYear = new Date(currentLeave.start_date).getFullYear();
        const leaveBalance = await LeaveBalance.getLeaveBalanceForType(
          currentLeave.employee_id,
          currentLeave.leave_type._id,
          req.user.tenant_id,
          currentYear
        );
        
        if (leaveBalance) {
          leaveBalance.used_balance -= currentLeave.days;
          leaveBalance.remaining_balance += currentLeave.days;
          leaveBalance.updated_by = req.user._id;
          await leaveBalance.save();
        }
      }
    }
    
    // Update leave request
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, tenant_id: req.user.tenant_id },
      leaveData,
      { new: true, runValidators: true }
    )
    .populate('employee_id', 'first_name last_name email job_title department')
    .populate('leave_type', 'name is_paid')
    .populate('approved_by', 'first_name last_name email');
    
    res.status(200).json({
      message: 'Leave request updated successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Failed to update leave request', error: error.message });
  }
};

/**
 * Delete leave request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.deleteLeave = async (req, res) => {
  try {
    // Get current leave request
    const leave = await Leave.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    }).populate('leave_type', 'name is_paid');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Check if leave is already approved
    if (leave.status === 'approved') {
      // Restore leave balance if leave type is paid
      if (leave.leave_type.is_paid) {
        const currentYear = new Date(leave.start_date).getFullYear();
        const leaveBalance = await LeaveBalance.getLeaveBalanceForType(
          leave.employee_id,
          leave.leave_type._id,
          req.user.tenant_id,
          currentYear
        );
        
        if (leaveBalance) {
          leaveBalance.used_balance -= leave.days;
          leaveBalance.remaining_balance += leave.days;
          leaveBalance.updated_by = req.user._id;
          await leaveBalance.save();
        }
      }
    }
    
    // Delete leave request
    await Leave.deleteOne({ _id: req.params.id, tenant_id: req.user.tenant_id });
    
    res.status(200).json({
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ message: 'Failed to delete leave request', error: error.message });
  }
};

/**
 * Get leave requests by employee
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getLeavesByEmployee = async (req, res) => {
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
    
    const leaves = await Leave.getLeavesByEmployee(
      employeeId,
      req.user.tenant_id
    );
    
    res.status(200).json({ data: leaves });
  } catch (error) {
    console.error('Error getting leaves by employee:', error);
    res.status(500).json({ message: 'Failed to get leaves by employee', error: error.message });
  }
};

/**
 * Get leave requests by status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getLeavesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const leaves = await Leave.getLeavesByStatus(
      req.user.tenant_id,
      status
    );
    
    res.status(200).json({ data: leaves });
  } catch (error) {
    console.error('Error getting leaves by status:', error);
    res.status(500).json({ message: 'Failed to get leaves by status', error: error.message });
  }
};

/**
 * Get current and upcoming leaves
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.getCurrentAndUpcomingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.getCurrentAndUpcomingLeaves(
      req.user.tenant_id
    );
    
    res.status(200).json({ data: leaves });
  } catch (error) {
    console.error('Error getting current and upcoming leaves:', error);
    res.status(500).json({ message: 'Failed to get current and upcoming leaves', error: error.message });
  }
};

/**
 * Approve leave request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.approveLeave = async (req, res) => {
  try {
    // Get current leave request
    const leave = await Leave.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    }).populate('leave_type', 'name is_paid');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Check if leave is already approved or rejected
    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        message: `Leave request is already ${leave.status}` 
      });
    }
    
    // Update leave status
    leave.status = 'approved';
    leave.approved_by = req.user._id;
    leave.approval_date = new Date();
    leave.updated_by = req.user._id;
    
    // Update leave balance if leave type is paid
    if (leave.leave_type.is_paid) {
      const currentYear = new Date(leave.start_date).getFullYear();
      await LeaveBalance.updateUsedBalance(
        leave.employee_id,
        leave.leave_type._id,
        req.user.tenant_id,
        leave.days,
        currentYear
      );
    }
    
    await leave.save();
    
    res.status(200).json({
      message: 'Leave request approved successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ message: 'Failed to approve leave request', error: error.message });
  }
};

/**
 * Reject leave request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Response
 */
exports.rejectLeave = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Get current leave request
    const leave = await Leave.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id
    });
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Check if leave is already approved or rejected
    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        message: `Leave request is already ${leave.status}` 
      });
    }
    
    // Update leave status
    leave.status = 'rejected';
    leave.notes = reason || leave.notes;
    leave.updated_by = req.user._id;
    
    await leave.save();
    
    res.status(200).json({
      message: 'Leave request rejected successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({ message: 'Failed to reject leave request', error: error.message });
  }
};
