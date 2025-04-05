// controllers/timetracking/activity-type.controller.js

const ActivityType = require('../../models/timetracking/activity-type.model');
const TimeEntry = require('../../models/timetracking/time-entry.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');

/**
 * Activity Type Controller
 * Handles operations related to activity types
 */
const ActivityTypeController = {
  /**
   * Create a new activity type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createActivityType: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      
      // Check if activity type with same name already exists
      const existingType = await ActivityType.findOne({
        name: req.body.name,
        tenant_id
      });
      
      if (existingType) {
        return res.status(400).json({
          success: false,
          error: 'Activity type with this name already exists'
        });
      }
      
      // Create new activity type
      const activityType = new ActivityType({
        ...req.body,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await activityType.save();
      
      res.status(201).json({
        success: true,
        data: activityType
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get all activity types
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActivityTypes: async (req, res) => {
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
      
      // Get activity types
      const activityTypes = await ActivityType.find(query)
        .sort('name')
        .populate('created_by', 'name')
        .populate('updated_by', 'name');
      
      res.status(200).json({
        success: true,
        count: activityTypes.length,
        data: activityTypes
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single activity type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActivityType: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid activity type ID'
        });
      }
      
      // Find activity type
      const activityType = await ActivityType.findOne({ _id: id, tenant_id })
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      if (!activityType) {
        return res.status(404).json({
          success: false,
          error: 'Activity type not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: activityType
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update an activity type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateActivityType: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const updateData = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid activity type ID'
        });
      }
      
      // Find activity type
      const activityType = await ActivityType.findOne({ _id: id, tenant_id });
      
      if (!activityType) {
        return res.status(404).json({
          success: false,
          error: 'Activity type not found'
        });
      }
      
      // Check if name is being updated and if it already exists
      if (updateData.name && updateData.name !== activityType.name) {
        const existingType = await ActivityType.findOne({
          name: updateData.name,
          tenant_id,
          _id: { $ne: id }
        });
        
        if (existingType) {
          return res.status(400).json({
            success: false,
            error: 'Activity type with this name already exists'
          });
        }
      }
      
      // Update activity type
      updateData.updated_by = req.user._id;
      
      const updatedActivityType = await ActivityType.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedActivityType
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Delete an activity type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteActivityType: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid activity type ID'
        });
      }
      
      // Find activity type
      const activityType = await ActivityType.findOne({ _id: id, tenant_id });
      
      if (!activityType) {
        return res.status(404).json({
          success: false,
          error: 'Activity type not found'
        });
      }
      
      // Check if activity type is used in time entries
      const timeEntryCount = await TimeEntry.countDocuments({
        activity_type: id,
        tenant_id
      });
      
      if (timeEntryCount > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete activity type used in ${timeEntryCount} time entries`
        });
      }
      
      // Delete activity type
      await ActivityType.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = ActivityTypeController;
