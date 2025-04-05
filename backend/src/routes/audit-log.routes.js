const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/audit-log.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get audit logs with filtering and pagination
router.get('/', authMiddleware.hasPermission('audit_logs:read'), auditLogController.getAuditLogs);

// Get audit log by ID
router.get('/:id', authMiddleware.hasPermission('audit_logs:read'), auditLogController.getAuditLogById);

// Export audit logs to CSV
router.get('/export/csv', authMiddleware.hasPermission('audit_logs:export'), auditLogController.exportAuditLogs);

// Get audit log statistics
router.get('/stats/summary', authMiddleware.hasPermission('audit_logs:read'), auditLogController.getAuditLogStats);

// Create a manual audit log entry
router.post('/', authMiddleware.hasPermission('audit_logs:create'), auditLogController.createAuditLog);

// Get available audit log actions
router.get('/options/actions', authMiddleware.hasPermission('audit_logs:read'), auditLogController.getAuditLogActions);

// Get available audit log entity types
router.get('/options/entity-types', authMiddleware.hasPermission('audit_logs:read'), auditLogController.getAuditLogEntityTypes);

// Get available audit log statuses
router.get('/options/statuses', authMiddleware.hasPermission('audit_logs:read'), auditLogController.getAuditLogStatuses);

// Get available audit log severities
router.get('/options/severities', authMiddleware.hasPermission('audit_logs:read'), auditLogController.getAuditLogSeverities);

module.exports = router;
