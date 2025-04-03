// controllers/timetracking/billing-rate.controller.js

const BillingRate = require('../../models/timetracking/billing-rate.model');
const User = require('../../models/user.model');
const Client = require('../../models/client.model');
const CaseType = require('../../models/case-type.model');
const ActivityType = require('../../models/timetracking/activity-type.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');

/**
 * Billing Rate Controller
 * Handles operations related to billing rates
 */
const BillingRateController = {
  /**
   * Create a new billing rate
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createBillingRate: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const billingRateData = req.body;
      
      // Validate user if provided
      if (billingRateData.user_id) {
        if (!validateObjectId(billingRateData.user_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid user ID'
          });
        }
        
        const userExists = await User.findOne({
          _id: billingRateData.user_id,
          tenant_id
        });
        
        if (!userExists) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }
      }
      
      // Validate client if provided
      if (billingRateData.client_id) {
        if (!validateObjectId(billingRateData.client_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid client ID'
          });
        }
        
        const clientExists = await Client.findOne({
          _id: billingRateData.client_id,
          tenant_id
        });
        
        if (!clientExists) {
          return res.status(404).json({
            success: false,
            error: 'Client not found'
          });
        }
      }
      
      // Validate case type if provided
      if (billingRateData.case_type_id) {
        if (!validateObjectId(billingRateData.case_type_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid case type ID'
          });
        }
        
        const caseTypeExists = await CaseType.findOne({
          _id: billingRateData.case_type_id,
          tenant_id
        });
        
        if (!caseTypeExists) {
          return res.status(404).json({
            success: false,
            error: 'Case type not found'
          });
        }
      }
      
      // Validate activity type if provided
      if (billingRateData.activity_type_id) {
        if (!validateObjectId(billingRateData.activity_type_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid activity type ID'
          });
        }
        
        const activityTypeExists = await ActivityType.findOne({
          _id: billingRateData.activity_type_id,
          tenant_id
        });
        
        if (!activityTypeExists) {
          return res.status(404).json({
            success: false,
            error: 'Activity type not found'
          });
        }
      }
      
      // Validate dates
      if (billingRateData.end_date && new Date(billingRateData.end_date) <= new Date(billingRateData.effective_date)) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after effective date'
        });
      }
      
      // Check for overlapping rates with the same criteria
      const overlappingQuery = {
        tenant_id,
        $or: [
          { end_date: null },
          { end_date: { $gte: new Date(billingRateData.effective_date) } }
        ]
      };
      
      // Add criteria to query
      if (billingRateData.user_id) {
        overlappingQuery.user_id = billingRateData.user_id;
      } else {
        overlappingQuery.user_id = null;
      }
      
      if (billingRateData.client_id) {
        overlappingQuery.client_id = billingRateData.client_id;
      } else {
        overlappingQuery.client_id = null;
      }
      
      if (billingRateData.case_type_id) {
        overlappingQuery.case_type_id = billingRateData.case_type_id;
      } else {
        overlappingQuery.case_type_id = null;
      }
      
      if (billingRateData.activity_type_id) {
        overlappingQuery.activity_type_id = billingRateData.activity_type_id;
      } else {
        overlappingQuery.activity_type_id = null;
      }
      
      // Check if end date is provided
      if (billingRateData.end_date) {
        overlappingQuery.effective_date = { $lte: new Date(billingRateData.end_date) };
      }
      
      const overlappingRate = await BillingRate.findOne(overlappingQuery);
      
      if (overlappingRate) {
        return res.status(400).json({
          success: false,
          error: 'A billing rate with the same criteria already exists for the specified date range'
        });
      }
      
      // Create new billing rate
      const billingRate = new BillingRate({
        ...billingRateData,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await billingRate.save();
      
      // Populate references
      await BillingRate.populate(billingRate, [
        { path: 'user_id', select: 'name email' },
        { path: 'client_id', select: 'name' },
        { path: 'case_type_id', select: 'name' },
        { path: 'activity_type_id', select: 'name' }
      ]);
      
      res.status(201).json({
        success: true,
        data: billingRate
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get all billing rates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getBillingRates: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        user_id,
        client_id,
        case_type_id,
        activity_type_id,
        is_active,
        search,
        page = 1,
        limit = 10,
        sort_by = 'effective_date',
        sort_order = 'desc'
      } = req.query;
      
      // Build query
      const query = { tenant_id };
      
      // Filter by user if provided
      if (user_id) {
        if (!validateObjectId(user_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid user ID'
          });
        }
        query.user_id = user_id;
      }
      
      // Filter by client if provided
      if (client_id) {
        if (!validateObjectId(client_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid client ID'
          });
        }
        query.client_id = client_id;
      }
      
      // Filter by case type if provided
      if (case_type_id) {
        if (!validateObjectId(case_type_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid case type ID'
          });
        }
        query.case_type_id = case_type_id;
      }
      
      // Filter by activity type if provided
      if (activity_type_id) {
        if (!validateObjectId(activity_type_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid activity type ID'
          });
        }
        query.activity_type_id = activity_type_id;
      }
      
      // Filter by active status if provided
      if (is_active === 'true') {
        const currentDate = new Date();
        query.effective_date = { $lte: currentDate };
        query.$or = [
          { end_date: null },
          { end_date: { $gte: currentDate } }
        ];
      } else if (is_active === 'false') {
        const currentDate = new Date();
        query.$or = [
          { effective_date: { $gt: currentDate } },
          { end_date: { $lt: currentDate, $ne: null } }
        ];
      }
      
      // Search by name if provided
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await BillingRate.countDocuments(query);
      
      // Get billing rates
      const billingRates = await BillingRate.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'name email')
        .populate('client_id', 'name')
        .populate('case_type_id', 'name')
        .populate('activity_type_id', 'name')
        .populate('created_by', 'name')
        .populate('updated_by', 'name');
      
      res.status(200).json({
        success: true,
        count: billingRates.length,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        data: billingRates
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single billing rate
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getBillingRate: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid billing rate ID'
        });
      }
      
      // Find billing rate
      const billingRate = await BillingRate.findOne({ _id: id, tenant_id })
        .populate('user_id', 'name email')
        .populate('client_id', 'name')
        .populate('case_type_id', 'name')
        .populate('activity_type_id', 'name')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      if (!billingRate) {
        return res.status(404).json({
          success: false,
          error: 'Billing rate not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: billingRate
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update a billing rate
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateBillingRate: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const updateData = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid billing rate ID'
        });
      }
      
      // Find billing rate
      const billingRate = await BillingRate.findOne({ _id: id, tenant_id });
      
      if (!billingRate) {
        return res.status(404).json({
          success: false,
          error: 'Billing rate not found'
        });
      }
      
      // Validate dates if provided
      if (updateData.effective_date && updateData.end_date) {
        if (new Date(updateData.end_date) <= new Date(updateData.effective_date)) {
          return res.status(400).json({
            success: false,
            error: 'End date must be after effective date'
          });
        }
      } else if (updateData.effective_date && billingRate.end_date) {
        if (new Date(billingRate.end_date) <= new Date(updateData.effective_date)) {
          return res.status(400).json({
            success: false,
            error: 'End date must be after effective date'
          });
        }
      } else if (updateData.end_date && billingRate.effective_date) {
        if (new Date(updateData.end_date) <= new Date(billingRate.effective_date)) {
          return res.status(400).json({
            success: false,
            error: 'End date must be after effective date'
          });
        }
      }
      
      // Update billing rate
      updateData.updated_by = req.user._id;
      
      const updatedBillingRate = await BillingRate.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('user_id', 'name email')
        .populate('client_id', 'name')
        .populate('case_type_id', 'name')
        .populate('activity_type_id', 'name')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedBillingRate
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Delete a billing rate
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteBillingRate: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid billing rate ID'
        });
      }
      
      // Find billing rate
      const billingRate = await BillingRate.findOne({ _id: id, tenant_id });
      
      if (!billingRate) {
        return res.status(404).json({
          success: false,
          error: 'Billing rate not found'
        });
      }
      
      // Delete billing rate
      await BillingRate.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Find applicable billing rate
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  findApplicableRate: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        user_id,
        client_id,
        case_type_id,
        activity_type_id,
        date
      } = req.query;
      
      // Validate required parameters
      if (!user_id && !client_id && !case_type_id && !activity_type_id) {
        return res.status(400).json({
          success: false,
          error: 'At least one of user_id, client_id, case_type_id, or activity_type_id is required'
        });
      }
      
      // Find applicable rate
      const applicableRate = await BillingRate.findApplicableRate({
        tenantId: tenant_id,
        userId: user_id,
        clientId: client_id,
        caseTypeId: case_type_id,
        activityTypeId: activity_type_id,
        date: date ? new Date(date) : new Date()
      });
      
      if (!applicableRate) {
        return res.status(404).json({
          success: false,
          error: 'No applicable billing rate found'
        });
      }
      
      // Populate references
      await BillingRate.populate(applicableRate, [
        { path: 'user_id', select: 'name email' },
        { path: 'client_id', select: 'name' },
        { path: 'case_type_id', select: 'name' },
        { path: 'activity_type_id', select: 'name' }
      ]);
      
      res.status(200).json({
        success: true,
        data: applicableRate
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = BillingRateController;
