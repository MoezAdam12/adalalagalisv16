const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');

/**
 * AuditLog controller for managing audit logs
 */
class AuditLogController {
  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'DESC',
        start_date,
        end_date,
        user_id,
        action,
        entity_type,
        entity_id,
        status,
        severity,
        search
      } = req.query;
      
      // Build where clause
      const whereClause = {
        tenant_id: tenantId
      };
      
      // Date range filter
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = new Date(end_date);
        }
      }
      
      // Other filters
      if (user_id) {
        whereClause.user_id = user_id;
      }
      
      if (action) {
        whereClause.action = action;
      }
      
      if (entity_type) {
        whereClause.entity_type = entity_type;
      }
      
      if (entity_id) {
        whereClause.entity_id = entity_id;
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      if (severity) {
        whereClause.severity = severity;
      }
      
      // Search in description
      if (search) {
        whereClause.description = {
          [Op.iLike]: `%${search}%`
        };
      }
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Get audit logs
      const { count, rows } = await AuditLog.findAndCountAll({
        where: whereClause,
        order: [[sort_by, sort_order]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // Calculate total pages
      const totalPages = Math.ceil(count / limit);
      
      // Log this audit log view (meta-logging)
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'AUDIT_LOGS',
        description: 'Viewed audit logs',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        metadata: {
          filters: req.query
        }
      });
      
      return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: totalPages
        }
      });
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get audit logs',
        error: error.message
      });
    }
  }
  
  /**
   * Get audit log by ID
   */
  async getAuditLogById(req, res) {
    try {
      const tenantId = req.tenantId;
      const logId = req.params.id;
      
      const auditLog = await AuditLog.findOne({
        where: {
          id: logId,
          tenant_id: tenantId
        }
      });
      
      if (!auditLog) {
        return res.status(404).json({
          success: false,
          message: 'Audit log not found'
        });
      }
      
      // Log this audit log view (meta-logging)
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'AUDIT_LOG',
        entity_id: auditLog.id,
        description: `Viewed audit log: ${auditLog.id}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: auditLog
      });
    } catch (error) {
      console.error('Error getting audit log:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get audit log',
        error: error.message
      });
    }
  }
  
  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        start_date,
        end_date,
        user_id,
        action,
        entity_type,
        entity_id,
        status,
        severity
      } = req.query;
      
      // Build where clause
      const whereClause = {
        tenant_id: tenantId
      };
      
      // Date range filter
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = new Date(end_date);
        }
      }
      
      // Other filters
      if (user_id) {
        whereClause.user_id = user_id;
      }
      
      if (action) {
        whereClause.action = action;
      }
      
      if (entity_type) {
        whereClause.entity_type = entity_type;
      }
      
      if (entity_id) {
        whereClause.entity_id = entity_id;
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      if (severity) {
        whereClause.severity = severity;
      }
      
      // Get audit logs
      const auditLogs = await AuditLog.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        raw: true
      });
      
      // Generate CSV content
      let csvContent = 'ID,Timestamp,User ID,Action,Entity Type,Entity ID,Description,IP Address,Status,Severity\n';
      
      auditLogs.forEach(log => {
        // Escape fields that might contain commas
        const description = log.description ? `"${log.description.replace(/"/g, '""')}"` : '';
        
        csvContent += `${log.id},${log.created_at},${log.user_id || ''},${log.action},${log.entity_type},${log.entity_id || ''},${description},${log.ip_address || ''},${log.status},${log.severity}\n`;
      });
      
      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Log this export action
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'EXPORT',
        entity_type: 'AUDIT_LOGS',
        description: 'Exported audit logs to CSV',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        metadata: {
          filters: req.query,
          record_count: auditLogs.length
        }
      });
      
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: error.message
      });
    }
  }
  
  /**
   * Get audit log statistics
   */
  async getAuditLogStats(req, res) {
    try {
      const tenantId = req.tenantId;
      const { start_date, end_date } = req.query;
      
      // Build where clause for date range
      const whereClause = {
        tenant_id: tenantId
      };
      
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = new Date(end_date);
        }
      }
      
      // Get total count
      const totalCount = await AuditLog.count({
        where: whereClause
      });
      
      // Get counts by action
      const actionCounts = await AuditLog.findAll({
        attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: whereClause,
        group: ['action'],
        raw: true
      });
      
      // Get counts by entity type
      const entityTypeCounts = await AuditLog.findAll({
        attributes: ['entity_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: whereClause,
        group: ['entity_type'],
        raw: true
      });
      
      // Get counts by status
      const statusCounts = await AuditLog.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: whereClause,
        group: ['status'],
        raw: true
      });
      
      // Get counts by severity
      const severityCounts = await AuditLog.findAll({
        attributes: ['severity', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: whereClause,
        group: ['severity'],
        raw: true
      });
      
      // Get counts by day
      const dailyCounts = await AuditLog.findAll({
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: whereClause,
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']],
        raw: true
      });
      
      // Log this stats view
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'AUDIT_LOG_STATS',
        description: 'Viewed audit log statistics',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        metadata: {
          filters: req.query
        }
      });
      
      return res.status(200).json({
        success: true,
        data: {
          total_count: totalCount,
          action_counts: actionCounts,
          entity_type_counts: entityTypeCounts,
          status_counts: statusCounts,
          severity_counts: severityCounts,
          daily_counts: dailyCounts
        }
      });
    } catch (error) {
      console.error('Error getting audit log stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get audit log statistics',
        error: error.message
      });
    }
  }
  
  /**
   * Create a manual audit log entry
   */
  async createAuditLog(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        user_id,
        action,
        entity_type,
        entity_id,
        description,
        old_values,
        new_values,
        metadata,
        status,
        severity
      } = req.body;
      
      // Validate required fields
      if (!action || !entity_type || !description) {
        return res.status(400).json({
          success: false,
          message: 'Action, entity type, and description are required'
        });
      }
      
      // Create audit log
      const auditLog = await AuditLog.create({
        tenant_id: tenantId,
        user_id: user_id || req.userId,
        action,
        entity_type,
        entity_id,
        description,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values,
        new_values,
        metadata,
        status: status || 'SUCCESS',
        severity: severity || 'LOW'
      });
      
      // Log this creation (meta-logging)
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'AUDIT_LOG',
        entity_id: auditLog.id,
        description: 'Created manual audit log entry',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(201).json({
        success: true,
        message: 'Audit log created successfully',
        data: auditLog
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create audit log',
        error: error.message
      });
    }
  }
  
  /**
   * Get available audit log actions
   */
  async getAuditLogActions(req, res) {
    try {
      const actions = [
        { value: 'CREATE', label: 'إنشاء' },
        { value: 'READ', label: 'قراءة' },
        { value: 'UPDATE', label: 'تحديث' },
        { value: 'DELETE', label: 'حذف' },
        { value: 'LOGIN', label: 'تسجيل دخول' },
        { value: 'LOGOUT', label: 'تسجيل خروج' },
        { value: 'EXPORT', label: 'تصدير' },
        { value: 'IMPORT', label: 'استيراد' },
        { value: 'SYNC', label: 'مزامنة' },
        { value: 'TEST', label: 'اختبار' },
        { value: 'APPROVE', label: 'موافقة' },
        { value: 'REJECT', label: 'رفض' },
        { value: 'SEND', label: 'إرسال' },
        { value: 'DOWNLOAD', label: 'تنزيل' },
        { value: 'UPLOAD', label: 'رفع' },
        { value: 'CONFIGURE', label: 'تكوين' },
        { value: 'ENABLE', label: 'تفعيل' },
        { value: 'DISABLE', label: 'تعطيل' },
        { value: 'OTHER', label: 'أخرى' }
      ];
      
      return res.status(200).json({
        success: true,
        data: actions
      });
    } catch (error) {
      console.error('Error getting audit log actions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get audit log actions',
        error: error.message
      });
    }
  }
  
  /**
   * Get available audit log entity types
   */
  async getAuditLogEntityTypes(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Get distinct entity types from existing logs
      const entityTypes = await AuditLog.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('entity_type')), 'entity_type']],
        where: {
          tenant_id: tenantId
        },
        raw: true
      });
      
      // Map to value/label format
      const formattedEntityTypes = entityTypes.map(type => ({
        value: type.entity_type,
        label: type.entity_type
      }));
      
      return res.status(200).json({
        success: true,
        data: formattedEntityTypes
      });
    } catch (error) {
      console.error('Error getting audit log entity types:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get audit log entity types',
        error: error.message
      });
    }
  }
  
  /**
   * Get available audit log statuses
   */
  async getAuditLogStatuses(req, res) {
    try {
      const statuses = [
        { value: 'SUCCESS', label: 'نجاح' },
        { value: 'FAILURE', label: 'فشل' },
        { value: 'WARNING', label: 'تحذير' },
        { value: 'INFO', label: 'معلومات' }
      ];
      
      return res.status(200).json({
        success: true,
        data: statuses
      });
    } catch (error) {
      console.error('Error getting audit log statuses:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get audit log statuses',
        error: error.message
      });
    }
  }
  
  /**
   * Get available audit log severities
   */
  async getAuditLogSeverities(req, res) {
    try {
      const severities = [
        { value: 'LOW', label: 'منخفض' },
        { value: 'MEDIUM', label: 'متوسط' },
        { value: 'HIGH', label: 'مرتفع' },
        { value: 'CRITICAL', label: 'حرج' }
      ];
      
      return res.status(200).json({
        success: true,
        data: severities
      });
    } catch (error) {
      console.error('Error getting audit log severities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get audit log severities',
        error: error.message
      });
    }
  }
}

module.exports = new AuditLogController();
