// models/timetracking/time-entry.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Time Entry Schema
 * Represents a record of time spent on a case, task, or client
 */
const TimeEntrySchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case_id: {
    type: Schema.Types.ObjectId,
    ref: 'Case'
  },
  task_id: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client'
  },
  activity_date: {
    type: Date,
    required: true
  },
  start_time: {
    type: Date
  },
  end_time: {
    type: Date
  },
  duration_hours: {
    type: Number,
    required: true,
    min: 0
  },
  activity_type: {
    type: Schema.Types.ObjectId,
    ref: 'ActivityType',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  is_billable: {
    type: Boolean,
    default: true
  },
  billing_rate: {
    type: Number,
    min: 0
  },
  billing_status: {
    type: String,
    enum: ['unbilled', 'billed', 'paid'],
    default: 'unbilled'
  },
  invoice_id: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  tenant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

/**
 * Calculate billable amount
 * @returns {Number} Billable amount
 */
TimeEntrySchema.methods.calculateBillableAmount = function() {
  if (!this.is_billable || !this.billing_rate) {
    return 0;
  }
  return this.duration_hours * this.billing_rate;
};

/**
 * Mark time entry as billed
 * @param {ObjectId} invoiceId - Invoice ID
 * @param {ObjectId} userId - User ID making the change
 */
TimeEntrySchema.methods.markAsBilled = async function(invoiceId, userId) {
  this.billing_status = 'billed';
  this.invoice_id = invoiceId;
  this.updated_by = userId;
  await this.save();
};

/**
 * Mark time entry as paid
 * @param {ObjectId} userId - User ID making the change
 */
TimeEntrySchema.methods.markAsPaid = async function(userId) {
  this.billing_status = 'paid';
  this.updated_by = userId;
  await this.save();
};

/**
 * Get time entries for a specific case
 * @param {ObjectId} caseId - Case ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Time entries for the case
 */
TimeEntrySchema.statics.getEntriesByCase = function(caseId, tenantId) {
  return this.find({
    case_id: caseId,
    tenant_id: tenantId
  })
  .populate('user_id', 'name email')
  .populate('activity_type', 'name')
  .sort({ activity_date: -1 });
};

/**
 * Get time entries for a specific client
 * @param {ObjectId} clientId - Client ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Time entries for the client
 */
TimeEntrySchema.statics.getEntriesByClient = function(clientId, tenantId) {
  return this.find({
    client_id: clientId,
    tenant_id: tenantId
  })
  .populate('user_id', 'name email')
  .populate('case_id', 'title')
  .populate('activity_type', 'name')
  .sort({ activity_date: -1 });
};

/**
 * Get time entries for a specific user
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Time entries for the user
 */
TimeEntrySchema.statics.getEntriesByUser = function(userId, tenantId, startDate, endDate) {
  const query = {
    user_id: userId,
    tenant_id: tenantId
  };
  
  if (startDate || endDate) {
    query.activity_date = {};
    if (startDate) {
      query.activity_date.$gte = startDate;
    }
    if (endDate) {
      query.activity_date.$lte = endDate;
    }
  }
  
  return this.find(query)
    .populate('case_id', 'title')
    .populate('client_id', 'name')
    .populate('activity_type', 'name')
    .sort({ activity_date: -1 });
};

/**
 * Get unbilled time entries
 * @param {ObjectId} tenantId - Tenant ID
 * @param {ObjectId} clientId - Client ID (optional)
 * @param {ObjectId} caseId - Case ID (optional)
 * @returns {Promise<Array>} Unbilled time entries
 */
TimeEntrySchema.statics.getUnbilledEntries = function(tenantId, clientId, caseId) {
  const query = {
    tenant_id: tenantId,
    is_billable: true,
    billing_status: 'unbilled'
  };
  
  if (clientId) {
    query.client_id = clientId;
  }
  
  if (caseId) {
    query.case_id = caseId;
  }
  
  return this.find(query)
    .populate('user_id', 'name email')
    .populate('case_id', 'title')
    .populate('client_id', 'name')
    .populate('activity_type', 'name')
    .sort({ activity_date: -1 });
};

/**
 * Get summary of time entries by user
 * @param {ObjectId} tenantId - Tenant ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Summary of time entries by user
 */
TimeEntrySchema.statics.getSummaryByUser = async function(tenantId, startDate, endDate) {
  const query = {
    tenant_id: tenantId
  };
  
  if (startDate || endDate) {
    query.activity_date = {};
    if (startDate) {
      query.activity_date.$gte = startDate;
    }
    if (endDate) {
      query.activity_date.$lte = endDate;
    }
  }
  
  return this.aggregate([
    { $match: query },
    { $group: {
      _id: '$user_id',
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
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: '$user' },
    { $project: {
      _id: 1,
      user_name: '$user.name',
      user_email: '$user.email',
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
};

const TimeEntry = mongoose.model('TimeEntry', TimeEntrySchema);

module.exports = TimeEntry;
