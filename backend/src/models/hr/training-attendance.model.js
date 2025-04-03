// models/hr/training-attendance.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Training Attendance Schema
 * Represents an employee's attendance at a training program
 */
const TrainingAttendanceSchema = new Schema({
  training_id: {
    type: Schema.Types.ObjectId,
    ref: 'Training',
    required: true
  },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  attendance_status: {
    type: String,
    enum: ['registered', 'attended', 'absent', 'cancelled'],
    default: 'registered'
  },
  registration_date: {
    type: Date,
    default: Date.now
  },
  evaluation_result: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    completed_date: Date
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issue_date: Date,
    file_path: String
  },
  comments: {
    type: String
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

// Ensure an employee is registered only once for a training
TrainingAttendanceSchema.index({ training_id: 1, employee_id: 1 }, { unique: true });

/**
 * Get attendance by training
 * @param {ObjectId} trainingId - Training ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Attendance records for the specified training
 */
TrainingAttendanceSchema.statics.getAttendanceByTraining = function(trainingId, tenantId) {
  return this.find({
    training_id: trainingId,
    tenant_id: tenantId
  }).populate('employee_id', 'first_name last_name email job_title department')
    .sort('employee_id.last_name employee_id.first_name');
};

/**
 * Get attendance by employee
 * @param {ObjectId} employeeId - Employee ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Array>} Attendance records for the specified employee
 */
TrainingAttendanceSchema.statics.getAttendanceByEmployee = function(employeeId, tenantId) {
  return this.find({
    employee_id: employeeId,
    tenant_id: tenantId
  }).populate('training_id', 'title type start_date end_date status')
    .sort('-training_id.start_date');
};

/**
 * Get attendance by status
 * @param {ObjectId} tenantId - Tenant ID
 * @param {String} status - Attendance status
 * @returns {Promise<Array>} Attendance records with the specified status
 */
TrainingAttendanceSchema.statics.getAttendanceByStatus = function(tenantId, status) {
  return this.find({
    tenant_id: tenantId,
    attendance_status: status
  }).populate('employee_id', 'first_name last_name email job_title department')
    .populate('training_id', 'title type start_date end_date status')
    .sort('-training_id.start_date');
};

/**
 * Get attendance count by training
 * @param {ObjectId} trainingId - Training ID
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Promise<Object>} Attendance count by status
 */
TrainingAttendanceSchema.statics.getAttendanceCountByTraining = async function(trainingId, tenantId) {
  const result = await this.aggregate([
    {
      $match: {
        training_id: mongoose.Types.ObjectId(trainingId),
        tenant_id: mongoose.Types.ObjectId(tenantId)
      }
    },
    {
      $group: {
        _id: '$attendance_status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Convert array to object
  const countByStatus = {};
  result.forEach(item => {
    countByStatus[item._id] = item.count;
  });
  
  return countByStatus;
};

/**
 * Register employees for training
 * @param {Object} params - Parameters
 * @param {ObjectId} params.trainingId - Training ID
 * @param {Array<ObjectId>} params.employeeIds - Employee IDs
 * @param {ObjectId} params.tenantId - Tenant ID
 * @param {ObjectId} params.createdBy - User ID of creator
 * @returns {Promise<Array>} Created attendance records
 */
TrainingAttendanceSchema.statics.registerEmployeesForTraining = async function(params) {
  const { trainingId, employeeIds, tenantId, createdBy } = params;
  
  const attendanceRecords = [];
  
  for (const employeeId of employeeIds) {
    // Check if attendance record already exists
    const existingRecord = await this.findOne({
      training_id: trainingId,
      employee_id: employeeId,
      tenant_id: tenantId
    });
    
    if (!existingRecord) {
      // Create new attendance record
      const attendanceRecord = new this({
        training_id: trainingId,
        employee_id: employeeId,
        attendance_status: 'registered',
        registration_date: new Date(),
        tenant_id: tenantId,
        created_by: createdBy,
        updated_by: createdBy
      });
      
      await attendanceRecord.save();
      attendanceRecords.push(attendanceRecord);
    }
  }
  
  return attendanceRecords;
};

const TrainingAttendance = mongoose.model('TrainingAttendance', TrainingAttendanceSchema);

module.exports = TrainingAttendance;
