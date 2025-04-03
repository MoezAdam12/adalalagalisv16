// controllers/timetracking/time-target.controller.js

const TimeTarget = require('../../models/timetracking/time-target.model');
const TimeEntry = require('../../models/timetracking/time-entry.model');
const User = require('../../models/user.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');

/**
 * Time Target Controller
 * Handles operations related to time targets
 */
const TimeTargetController = {
  /**
   * Create a new time target
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createTimeTarget: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const timeTargetData = req.body;
      
      // Validate user
      if (!validateObjectId(timeTargetData.user_id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }
      
      const userExists = await User.findOne({
        _id: timeTargetData.user_id,
        tenant_id
      });
      
      if (!userExists) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Validate dates
      const startDate = new Date(timeTargetData.start_date);
      const endDate = new Date(timeTargetData.end_date);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }
      
      // Check for overlapping targets
      const overlappingTarget = await TimeTarget.findOne({
        user_id: timeTargetData.user_id,
        tenant_id,
        $or: [
          {
            start_date: { $lte: startDate },
            end_date: { $gte: startDate }
          },
          {
            start_date: { $lte: endDate },
            end_date: { $gte: endDate }
          },
          {
            start_date: { $gte: startDate },
            end_date: { $lte: endDate }
          }
        ]
      });
      
      if (overlappingTarget) {
        return res.status(400).json({
          success: false,
          error: 'Time target overlaps with an existing target for this user'
        });
      }
      
      // Create new time target
      const timeTarget = new TimeTarget({
        ...timeTargetData,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await timeTarget.save();
      
      // Populate references
      await TimeTarget.populate(timeTarget, [
        { path: 'user_id', select: 'name email' },
        { path: 'created_by', select: 'name' },
        { path: 'updated_by', select: 'name' }
      ]);
      
      res.status(201).json({
        success: true,
        data: timeTarget
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Create monthly targets for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createMonthlyTargets: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        user_id,
        billable_target,
        non_billable_target,
        start_month,
        months
      } = req.body;
      
      // Validate user
      if (!validateObjectId(user_id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }
      
      const userExists = await User.findOne({
        _id: user_id,
        tenant_id
      });
      
      if (!userExists) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Validate billable target
      if (!billable_target || billable_target <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Billable target must be greater than zero'
        });
      }
      
      // Create monthly targets
      const targets = await TimeTarget.createMonthlyTargets({
        userId: user_id,
        tenantId: tenant_id,
        billableTarget: billable_target,
        nonBillableTarget: non_billable_target || 0,
        startMonth: start_month ? new Date(start_month) : new Date(),
        months: months || 1,
        createdBy: req.user._id
      });
      
      // Populate references
      await TimeTarget.populate(targets, [
        { path: 'user_id', select: 'name email' },
        { path: 'created_by', select: 'name' },
        { path: 'updated_by', select: 'name' }
      ]);
      
      res.status(201).json({
        success: true,
        count: targets.length,
        data: targets
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get all time targets
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTimeTargets: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        user_id,
        period,
        is_active,
        start_date,
        end_date,
        page = 1,
        limit = 10,
        sort_by = 'start_date',
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
      
      // Filter by period if provided
      if (period) {
        query.period = period;
      }
      
      // Filter by active status if provided
      if (is_active === 'true') {
        const currentDate = new Date();
        query.start_date = { $lte: currentDate };
        query.end_date = { $gte: currentDate };
      } else if (is_active === 'false') {
        const currentDate = new Date();
        query.$or = [
          { start_date: { $gt: currentDate } },
          { end_date: { $lt: currentDate } }
        ];
      }
      
      // Filter by date range if provided
      if (start_date || end_date) {
        if (start_date) {
          query.end_date = { $gte: new Date(start_date) };
        }
        if (end_date) {
          query.start_date = { $lte: new Date(end_date) };
        }
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await TimeTarget.countDocuments(query);
      
      // Get time targets
      const timeTargets = await TimeTarget.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'name email')
        .populate('created_by', 'name')
        .populate('updated_by', 'name');
      
      res.status(200).json({
        success: true,
        count: timeTargets.length,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        data: timeTargets
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single time target
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTimeTarget: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time target ID'
        });
      }
      
      // Find time target
      const timeTarget = await TimeTarget.findOne({ _id: id, tenant_id })
        .populate('user_id', 'name email')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      if (!timeTarget) {
        return res.status(404).json({
          success: false,
          error: 'Time target not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: timeTarget
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update a time target
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateTimeTarget: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const updateData = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time target ID'
        });
      }
      
      // Find time target
      const timeTarget = await TimeTarget.findOne({ _id: id, tenant_id });
      
      if (!timeTarget) {
        return res.status(404).json({
          success: false,
          error: 'Time target not found'
        });
      }
      
      // Validate dates if provided
      if (updateData.start_date || updateData.end_date) {
        const startDate = updateData.start_date ? 
          new Date(updateData.start_date) : timeTarget.start_date;
        const endDate = updateData.end_date ? 
          new Date(updateData.end_date) : timeTarget.end_date;
        
        if (endDate <= startDate) {
          return res.status(400).json({
            success: false,
            error: 'End date must be after start date'
          });
        }
        
        // Check for overlapping targets
        const overlappingTarget = await TimeTarget.findOne({
          _id: { $ne: id },
          user_id: timeTarget.user_id,
          tenant_id,
          $or: [
            {
              start_date: { $lte: startDate },
              end_date: { $gte: startDate }
            },
            {
              start_date: { $lte: endDate },
              end_date: { $gte: endDate }
            },
            {
              start_date: { $gte: startDate },
              end_date: { $lte: endDate }
            }
          ]
        });
        
        if (overlappingTarget) {
          return res.status(400).json({
            success: false,
            error: 'Time target overlaps with an existing target for this user'
          });
        }
      }
      
      // Update time target
      updateData.updated_by = req.user._id;
      
      const updatedTimeTarget = await TimeTarget.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('user_id', 'name email')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedTimeTarget
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Delete a time target
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteTimeTarget: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time target ID'
        });
      }
      
      // Find time target
      const timeTarget = await TimeTarget.findOne({ _id: id, tenant_id });
      
      if (!timeTarget) {
        return res.status(404).json({
          success: false,
          error: 'Time target not found'
        });
      }
      
      // Delete time target
      await TimeTarget.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get time target progress
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTimeTargetProgress: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time target ID'
        });
      }
      
      // Find time target
      const timeTarget = await TimeTarget.findOne({ _id: id, tenant_id })
        .populate('user_id', 'name email');
      
      if (!timeTarget) {
        return res.status(404).json({
          success: false,
          error: 'Time target not found'
        });
      }
      
      // Get time entries for the target period
      const timeEntries = await TimeEntry.aggregate([
        {
          $match: {
            tenant_id: mongoose.Types.ObjectId(tenant_id),
            user_id: mongoose.Types.ObjectId(timeTarget.user_id),
            activity_date: {
              $gte: timeTarget.start_date,
              $lte: timeTarget.end_date
            }
          }
        },
        {
          $group: {
            _id: null,
            total_hours: { $sum: '$duration_hours' },
            billable_hours: { 
              $sum: { 
                $cond: [
                  { $eq: ['$is_billable', true] },
                  '$duration_hours',
                  0
                ]
              }
            },
            non_billable_hours: { 
              $sum: { 
                $cond: [
                  { $eq: ['$is_billable', false] },
                  '$duration_hours',
                  0
                ]
              }
            },
            entry_count: { $sum: 1 }
          }
        }
      ]);
      
      // Calculate progress
      const timeEntriesSummary = timeEntries.length > 0 ? timeEntries[0] : null;
      const progress = timeTarget.calculateProgress(timeEntriesSummary);
      
      res.status(200).json({
        success: true,
        data: {
          time_target: timeTarget,
          progress
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get active time target for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActiveTimeTarget: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { user_id, date } = req.query;
      
      // Validate user ID
      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      if (!validateObjectId(user_id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }
      
      // Get active time target
      const activeTarget = await TimeTarget.getActiveTarget(
        user_id,
        tenant_id,
        date ? new Date(date) : new Date()
      );
      
      if (!activeTarget) {
        return res.status(404).json({
          success: false,
          error: 'No active time target found for this user'
        });
      }
      
      // Populate references
      await TimeTarget.populate(activeTarget, [
        { path: 'user_id', select: 'name email' },
        { path: 'created_by', select: 'name' },
        { path: 'updated_by', select: 'name' }
      ]);
      
      // Get time entries for the target period
      const timeEntries = await TimeEntry.aggregate([
        {
          $match: {
            tenant_id: mongoose.Types.ObjectId(tenant_id),
            user_id: mongoose.Types.ObjectId(user_id),
            activity_date: {
              $gte: activeTarget.start_date,
              $lte: activeTarget.end_date
            }
          }
        },
        {
          $group: {
            _id: null,
            total_hours: { $sum: '$duration_hours' },
            billable_hours: { 
              $sum: { 
                $cond: [
                  { $eq: ['$is_billable', true] },
                  '$duration_hours',
                  0
                ]
              }
            },
            non_billable_hours: { 
              $sum: { 
                $cond: [
                  { $eq: ['$is_billable', false] },
                  '$duration_hours',
                  0
                ]
              }
            },
            entry_count: { $sum: 1 }
          }
        }
      ]);
      
      // Calculate progress
      const timeEntriesSummary = timeEntries.length > 0 ? timeEntries[0] : null;
      const progress = activeTarget.calculateProgress(timeEntriesSummary);
      
      res.status(200).json({
        success: true,
        data: {
          time_target: activeTarget,
          progress
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = TimeTargetController;
