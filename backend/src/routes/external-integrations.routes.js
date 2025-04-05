const express = require('express');
const router = express.Router();
const externalIntegrationsController = require('../controllers/external-integrations.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get all integrations
router.get('/', authMiddleware.hasPermission('integrations:read'), externalIntegrationsController.getIntegrations);

// Get integration by ID
router.get('/:id', authMiddleware.hasPermission('integrations:read'), externalIntegrationsController.getIntegrationById);

// Create new integration
router.post('/', authMiddleware.hasPermission('integrations:create'), externalIntegrationsController.createIntegration);

// Update integration
router.put('/:id', authMiddleware.hasPermission('integrations:update'), externalIntegrationsController.updateIntegration);

// Delete integration
router.delete('/:id', authMiddleware.hasPermission('integrations:delete'), externalIntegrationsController.deleteIntegration);

// Test integration connection
router.post('/:id/test', authMiddleware.hasPermission('integrations:update'), externalIntegrationsController.testIntegration);

// Sync integration data
router.post('/:id/sync', authMiddleware.hasPermission('integrations:update'), externalIntegrationsController.syncIntegration);

// Get available integration providers
router.get('/providers/available', authMiddleware.hasPermission('integrations:read'), externalIntegrationsController.getAvailableProviders);

// Get OAuth authorization URL
router.get('/oauth/url', authMiddleware.hasPermission('integrations:create'), externalIntegrationsController.getOAuthUrl);

// Handle OAuth callback
router.post('/oauth/callback', authMiddleware.hasPermission('integrations:create'), externalIntegrationsController.handleOAuthCallback);

module.exports = router;
