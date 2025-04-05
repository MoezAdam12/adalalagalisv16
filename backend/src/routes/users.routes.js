const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get all users
router.get('/', authMiddleware.hasPermission('users:read'), usersController.getAllUsers);

// Get user by ID
router.get('/:id', authMiddleware.hasPermission('users:read'), usersController.getUserById);

// Create a new user
router.post('/', authMiddleware.hasPermission('users:create'), usersController.createUser);

// Update a user
router.put('/:id', authMiddleware.hasPermission('users:update'), usersController.updateUser);

// Change user password
router.put('/:id/password', authMiddleware.hasPermission('users:update'), usersController.changePassword);

// Delete a user
router.delete('/:id', authMiddleware.hasPermission('users:delete'), usersController.deleteUser);

// Update user notification preferences
router.put('/:id/notification-preferences', authMiddleware.hasPermission('users:update'), usersController.updateNotificationPreferences);

// Update user UI preferences
router.put('/:id/ui-preferences', authMiddleware.hasPermission('users:update'), usersController.updateUIPreferences);

module.exports = router;
