// controllers/financial/account.controller.js

const Account = require('../../models/financial/account.model');
const JournalEntry = require('../../models/financial/journal-entry.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');

/**
 * Account Controller
 * Handles operations related to financial accounts
 */
const AccountController = {
  /**
   * Create a new account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createAccount: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      
      // Create new account with tenant ID from authenticated user
      const accountData = {
        ...req.body,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      };
      
      const account = new Account(accountData);
      await account.save();
      
      res.status(201).json({
        success: true,
        data: account
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get all accounts for the tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAccounts: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { type, is_active, search } = req.query;
      
      // Build query
      const query = { tenant_id };
      
      // Filter by account type if provided
      if (type) {
        query.account_type = type;
      }
      
      // Filter by active status if provided
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
      
      // Search by name or code if provided
      if (search) {
        query.$or = [
          { account_name: { $regex: search, $options: 'i' } },
          { account_code: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get accounts
      const accounts = await Account.find(query).sort('account_code');
      
      res.status(200).json({
        success: true,
        count: accounts.length,
        data: accounts
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get chart of accounts (hierarchical structure)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getChartOfAccounts: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      
      // Get chart of accounts using static method
      const chartOfAccounts = await Account.getChartOfAccounts(tenant_id);
      
      res.status(200).json({
        success: true,
        data: chartOfAccounts
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single account by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid account ID format'
        });
      }
      
      // Find account
      const account = await Account.findOne({ _id: id, tenant_id });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: account
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update an account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid account ID format'
        });
      }
      
      // Find account
      let account = await Account.findOne({ _id: id, tenant_id });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      
      // Prevent modification of system accounts
      if (account.is_system) {
        return res.status(403).json({
          success: false,
          error: 'System accounts cannot be modified'
        });
      }
      
      // Update account
      const updateData = {
        ...req.body,
        updated_by: req.user._id
      };
      
      account = await Account.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        success: true,
        data: account
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Delete an account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid account ID format'
        });
      }
      
      // Find account
      const account = await Account.findOne({ _id: id, tenant_id });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      
      // Prevent deletion of system accounts
      if (account.is_system) {
        return res.status(403).json({
          success: false,
          error: 'System accounts cannot be deleted'
        });
      }
      
      // Check if account has child accounts
      const childAccounts = await Account.countDocuments({ parent_account_id: id });
      if (childAccounts > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete account with child accounts'
        });
      }
      
      // Check if account is used in journal entries
      const journalEntries = await JournalEntry.countDocuments({
        'details.account_id': id
      });
      
      if (journalEntries > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete account used in journal entries'
        });
      }
      
      // Delete account
      await Account.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get account balance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAccountBalance: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { start_date, end_date } = req.query;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid account ID format'
        });
      }
      
      // Find account
      const account = await Account.findOne({ _id: id, tenant_id });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      
      // Build date filter for journal entries
      const dateFilter = {};
      if (start_date) {
        dateFilter.entry_date = { $gte: new Date(start_date) };
      }
      if (end_date) {
        if (!dateFilter.entry_date) dateFilter.entry_date = {};
        dateFilter.entry_date.$lte = new Date(end_date);
      }
      
      // Get journal entry details for this account
      const journalEntryDetails = await JournalEntry.aggregate([
        {
          $match: {
            tenant_id: mongoose.Types.ObjectId(tenant_id),
            status: 'posted',
            ...dateFilter
          }
        },
        { $lookup: { from: 'journalentrydetails', localField: '_id', foreignField: 'entry_id', as: 'details' } },
        { $unwind: '$details' },
        { $match: { 'details.account_id': mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            total_debits: { $sum: '$details.debit_amount' },
            total_credits: { $sum: '$details.credit_amount' }
          }
        }
      ]);
      
      // Calculate balance based on account type
      let balance = 0;
      if (journalEntryDetails.length > 0) {
        const { total_debits, total_credits } = journalEntryDetails[0];
        
        if (['asset', 'expense'].includes(account.account_type)) {
          balance = total_debits - total_credits;
        } else {
          balance = total_credits - total_debits;
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          account_id: id,
          account_name: account.account_name,
          account_type: account.account_type,
          balance
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = AccountController;
