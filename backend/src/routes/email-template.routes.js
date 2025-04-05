const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/email-template.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get all email templates
router.get('/', authMiddleware.hasPermission('email_templates:read'), emailTemplateController.getEmailTemplates);

// Get email template by ID
router.get('/:id', authMiddleware.hasPermission('email_templates:read'), emailTemplateController.getEmailTemplateById);

// Create new email template
router.post('/', authMiddleware.hasPermission('email_templates:create'), emailTemplateController.createEmailTemplate);

// Update email template
router.put('/:id', authMiddleware.hasPermission('email_templates:update'), emailTemplateController.updateEmailTemplate);

// Delete email template
router.delete('/:id', authMiddleware.hasPermission('email_templates:delete'), emailTemplateController.deleteEmailTemplate);

// Set template as default
router.post('/:id/set-default', authMiddleware.hasPermission('email_templates:update'), emailTemplateController.setDefaultTemplate);

// Preview email template with test data
router.post('/:id/preview', authMiddleware.hasPermission('email_templates:read'), emailTemplateController.previewEmailTemplate);

// Get available email template categories
router.get('/options/categories', authMiddleware.hasPermission('email_templates:read'), emailTemplateController.getEmailTemplateCategories);

// Get system email templates
router.get('/system/templates', authMiddleware.hasPermission('email_templates:read'), emailTemplateController.getSystemEmailTemplates);

// Import system email template
router.post('/system/import', authMiddleware.hasPermission('email_templates:create'), emailTemplateController.importSystemTemplate);

module.exports = router;
