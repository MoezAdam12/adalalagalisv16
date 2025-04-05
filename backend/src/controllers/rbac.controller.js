const Role = require('../models/role.model');
const Permission = require('../models/permission.model');
const RolePermission = require('../models/role-permission.model');
const User = require('../models/user.model.extended');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');

/**
 * RBAC controller for managing roles and permissions
 */
class RBACController {
  /**
   * Get all roles for a tenant
   */
  async getRoles(req, res) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 10, search = '' } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter conditions
      const whereConditions = { tenant_id: tenantId };
      
      if (search) {
        whereConditions.name = { [Op.iLike]: `%${search}%` };
      }
      
      // Query with pagination
      const { count, rows: roles } = await Role.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name', 'module']
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: offset
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'ROLE',
        description: 'Listed roles',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: {
          roles,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting roles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get roles',
        error: error.message
      });
    }
  }
  
  /**
   * Get role by ID
   */
  async getRoleById(req, res) {
    try {
      const tenantId = req.tenantId;
      const roleId = req.params.id;
      
      const role = await Role.findOne({
        where: { id: roleId, tenant_id: tenantId },
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name', 'module']
          }
        ]
      });
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'ROLE',
        entity_id: roleId,
        description: `Viewed role: ${role.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error getting role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get role',
        error: error.message
      });
    }
  }
  
  /**
   * Create a new role
   */
  async createRole(req, res) {
    try {
      const tenantId = req.tenantId;
      const createdBy = req.userId;
      
      const {
        name,
        description,
        permissions = []
      } = req.body;
      
      // Check if role name already exists for this tenant
      const existingRole = await Role.findOne({
        where: { name, tenant_id: tenantId }
      });
      
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }
      
      // Create role
      const role = await Role.create({
        tenant_id: tenantId,
        name,
        description,
        created_by: createdBy,
        updated_by: createdBy
      });
      
      // Assign permissions if provided
      if (permissions.length > 0) {
        await role.setPermissions(permissions);
      }
      
      // Get role with permissions
      const createdRole = await Role.findOne({
        where: { id: role.id },
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name', 'module']
          }
        ]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'ROLE',
        entity_id: role.id,
        description: `Created role: ${role.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: {
          name: role.name,
          description: role.description,
          permissions: permissions
        }
      });
      
      return res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: createdRole
      });
    } catch (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: error.message
      });
    }
  }
  
  /**
   * Update a role
   */
  async updateRole(req, res) {
    try {
      const tenantId = req.tenantId;
      const updatedBy = req.userId;
      const roleId = req.params.id;
      
      const {
        name,
        description,
        permissions
      } = req.body;
      
      // Find role
      const role = await Role.findOne({
        where: { id: roleId, tenant_id: tenantId }
      });
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      // Check if role is a system role
      if (role.is_system_role) {
        return res.status(403).json({
          success: false,
          message: 'System roles cannot be modified'
        });
      }
      
      // Check if name is being changed and already exists
      if (name && name !== role.name) {
        const existingRole = await Role.findOne({
          where: { name, tenant_id: tenantId, id: { [Op.ne]: roleId } }
        });
        
        if (existingRole) {
          return res.status(400).json({
            success: false,
            message: 'Role name already exists'
          });
        }
      }
      
      // Store old values for audit log
      const oldValues = {
        name: role.name,
        description: role.description
      };
      
      // Get current permissions for audit log
      const currentPermissions = await role.getPermissions();
      oldValues.permissions = currentPermissions.map(p => ({ id: p.id, code: p.code, name: p.name }));
      
      // Update role
      const updateData = {
        name: name || role.name,
        description: description || role.description,
        updated_by: updatedBy,
        updated_at: new Date()
      };
      
      await role.update(updateData);
      
      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await role.setPermissions(permissions);
      }
      
      // Get updated role with permissions
      const updatedRole = await Role.findOne({
        where: { id: roleId },
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name', 'module']
          }
        ]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'ROLE',
        entity_id: roleId,
        description: `Updated role: ${role.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: {
          name: updatedRole.name,
          description: updatedRole.description,
          permissions: updatedRole.permissions.map(p => ({ id: p.id, code: p.code, name: p.name }))
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: updatedRole
      });
    } catch (error) {
      console.error('Error updating role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update role',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a role
   */
  async deleteRole(req, res) {
    try {
      const tenantId = req.tenantId;
      const roleId = req.params.id;
      
      // Find role
      const role = await Role.findOne({
        where: { id: roleId, tenant_id: tenantId }
      });
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      // Check if role is a system role
      if (role.is_system_role) {
        return res.status(403).json({
          success: false,
          message: 'System roles cannot be deleted'
        });
      }
      
      // Check if role is assigned to any users
      const usersWithRole = await User.count({
        include: [
          {
            model: Role,
            as: 'roles',
            where: { id: roleId }
          }
        ]
      });
      
      if (usersWithRole > 0) {
        return res.status(400).json({
          success: false,
          message: 'Role is assigned to users and cannot be deleted'
        });
      }
      
      // Store role data for audit log
      const roleData = {
        id: role.id,
        name: role.name,
        description: role.description
      };
      
      // Get current permissions for audit log
      const currentPermissions = await role.getPermissions();
      roleData.permissions = currentPermissions.map(p => ({ id: p.id, code: p.code, name: p.name }));
      
      // Delete role
      await role.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'ROLE',
        entity_id: roleId,
        description: `Deleted role: ${roleData.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: roleData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete role',
        error: error.message
      });
    }
  }
  
  /**
   * Get all permissions
   */
  async getPermissions(req, res) {
    try {
      const permissions = await Permission.findAll({
        order: [['module', 'ASC'], ['name', 'ASC']]
      });
      
      // Group permissions by module
      const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      }, {});
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'PERMISSION',
        description: 'Listed permissions',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: {
          permissions,
          groupedPermissions
        }
      });
    } catch (error) {
      console.error('Error getting permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get permissions',
        error: error.message
      });
    }
  }
  
  /**
   * Create default permissions
   * This is an admin-only function to initialize the system
   */
  async createDefaultPermissions(req, res) {
    try {
      // Define default permissions by module
      const defaultPermissions = [
        // User management permissions
        { code: 'users:create', name: 'Create Users', module: 'users', action_create: true },
        { code: 'users:read', name: 'View Users', module: 'users', action_read: true },
        { code: 'users:update', name: 'Update Users', module: 'users', action_update: true },
        { code: 'users:delete', name: 'Delete Users', module: 'users', action_delete: true },
        
        // Role management permissions
        { code: 'roles:create', name: 'Create Roles', module: 'roles', action_create: true },
        { code: 'roles:read', name: 'View Roles', module: 'roles', action_read: true },
        { code: 'roles:update', name: 'Update Roles', module: 'roles', action_update: true },
        { code: 'roles:delete', name: 'Delete Roles', module: 'roles', action_delete: true },
        
        // Settings permissions
        { code: 'settings:read', name: 'View Settings', module: 'settings', action_read: true },
        { code: 'settings:update', name: 'Update Settings', module: 'settings', action_update: true },
        
        // Notification permissions
        { code: 'notifications:create', name: 'Create Notifications', module: 'notifications', action_create: true },
        { code: 'notifications:read', name: 'View Notifications', module: 'notifications', action_read: true },
        { code: 'notifications:update', name: 'Update Notifications', module: 'notifications', action_update: true },
        { code: 'notifications:delete', name: 'Delete Notifications', module: 'notifications', action_delete: true },
        
        // Notification template permissions
        { code: 'notification_templates:create', name: 'Create Notification Templates', module: 'notifications', action_create: true },
        { code: 'notification_templates:read', name: 'View Notification Templates', module: 'notifications', action_read: true },
        { code: 'notification_templates:update', name: 'Update Notification Templates', module: 'notifications', action_update: true },
        { code: 'notification_templates:delete', name: 'Delete Notification Templates', module: 'notifications', action_delete: true },
        
        // Audit log permissions
        { code: 'audit_logs:read', name: 'View Audit Logs', module: 'audit', action_read: true },
        
        // Billing permissions
        { code: 'billing:read', name: 'View Billing', module: 'billing', action_read: true },
        { code: 'billing:update', name: 'Update Billing', module: 'billing', action_update: true },
        
        // Integration permissions
        { code: 'integrations:create', name: 'Create Integrations', module: 'integrations', action_create: true },
        { code: 'integrations:read', name: 'View Integrations', module: 'integrations', action_read: true },
        { code: 'integrations:update', name: 'Update Integrations', module: 'integrations', action_update: true },
        { code: 'integrations:delete', name: 'Delete Integrations', module: 'integrations', action_delete: true },
        
        // Language permissions
        { code: 'languages:create', name: 'Create Languages', module: 'languages', action_create: true },
        { code: 'languages:read', name: 'View Languages', module: 'languages', action_read: true },
        { code: 'languages:update', name: 'Update Languages', module: 'languages', action_update: true },
        { code: 'languages:delete', name: 'Delete Languages', module: 'languages', action_delete: true }
      ];
      
      // Create permissions
      const createdPermissions = [];
      for (const permission of defaultPermissions) {
        const [perm, created] = await Permission.findOrCreate({
          where: { code: permission.code },
          defaults: permission
        });
        
        createdPermissions.push({ permission: perm, created });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'PERMISSION',
        description: 'Created default permissions',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        message: 'Default permissions created successfully',
        data: {
          created: createdPermissions.filter(p => p.created).length,
          total: createdPermissions.length
        }
      });
    } catch (error) {
      console.error('Error creating default permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create default permissions',
        error: error.message
      });
    }
  }
  
  /**
   * Create default roles
   * This is an admin-only function to initialize the system
   */
  async createDefaultRoles(req, res) {
    try {
      const tenantId = req.tenantId;
      const createdBy = req.userId;
      
      // Get all permissions
      const permissions = await Permission.findAll();
      const permissionsByCode = permissions.reduce((acc, permission) => {
        acc[permission.code] = permission;
        return acc;
      }, {});
      
      // Define default roles
      const defaultRoles = [
        {
          name: 'Super Admin',
          description: 'Full access to all system features',
          is_system_role: true,
          permissions: permissions.map(p => p.id) // All permissions
        },
        {
          name: 'Admin',
          description: 'Administrative access to manage users and settings',
          is_system_role: true,
          permissions: permissions
            .filter(p => !p.code.includes('billing:') && !p.code.includes('integrations:delete'))
            .map(p => p.id)
        },
        {
          name: 'Manager',
          description: 'Access to manage users and view settings',
          is_system_role: true,
          permissions: [
            permissionsByCode['users:read'].id,
            permissionsByCode['users:create'].id,
            permissionsByCode['users:update'].id,
            permissionsByCode['roles:read'].id,
            permissionsByCode['settings:read'].id,
            permissionsByCode['notifications:read'].id,
            permissionsByCode['notifications:create'].id,
            permissionsByCode['audit_logs:read'].id
          ]
        },
        {
          name: 'User',
          description: 'Basic user access',
          is_system_role: true,
          permissions: [
            permissionsByCode['users:read'].id,
            permissionsByCode['notifications:read'].id
          ]
        }
      ];
      
      // Create roles
      const createdRoles = [];
      for (const roleData of defaultRoles) {
        const [role, created] = await Role.findOrCreate({
          where: { name: roleData.name, tenant_id: tenantId },
          defaults: {
            ...roleData,
            tenant_id: tenantId,
            created_by: createdBy,
            updated_by: createdBy
          }
        });
        
        // Set permissions
        await role.setPermissions(roleData.permissions);
        
        createdRoles.push({ role, created });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'ROLE',
        description: 'Created default roles',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        message: 'Default roles created successfully',
        data: {
          created: createdRoles.filter(r => r.created).length,
          total: createdRoles.length
        }
      });
    } catch (error) {
      console.error('Error creating default roles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create default roles',
        error: error.message
      });
    }
  }
  
  /**
   * Assign role to user
   */
  async assignRoleToUser(req, res) {
    try {
      const tenantId = req.tenantId;
      const { userId, roleId } = req.body;
      
      // Find user
      const user = await User.findOne({
        where: { id: userId, tenant_id: tenantId }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Find role
      const role = await Role.findOne({
        where: { id: roleId, tenant_id: tenantId }
      });
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      // Check if user already has this role
      const hasRole = await user.hasRole(role);
      
      if (hasRole) {
        return res.status(400).json({
          success: false,
          message: 'User already has this role'
        });
      }
      
      // Add role to user
      await user.addRole(role);
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'USER_ROLE',
        entity_id: userId,
        description: `Assigned role ${role.name} to user ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: {
          user_id: userId,
          role_id: roleId,
          role_name: role.name
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Role assigned to user successfully'
      });
    } catch (error) {
      console.error('Error assigning role to user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign role to user',
        error: error.message
      });
    }
  }
  
  /**
   * Remove role from user
   */
  async removeRoleFromUser(req, res) {
    try {
      const tenantId = req.tenantId;
      const { userId, roleId } = req.params;
      
      // Find user
      const user = await User.findOne({
        where: { id: userId, tenant_id: tenantId }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Find role
      const role = await Role.findOne({
        where: { id: roleId, tenant_id: tenantId }
      });
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      // Check if user has this role
      const hasRole = await user.hasRole(role);
      
      if (!hasRole) {
        return res.status(400).json({
          success: false,
          message: 'User does not have this role'
        });
      }
      
      // Remove role from user
      await user.removeRole(role);
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'USER_ROLE',
        entity_id: userId,
        description: `Removed role ${role.name} from user ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: {
          user_id: userId,
          role_id: roleId,
          role_name: role.name
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Role removed from user successfully'
      });
    } catch (error) {
      console.error('Error removing role from user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove role from user',
        error: error.message
      });
    }
  }
  
  /**
   * Get users with a specific role
   */
  async getUsersByRole(req, res) {
    try {
      const tenantId = req.tenantId;
      const roleId = req.params.id;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Find role
      const role = await Role.findOne({
        where: { id: roleId, tenant_id: tenantId }
      });
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      // Get users with this role
      const { count, rows: users } = await User.findAndCountAll({
        include: [
          {
            model: Role,
            as: 'roles',
            where: { id: roleId },
            through: { attributes: [] }
          }
        ],
        where: { tenant_id: tenantId },
        attributes: { exclude: ['password_hash'] },
        limit: parseInt(limit),
        offset: offset
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'USER',
        description: `Listed users with role: ${role.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: {
          users,
          role,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting users by role:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get users by role',
        error: error.message
      });
    }
  }
}

module.exports = new RBACController();
