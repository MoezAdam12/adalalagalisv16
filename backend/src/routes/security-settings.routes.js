const express = require('express');
const router = express.Router();
const securitySettingsController = require('../controllers/security-settings.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Security settings routes
router.get('/', authMiddleware.hasPermission('settings:read'), securitySettingsController.getSecuritySettings);
router.put('/', authMiddleware.hasPermission('settings:update'), securitySettingsController.updateSecuritySettings);
router.post('/reset', authMiddleware.hasPermission('settings:update'), securitySettingsController.resetSecuritySettings);
router.post('/test-password', securitySettingsController.testPasswordPolicy);

// Session management routes
router.get('/sessions', authMiddleware.hasPermission('settings:read'), securitySettingsController.getActiveSessions);
router.delete('/sessions/:id', authMiddleware.hasPermission('settings:update'), securitySettingsController.terminateSession);
router.delete('/sessions', authMiddleware.hasPermission('settings:update'), securitySettingsController.terminateAllSessions);

// IP whitelist routes
router.put('/ip-whitelist', authMiddleware.hasPermission('settings:update'), securitySettingsController.updateIPWhitelist);

module.exports = router;
