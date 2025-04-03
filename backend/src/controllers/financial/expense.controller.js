// controllers/financial/expense.controller.js

const Expense = require('../../models/financial/expense.model');
const ExpenseCategory = require('../../models/financial/expense-category.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');
const mongoose = require('mongoose');

/**
 * Expense Controller
 * Handles operations related to expenses
 */
const ExpenseController = {
  /**
   * Create a new expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createExpense: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      
      // Validate category exists
      const category = await ExpenseCategory.findOne({ 
        _id: req.body.category_id, 
        tenant_id 
      });
      
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Expense category not found'
        });
      }
      
      // Create new expense
      const expense = new Expense({
        ...req.body,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await expense.save();
      
      // If auto-approval is enabled, approve the expense
      if (req.body.auto_approve) {
        await expense.approve(req.user._id);
      }
      
      res.status(201).json({
        success: true,
        data: expense
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get all expenses for the tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getExpenses: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        category_id,
        approval_status,
        payment_status,
        is_billable,
        client_id,
        case_id,
        start_date,
        end_date,
        search,
        page = 1,
        limit = 10,
        sort_by = 'expense_date',
        sort_order = 'desc'
      } = req.query;
      
      // Build query
      const query = { tenant_id };
      
      // Filter by category if provided
      if (category_id) {
        query.category_id = category_id;
      }
      
      // Filter by approval status if provided
      if (approval_status) {
        query.approval_status = approval_status;
      }
      
      // Filter by payment status if provided
      if (payment_status) {
        query.payment_status = payment_status;
      }
      
      // Filter by billable status if provided
      if (is_billable !== undefined) {
        query.is_billable = is_billable === 'true';
      }
      
      // Filter by client if provided
      if (client_id) {
        query.client_id = client_id;
      }
      
      // Filter by case if provided
      if (case_id) {
        query.case_id = case_id;
      }
      
      // Filter by date range if provided
      if (start_date || end_date) {
        query.expense_date = {};
        if (start_date) {
          query.expense_date.$gte = new Date(start_date);
        }
        if (end_date) {
          query.expense_date.$lte = new Date(end_date);
        }
      }
      
      // Search by expense number or description if provided
      if (search) {
        query.$or = [
          { expense_number: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { vendor_name: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await Expense.countDocuments(query);
      
      // Get expenses
      const expenses = await Expense.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category_id', 'name')
        .populate('client_id', 'name')
        .populate('case_id', 'title')
        .populate('created_by', 'name');
      
      res.status(200).json({
        success: true,
        count: expenses.length,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        data: expenses
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single expense by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense ID format'
        });
      }
      
      // Find expense
      const expense = await Expense.findOne({ _id: id, tenant_id })
        .populate('category_id', 'name')
        .populate('client_id', 'name email phone')
        .populate('case_id', 'title')
        .populate('employee_id', 'name email')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email')
        .populate('approved_by', 'name email');
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update an expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense ID format'
        });
      }
      
      // Find expense
      const expense = await Expense.findOne({ _id: id, tenant_id });
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }
      
      // Only pending expenses can be updated
      if (expense.approval_status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Only pending expenses can be updated'
        });
      }
      
      // If category is being updated, validate it exists
      if (req.body.category_id && req.body.category_id !== expense.category_id.toString()) {
        const category = await ExpenseCategory.findOne({ 
          _id: req.body.category_id, 
          tenant_id 
        });
        
        if (!category) {
          return res.status(404).json({
            success: false,
            error: 'Expense category not found'
          });
        }
      }
      
      // Update expense
      const updateData = {
        ...req.body,
        updated_by: req.user._id
      };
      
      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('category_id', 'name')
        .populate('client_id', 'name email phone')
        .populate('case_id', 'title')
        .populate('employee_id', 'name email')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedExpense
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Delete an expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense ID format'
        });
      }
      
      // Find expense
      const expense = await Expense.findOne({ _id: id, tenant_id });
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }
      
      // Only pending expenses can be deleted
      if (expense.approval_status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Only pending expenses can be deleted'
        });
      }
      
      // Delete expense
      await Expense.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Approve an expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  approveExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense ID format'
        });
      }
      
      // Find expense
      const expense = await Expense.findOne({ _id: id, tenant_id });
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }
      
      // Approve the expense
      await expense.approve(req.user._id);
      
      // Fetch the updated expense
      const updatedExpense = await Expense.findById(id)
        .populate('category_id', 'name')
        .populate('client_id', 'name email phone')
        .populate('case_id', 'title')
        .populate('employee_id', 'name email')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email')
        .populate('approved_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedExpense
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Reject an expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  rejectExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { reason } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense ID format'
        });
      }
      
      // Validate reason
      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        });
      }
      
      // Find expense
      const expense = await Expense.findOne({ _id: id, tenant_id });
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }
      
      // Reject the expense
      await expense.reject(reason, req.user._id);
      
      // Fetch the updated expense
      const updatedExpense = await Expense.findById(id)
        .populate('category_id', 'name')
        .populate('client_id', 'name email phone')
        .populate('case_id', 'title')
        .populate('employee_id', 'name email')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedExpense
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Mark expense as paid
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { payment_method, payment_date, reference_number } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense ID format'
        });
      }
      
      // Validate payment method
      if (!payment_method) {
        return res.status(400).json({
          success: false,
          error: 'Payment method is required'
        });
      }
      
      // Find expense
      const expense = await Expense.findOne({ _id: id, tenant_id });
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }
      
      // Only approved expenses can be marked as paid
      if (expense.approval_status !== 'approved') {
        return res.status(400).json({
          success: false,
          error: 'Only approved expenses can be marked as paid'
        });
      }
      
      // Mark expense as paid
      await expense.markAsPaid(
        payment_method,
        payment_date ? new Date(payment_date) : null,
        reference_number,
        req.user._id
      );
      
      // Fetch the updated expense
      const updatedExpense = await Expense.findById(id)
        .populate('category_id', 'name')
        .populate('client_id', 'name email phone')
        .populate('case_id', 'title')
        .populate('employee_id', 'name email')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email')
        .populate('approved_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedExpense
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = ExpenseController;
