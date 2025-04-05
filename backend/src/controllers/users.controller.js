const User = require('../models/user.model.extended');
const Role = require('../models/role.model');
const Permission = require('../models/permission.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

/**
 * User management controller
 */
class UserController {
  /**
   * Get all users for a tenant
   */
  async getAllUsers(req, res) {
    try {
      const tenantId = req.tenantId;
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        role = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter conditions
      const whereConditions = { tenant_id: tenantId };
      
      if (search) {
        whereConditions[Op.or] = [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (status) {
        whereConditions.status = status;
      }
      
      // Query with pagination
      const { count, rows: users } = await User.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'description'],
            ...(role ? { where: { id: role } } : {})
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
        attributes: { exclude: ['password_hash'] }
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'USER',
        description: 'Listed users',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message
      });
    }
  }
  
  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      
      const user = await User.findOne({
        where: { id: userId, tenant_id: tenantId },
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'description'],
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
                attributes: ['id', 'code', 'name', 'module']
              }
            ]
          }
        ],
        attributes: { exclude: ['password_hash'] }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'USER',
        entity_id: userId,
        description: `Viewed user: ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user',
        error: error.message
      });
    }
  }
  
  /**
   * Create a new user
   */
  async createUser(req, res) {
    try {
      const tenantId = req.tenantId;
      const createdBy = req.userId;
      
      const {
        email,
        password,
        first_name,
        last_name,
        role,
        job_title,
        department,
        phone_number,
        roles = []
      } = req.body;
      
      // Check if email already exists for this tenant
      const existingUser = await User.findOne({
        where: { email, tenant_id: tenantId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Create user
      const user = await User.create({
        tenant_id: tenantId,
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
        role: role || 'user', // Legacy role field
        job_title,
        department,
        phone_number,
        created_by: createdBy,
        updated_by: createdBy
      });
      
      // Assign roles if provided
      if (roles.length > 0) {
        await user.setRoles(roles);
      }
      
      // Get user with roles
      const createdUser = await User.findOne({
        where: { id: user.id },
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password_hash'] }
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'USER',
        entity_id: user.id,
        description: `Created user: ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          roles: roles
        }
      });
      
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: createdUser
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }
  
  /**
   * Update a user
   */
  async updateUser(req, res) {
    try {
      const tenantId = req.tenantId;
      const updatedBy = req.userId;
      const userId = req.params.id;
      
      const {
        email,
        first_name,
        last_name,
        role,
        job_title,
        department,
        phone_number,
        status,
        roles,
        settings
      } = req.body;
      
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
      
      // Check if email is being changed and already exists
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: { email, tenant_id: tenantId, id: { [Op.ne]: userId } }
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }
      }
      
      // Store old values for audit log
      const oldValues = {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        job_title: user.job_title,
        department: user.department,
        phone_number: user.phone_number,
        status: user.status,
        settings: user.settings
      };
      
      // Update user
      const updateData = {
        email: email || user.email,
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        role: role || user.role,
        job_title: job_title || user.job_title,
        department: department || user.department,
        phone_number: phone_number || user.phone_number,
        status: status || user.status,
        settings: settings || user.settings,
        updated_by: updatedBy,
        updated_at: new Date()
      };
      
      await user.update(updateData);
      
      // Update roles if provided
      if (roles && Array.isArray(roles)) {
        await user.setRoles(roles);
      }
      
      // Get updated user with roles
      const updatedUser = await User.findOne({
        where: { id: userId },
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password_hash'] }
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'USER',
        entity_id: userId,
        description: `Updated user: ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: {
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: updatedUser.role,
          job_title: updatedUser.job_title,
          department: updatedUser.department,
          phone_number: updatedUser.phone_number,
          status: updatedUser.status,
          settings: updatedUser.settings,
          roles: updatedUser.roles.map(r => ({ id: r.id, name: r.name }))
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }
  
  /**
   * Change user password
   */
  async changePassword(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      const { password } = req.body;
      
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
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Update password
      await user.update({
        password_hash: passwordHash,
        last_password_change: new Date(),
        password_reset_required: false,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'USER',
        entity_id: userId,
        description: `Changed password for user: ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a user
   */
  async deleteUser(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      
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
      
      // Store user data for audit log
      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      };
      
      // Delete user
      await user.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'USER',
        entity_id: userId,
        description: `Deleted user: ${userData.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: userData
      });
      
      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }
  
  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      const preferences = req.body;
      
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
      
      // Store old preferences for audit log
      const oldPreferences = user.getNotificationPreferences();
      
      // Update preferences
      await user.updateNotificationPreferences(preferences);
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'USER_PREFERENCES',
        entity_id: userId,
        description: `Updated notification preferences for user: ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: { notification_preferences: oldPreferences },
        new_values: { notification_preferences: user.getNotificationPreferences() }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: user.getNotificationPreferences()
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: error.message
      });
    }
  }
  
  /**
   * Update user UI preferences
   */
  async updateUIPreferences(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.params.id;
      const preferences = req.body;
      
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
      
      // Store old preferences for audit log
      const oldPreferences = user.getUIPreferences();
      
      // Update preferences
      await user.updateUIPreferences(preferences);
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'USER_PREFERENCES',
        entity_id: userId,
        description: `Updated UI preferences for user: ${user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: { ui_preferences: oldPreferences },
        new_values: { ui_preferences: user.getUIPreferences() }
      });
      
      return res.status(200).json({
        success: true,
        message: 'UI preferences updated successfully',
        data: user.getUIPreferences()
      });
    } catch (error) {
      console.error('Error updating UI preferences:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update UI preferences',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
