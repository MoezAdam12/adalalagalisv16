const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Notification templates routes
router.get('/templates', authMiddleware.hasPermission('notifications:read'), notificationController.getNotificationTemplates);
router.get('/templates/:id', authMiddleware.hasPermission('notifications:read'), notificationController.getNotificationTemplateById);
router.post('/templates', authMiddleware.hasPermission('notifications:update'), notificationController.createNotificationTemplate);
router.put('/templates/:id', authMiddleware.hasPermission('notifications:update'), notificationController.updateNotificationTemplate);
router.delete('/templates/:id', authMiddleware.hasPermission('notifications:update'), notificationController.deleteNotificationTemplate);

// User notifications routes
router.get('/user', notificationController.getUserNotifications);
router.post('/', authMiddleware.hasPermission('notifications:create'), notificationController.createNotification);
router.put('/:id/read', notificationController.markNotificationAsRead);
router.put('/read-all', notificationController.markAllNotificationsAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Notification settings routes
router.get('/settings', notificationController.getUserNotificationSettings);
router.post('/settings', notificationController.updateUserNotificationSettings);

// Email configuration routes
router.get('/email-config', authMiddleware.hasPermission('settings:read'), notificationController.getEmailConfig);
router.post('/email-config', authMiddleware.hasPermission('settings:update'), notificationController.updateEmailConfig);
router.post('/email-config/test', authMiddleware.hasPermission('settings:update'), notificationController.testEmailConfig);

module.exports = router;
