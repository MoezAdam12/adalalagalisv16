// controllers/timetracking/time-entry.controller.js

const TimeEntry = require('../../models/timetracking/time-entry.model');
const ActivityType = require('../../models/timetracking/activity-type.model');
const BillingRate = require('../../models/timetracking/billing-rate.model');
const Case = require('../../models/case.model');
const Client = require('../../models/client.model');
const Task = require('../../models/task.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');
const mongoose = require('mongoose');

/**
 * Time Entry Controller
 * Handles operations related to time entries
 */
const TimeEntryController = {
  /**
   * Create a new time entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createTimeEntry: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const timeEntryData = req.body;
      
      // Validate activity type
      if (!validateObjectId(timeEntryData.activity_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid activity type ID'
        });
      }
      
      const activityType = await ActivityType.findOne({
        _id: timeEntryData.activity_type,
        tenant_id
      });
      
      if (!activityType) {
        return res.status(404).json({
          success: false,
          error: 'Activity type not found'
        });
      }
      
      // Validate case if provided
      if (timeEntryData.case_id) {
        if (!validateObjectId(timeEntryData.case_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid case ID'
          });
        }
        
        const caseExists = await Case.findOne({
          _id: timeEntryData.case_id,
          tenant_id
        });
        
        if (!caseExists) {
          return res.status(404).json({
            success: false,
            error: 'Case not found'
          });
        }
        
        // If case is provided but client is not, get client from case
        if (!timeEntryData.client_id) {
          timeEntryData.client_id = caseExists.client_id;
        }
      }
      
      // Validate client if provided
      if (timeEntryData.client_id) {
        if (!validateObjectId(timeEntryData.client_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid client ID'
          });
        }
        
        const clientExists = await Client.findOne({
          _id: timeEntryData.client_id,
          tenant_id
        });
        
        if (!clientExists) {
          return res.status(404).json({
            success: false,
            error: 'Client not found'
          });
        }
      }
      
      // Validate task if provided
      if (timeEntryData.task_id) {
        if (!validateObjectId(timeEntryData.task_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid task ID'
          });
        }
        
        const taskExists = await Task.findOne({
          _id: timeEntryData.task_id,
          tenant_id
        });
        
        if (!taskExists) {
          return res.status(404).json({
            success: false,
            error: 'Task not found'
          });
        }
      }
      
      // Set is_billable from activity type if not provided
      if (timeEntryData.is_billable === undefined) {
        timeEntryData.is_billable = activityType.default_billable;
      }
      
      // Calculate duration if start_time and end_time are provided
      if (timeEntryData.start_time && timeEntryData.end_time) {
        const startTime = new Date(timeEntryData.start_time);
        const endTime = new Date(timeEntryData.end_time);
        
        if (endTime <= startTime) {
          return res.status(400).json({
            success: false,
            error: 'End time must be after start time'
          });
        }
        
        // Calculate duration in hours
        const durationMs = endTime - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);
        
        // Round to 2 decimal places
        timeEntryData.duration_hours = Math.round(durationHours * 100) / 100;
      }
      
      // Ensure duration is provided
      if (!timeEntryData.duration_hours) {
        return res.status(400).json({
          success: false,
          error: 'Duration is required'
        });
      }
      
      // If billable, determine billing rate
      if (timeEntryData.is_billable) {
        // If billing rate is not provided, find applicable rate
        if (!timeEntryData.billing_rate) {
          const caseData = timeEntryData.case_id ? 
            await Case.findById(timeEntryData.case_id) : null;
          
          const applicableRate = await BillingRate.findApplicableRate({
            tenantId: tenant_id,
            userId: req.user._id,
            clientId: timeEntryData.client_id,
            caseTypeId: caseData ? caseData.case_type : null,
            activityTypeId: timeEntryData.activity_type,
            date: timeEntryData.activity_date
          });
          
          if (applicableRate) {
            timeEntryData.billing_rate = applicableRate.hourly_rate;
          } else if (activityType.default_rate) {
            timeEntryData.billing_rate = activityType.default_rate;
          } else {
            // If no rate is found, set a default rate or make it non-billable
            timeEntryData.is_billable = false;
          }
        }
      }
      
      // Create time entry
      const timeEntry = new TimeEntry({
        ...timeEntryData,
        user_id: req.user._id,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await timeEntry.save();
      
      // Populate references
      await TimeEntry.populate(timeEntry, [
        { path: 'activity_type', select: 'name' },
        { path: 'case_id', select: 'title' },
        { path: 'client_id', select: 'name' },
        { path: 'task_id', select: 'title' }
      ]);
      
      res.status(201).json({
        success: true,
        data: timeEntry
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get all time entries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTimeEntries: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        user_id,
        case_id,
        client_id,
        task_id,
        activity_type,
        is_billable,
        billing_status,
        start_date,
        end_date,
        search,
        page = 1,
        limit = 10,
        sort_by = 'activity_date',
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
      
      // Filter by case if provided
      if (case_id) {
        if (!validateObjectId(case_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid case ID'
          });
        }
        query.case_id = case_id;
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
      
      // Filter by task if provided
      if (task_id) {
        if (!validateObjectId(task_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid task ID'
          });
        }
        query.task_id = task_id;
      }
      
      // Filter by activity type if provided
      if (activity_type) {
        if (!validateObjectId(activity_type)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid activity type ID'
          });
        }
        query.activity_type = activity_type;
      }
      
      // Filter by billable status if provided
      if (is_billable !== undefined) {
        query.is_billable = is_billable === 'true';
      }
      
      // Filter by billing status if provided
      if (billing_status) {
        query.billing_status = billing_status;
      }
      
      // Filter by date range if provided
      if (start_date || end_date) {
        query.activity_date = {};
        if (start_date) {
          query.activity_date.$gte = new Date(start_date);
        }
        if (end_date) {
          query.activity_date.$lte = new Date(end_date);
        }
      }
      
      // Search by description if provided
      if (search) {
        query.description = { $regex: search, $options: 'i' };
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await TimeEntry.countDocuments(query);
      
      // Get time entries
      const timeEntries = await TimeEntry.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user_id', 'name email')
        .populate('activity_type', 'name')
        .populate('case_id', 'title')
        .populate('client_id', 'name')
        .populate('task_id', 'title');
      
      res.status(200).json({
        success: true,
        count: timeEntries.length,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        data: timeEntries
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single time entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTimeEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time entry ID'
        });
      }
      
      // Find time entry
      const timeEntry = await TimeEntry.findOne({ _id: id, tenant_id })
        .populate('user_id', 'name email')
        .populate('activity_type', 'name')
        .populate('case_id', 'title')
        .populate('client_id', 'name')
        .populate('task_id', 'title')
        .populate('invoice_id', 'invoice_number');
      
      if (!timeEntry) {
        return res.status(404).json({
          success: false,
          error: 'Time entry not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: timeEntry
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update a time entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateTimeEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const updateData = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time entry ID'
        });
      }
      
      // Find time entry
      const timeEntry = await TimeEntry.findOne({ _id: id, tenant_id });
      
      if (!timeEntry) {
        return res.status(404).json({
          success: false,
          error: 'Time entry not found'
        });
      }
      
      // Check if time entry is already billed
      if (timeEntry.billing_status !== 'unbilled' && (
        updateData.duration_hours !== undefined ||
        updateData.is_billable !== undefined ||
        updateData.billing_rate !== undefined
      )) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update billable information for a billed time entry'
        });
      }
      
      // Validate activity type if provided
      if (updateData.activity_type) {
        if (!validateObjectId(updateData.activity_type)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid activity type ID'
          });
        }
        
        const activityType = await ActivityType.findOne({
          _id: updateData.activity_type,
          tenant_id
        });
        
        if (!activityType) {
          return res.status(404).json({
            success: false,
            error: 'Activity type not found'
          });
        }
      }
      
      // Validate case if provided
      if (updateData.case_id) {
        if (!validateObjectId(updateData.case_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid case ID'
          });
        }
        
        const caseExists = await Case.findOne({
          _id: updateData.case_id,
          tenant_id
        });
        
        if (!caseExists) {
          return res.status(404).json({
            success: false,
            error: 'Case not found'
          });
        }
      }
      
      // Validate client if provided
      if (updateData.client_id) {
        if (!validateObjectId(updateData.client_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid client ID'
          });
        }
        
        const clientExists = await Client.findOne({
          _id: updateData.client_id,
          tenant_id
        });
        
        if (!clientExists) {
          return res.status(404).json({
            success: false,
            error: 'Client not found'
          });
        }
      }
      
      // Validate task if provided
      if (updateData.task_id) {
        if (!validateObjectId(updateData.task_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid task ID'
          });
        }
        
        const taskExists = await Task.findOne({
          _id: updateData.task_id,
          tenant_id
        });
        
        if (!taskExists) {
          return res.status(404).json({
            success: false,
            error: 'Task not found'
          });
        }
      }
      
      // Calculate duration if start_time and end_time are provided
      if (updateData.start_time && updateData.end_time) {
        const startTime = new Date(updateData.start_time);
        const endTime = new Date(updateData.end_time);
        
        if (endTime <= startTime) {
          return res.status(400).json({
            success: false,
            error: 'End time must be after start time'
          });
        }
        
        // Calculate duration in hours
        const durationMs = endTime - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);
        
        // Round to 2 decimal places
        updateData.duration_hours = Math.round(durationHours * 100) / 100;
      }
      
      // Update time entry
      updateData.updated_by = req.user._id;
      
      const updatedTimeEntry = await TimeEntry.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('user_id', 'name email')
        .populate('activity_type', 'name')
        .populate('case_id', 'title')
        .populate('client_id', 'name')
        .populate('task_id', 'title')
        .populate('invoice_id', 'invoice_number');
      
      res.status(200).json({
        success: true,
        data: updatedTimeEntry
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Delete a time entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteTimeEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time entry ID'
        });
      }
      
      // Find time entry
      const timeEntry = await TimeEntry.findOne({ _id: id, tenant_id });
      
      if (!timeEntry) {
        return res.status(404).json({
          success: false,
          error: 'Time entry not found'
        });
      }
      
      // Check if time entry is already billed
      if (timeEntry.billing_status !== 'unbilled') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete a billed time entry'
        });
      }
      
      // Delete time entry
      await TimeEntry.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get time entries summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTimeEntriesSummary: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        user_id,
        case_id,
        client_id,
        start_date,
        end_date,
        group_by = 'user'
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
      
      // Filter by case if provided
      if (case_id) {
        if (!validateObjectId(case_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid case ID'
          });
        }
        query.case_id = case_id;
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
      
      // Filter by date range if provided
      if (start_date || end_date) {
        query.activity_date = {};
        if (start_date) {
          query.activity_date.$gte = new Date(start_date);
        }
        if (end_date) {
          query.activity_date.$lte = new Date(end_date);
        }
      }
      
      // Determine group by field
      let groupByField;
      let lookupCollection;
      let lookupLocalField;
      let lookupForeignField;
      let nameField;
      
      switch (group_by) {
        case 'user':
          groupByField = '$user_id';
          lookupCollection = 'users';
          lookupLocalField = '_id';
          lookupForeignField = '_id';
          nameField = 'name';
          break;
        case 'case':
          groupByField = '$case_id';
          lookupCollection = 'cases';
          lookupLocalField = '_id';
          lookupForeignField = '_id';
          nameField = 'title';
          break;
        case 'client':
          groupByField = '$client_id';
          lookupCollection = 'clients';
          lookupLocalField = '_id';
          lookupForeignField = '_id';
          nameField = 'name';
          break;
        case 'activity_type':
          groupByField = '$activity_type';
          lookupCollection = 'activitytypes';
          lookupLocalField = '_id';
          lookupForeignField = '_id';
          nameField = 'name';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid group_by parameter'
          });
      }
      
      // Get summary
      const summary = await TimeEntry.aggregate([
        { $match: query },
        { $group: {
          _id: groupByField,
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
          billable_amount: {
            $sum: {
              $cond: [
                { $eq: ['$is_billable', true] },
                { $multiply: ['$duration_hours', '$billing_rate'] },
                0
              ]
            }
          },
          entry_count: { $sum: 1 }
        }},
        { $lookup: {
          from: lookupCollection,
          localField: '_id',
          foreignField: lookupForeignField,
          as: 'entity'
        }},
        { $unwind: {
          path: '$entity',
          preserveNullAndEmptyArrays: true
        }},
        { $project: {
          _id: 1,
          entity_name: { $ifNull: ['$entity.' + nameField, 'Unknown'] },
          total_hours: 1,
          billable_hours: 1,
          non_billable_hours: 1,
          billable_amount: 1,
          entry_count: 1,
          utilization_rate: {
            $cond: [
              { $eq: ['$total_hours', 0] },
              0,
              { $divide: ['$billable_hours', '$total_hours'] }
            ]
          }
        }},
        { $sort: { billable_hours: -1 } }
      ]);
      
      // Calculate totals
      const totals = {
        total_hours: 0,
        billable_hours: 0,
        non_billable_hours: 0,
        billable_amount: 0,
        entry_count: 0
      };
      
      summary.forEach(item => {
        totals.total_hours += item.total_hours;
        totals.billable_hours += item.billable_hours;
        totals.non_billable_hours += item.non_billable_hours;
        totals.billable_amount += item.billable_amount;
        totals.entry_count += item.entry_count;
      });
      
      totals.utilization_rate = totals.total_hours > 0 ? 
        totals.billable_hours / totals.total_hours : 0;
      
      res.status(200).json({
        success: true,
        data: {
          summary,
          totals
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = TimeEntryController;
