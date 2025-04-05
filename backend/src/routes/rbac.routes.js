const express = require('express');
const router = express.Router();
const rbacController = require('../controllers/rbac.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Roles routes
router.get('/roles', authMiddleware.hasPermission('roles:read'), rbacController.getRoles);
router.get('/roles/:id', authMiddleware.hasPermission('roles:read'), rbacController.getRoleById);
router.post('/roles', authMiddleware.hasPermission('roles:create'), rbacController.createRole);
router.put('/roles/:id', authMiddleware.hasPermission('roles:update'), rbacController.updateRole);
router.delete('/roles/:id', authMiddleware.hasPermission('roles:delete'), rbacController.deleteRole);

// Permissions routes
router.get('/permissions', authMiddleware.hasPermission('roles:read'), rbacController.getPermissions);

// System initialization routes (admin only)
router.post('/permissions/default', authMiddleware.isAdmin, rbacController.createDefaultPermissions);
router.post('/roles/default', authMiddleware.isAdmin, rbacController.createDefaultRoles);

// User-role assignment routes
router.post('/assign-role', authMiddleware.hasPermission('roles:update'), rbacController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleId', authMiddleware.hasPermission('roles:update'), rbacController.removeRoleFromUser);
router.get('/roles/:id/users', authMiddleware.hasPermission('roles:read'), rbacController.getUsersByRole);

module.exports = router;
