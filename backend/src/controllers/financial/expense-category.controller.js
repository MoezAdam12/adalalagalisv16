// controllers/financial/expense-category.controller.js

const ExpenseCategory = require('../../models/financial/expense-category.model');
const Expense = require('../../models/financial/expense.model');
const Account = require('../../models/financial/account.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');

/**
 * Expense Category Controller
 * Handles operations related to expense categories
 */
const ExpenseCategoryController = {
  /**
   * Create a new expense category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createExpenseCategory: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      
      // Validate account exists
      const account = await Account.findOne({ 
        _id: req.body.account_id, 
        tenant_id,
        account_type: 'expense'
      });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Expense account not found'
        });
      }
      
      // Create new expense category
      const expenseCategory = new ExpenseCategory({
        ...req.body,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await expenseCategory.save();
      
      res.status(201).json({
        success: true,
        data: expenseCategory
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get all expense categories for the tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getExpenseCategories: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { is_active, search } = req.query;
      
      // Build query
      const query = { tenant_id };
      
      // Filter by active status if provided
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
      
      // Search by name if provided
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      
      // Get expense categories
      const expenseCategories = await ExpenseCategory.find(query)
        .sort('name')
        .populate('account_id', 'account_code account_name');
      
      res.status(200).json({
        success: true,
        count: expenseCategories.length,
        data: expenseCategories
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single expense category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getExpenseCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense category ID format'
        });
      }
      
      // Find expense category
      const expenseCategory = await ExpenseCategory.findOne({ _id: id, tenant_id })
        .populate('account_id', 'account_code account_name')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      if (!expenseCategory) {
        return res.status(404).json({
          success: false,
          error: 'Expense category not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: expenseCategory
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update an expense category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateExpenseCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense category ID format'
        });
      }
      
      // Find expense category
      const expenseCategory = await ExpenseCategory.findOne({ _id: id, tenant_id });
      
      if (!expenseCategory) {
        return res.status(404).json({
          success: false,
          error: 'Expense category not found'
        });
      }
      
      // Prevent modification of system categories
      if (expenseCategory.is_system) {
        return res.status(403).json({
          success: false,
          error: 'System categories cannot be modified'
        });
      }
      
      // If account is being updated, validate it exists
      if (req.body.account_id && req.body.account_id !== expenseCategory.account_id.toString()) {
        const account = await Account.findOne({ 
          _id: req.body.account_id, 
          tenant_id,
          account_type: 'expense'
        });
        
        if (!account) {
          return res.status(404).json({
            success: false,
            error: 'Expense account not found'
          });
        }
      }
      
      // Update expense category
      const updateData = {
        ...req.body,
        updated_by: req.user._id
      };
      
      const updatedExpenseCategory = await ExpenseCategory.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('account_id', 'account_code account_name');
      
      res.status(200).json({
        success: true,
        data: updatedExpenseCategory
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Delete an expense category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteExpenseCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense category ID format'
        });
      }
      
      // Find expense category
      const expenseCategory = await ExpenseCategory.findOne({ _id: id, tenant_id });
      
      if (!expenseCategory) {
        return res.status(404).json({
          success: false,
          error: 'Expense category not found'
        });
      }
      
      // Prevent deletion of system categories
      if (expenseCategory.is_system) {
        return res.status(403).json({
          success: false,
          error: 'System categories cannot be deleted'
        });
      }
      
      // Check if category is used in expenses
      const expenseCount = await Expense.countDocuments({ category_id: id });
      
      if (expenseCount > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete category used in ${expenseCount} expenses`
        });
      }
      
      // Delete expense category
      await ExpenseCategory.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = ExpenseCategoryController;
