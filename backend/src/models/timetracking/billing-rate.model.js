// models/timetracking/billing-rate.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Billing Rate Schema
 * Represents a billing rate for time entries, which can be associated with a user, client, case type, or activity type
 */
const BillingRateSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  hourly_rate: {
    type: Number,
    required: true,
    min: 0
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client'
  },
  case_type_id: {
    type: Schema.Types.ObjectId,
    ref: 'CaseType'
  },
  activity_type_id: {
    type: Schema.Types.ObjectId,
    ref: 'ActivityType'
  },
  effective_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  end_date: {
    type: Date
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
 * Check if the billing rate is active on a given date
 * @param {Date} date - Date to check
 * @returns {Boolean} Whether the billing rate is active
 */
BillingRateSchema.methods.isActiveOn = function(date) {
  const checkDate = date || new Date();
  if (checkDate < this.effective_date) {
    return false;
  }
  if (this.end_date && checkDate > this.end_date) {
    return false;
  }
  return true;
};

/**
 * Find applicable billing rate for a time entry
 * @param {Object} params - Parameters to find billing rate
 * @param {ObjectId} params.tenantId - Tenant ID
 * @param {ObjectId} params.userId - User ID
 * @param {ObjectId} params.clientId - Client ID
 * @param {ObjectId} params.caseTypeId - Case Type ID
 * @param {ObjectId} params.activityTypeId - Activity Type ID
 * @param {Date} params.date - Date for which to find the rate
 * @returns {Promise<Object>} Billing rate
 */
BillingRateSchema.statics.findApplicableRate = async function(params) {
  const { tenantId, userId, clientId, caseTypeId, activityTypeId, date } = params;
  const checkDate = date || new Date();
  
  // Build query for active rates on the given date
  const baseQuery = {
    tenant_id: tenantId,
    effective_date: { $lte: checkDate },
    $or: [
      { end_date: null },
      { end_date: { $gte: checkDate } }
    ]
  };
  
  // Try to find the most specific rate first (user + client + case type + activity type)
  if (userId && clientId && caseTypeId && activityTypeId) {
    const specificRate = await this.findOne({
      ...baseQuery,
      user_id: userId,
      client_id: clientId,
      case_type_id: caseTypeId,
      activity_type_id: activityTypeId
    }).sort({ effective_date: -1 });
    
    if (specificRate) return specificRate;
  }
  
  // Try user + client + case type
  if (userId && clientId && caseTypeId) {
    const userClientCaseRate = await this.findOne({
      ...baseQuery,
      user_id: userId,
      client_id: clientId,
      case_type_id: caseTypeId,
      activity_type_id: null
    }).sort({ effective_date: -1 });
    
    if (userClientCaseRate) return userClientCaseRate;
  }
  
  // Try user + client + activity type
  if (userId && clientId && activityTypeId) {
    const userClientActivityRate = await this.findOne({
      ...baseQuery,
      user_id: userId,
      client_id: clientId,
      case_type_id: null,
      activity_type_id: activityTypeId
    }).sort({ effective_date: -1 });
    
    if (userClientActivityRate) return userClientActivityRate;
  }
  
  // Try user + client
  if (userId && clientId) {
    const userClientRate = await this.findOne({
      ...baseQuery,
      user_id: userId,
      client_id: clientId,
      case_type_id: null,
      activity_type_id: null
    }).sort({ effective_date: -1 });
    
    if (userClientRate) return userClientRate;
  }
  
  // Try user + case type
  if (userId && caseTypeId) {
    const userCaseRate = await this.findOne({
      ...baseQuery,
      user_id: userId,
      client_id: null,
      case_type_id: caseTypeId,
      activity_type_id: null
    }).sort({ effective_date: -1 });
    
    if (userCaseRate) return userCaseRate;
  }
  
  // Try user + activity type
  if (userId && activityTypeId) {
    const userActivityRate = await this.findOne({
      ...baseQuery,
      user_id: userId,
      client_id: null,
      case_type_id: null,
      activity_type_id: activityTypeId
    }).sort({ effective_date: -1 });
    
    if (userActivityRate) return userActivityRate;
  }
  
  // Try user only
  if (userId) {
    const userRate = await this.findOne({
      ...baseQuery,
      user_id: userId,
      client_id: null,
      case_type_id: null,
      activity_type_id: null
    }).sort({ effective_date: -1 });
    
    if (userRate) return userRate;
  }
  
  // Try client + case type
  if (clientId && caseTypeId) {
    const clientCaseRate = await this.findOne({
      ...baseQuery,
      user_id: null,
      client_id: clientId,
      case_type_id: caseTypeId,
      activity_type_id: null
    }).sort({ effective_date: -1 });
    
    if (clientCaseRate) return clientCaseRate;
  }
  
  // Try client + activity type
  if (clientId && activityTypeId) {
    const clientActivityRate = await this.findOne({
      ...baseQuery,
      user_id: null,
      client_id: clientId,
      case_type_id: null,
      activity_type_id: activityTypeId
    }).sort({ effective_date: -1 });
    
    if (clientActivityRate) return clientActivityRate;
  }
  
  // Try client only
  if (clientId) {
    const clientRate = await this.findOne({
      ...baseQuery,
      user_id: null,
      client_id: clientId,
      case_type_id: null,
      activity_type_id: null
    }).sort({ effective_date: -1 });
    
    if (clientRate) return clientRate;
  }
  
  // Try case type only
  if (caseTypeId) {
    const caseTypeRate = await this.findOne({
      ...baseQuery,
      user_id: null,
      client_id: null,
      case_type_id: caseTypeId,
      activity_type_id: null
    }).sort({ effective_date: -1 });
    
    if (caseTypeRate) return caseTypeRate;
  }
  
  // Try activity type only
  if (activityTypeId) {
    const activityTypeRate = await this.findOne({
      ...baseQuery,
      user_id: null,
      client_id: null,
      case_type_id: null,
      activity_type_id: activityTypeId
    }).sort({ effective_date: -1 });
    
    if (activityTypeRate) return activityTypeRate;
  }
  
  // Finally, try to find a default rate
  const defaultRate = await this.findOne({
    ...baseQuery,
    user_id: null,
    client_id: null,
    case_type_id: null,
    activity_type_id: null
  }).sort({ effective_date: -1 });
  
  return defaultRate;
};

const BillingRate = mongoose.model('BillingRate', BillingRateSchema);

module.exports = BillingRate;
