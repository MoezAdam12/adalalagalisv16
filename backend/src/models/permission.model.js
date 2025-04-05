const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Permission model for RBAC implementation
 */
class Permission extends Model {}

Permission.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Permission code is required' },
      notEmpty: { msg: 'Permission code cannot be empty' }
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'Permission name is required' },
      notEmpty: { msg: 'Permission name cannot be empty' }
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notNull: { msg: 'Module is required' },
      notEmpty: { msg: 'Module cannot be empty' }
    }
  },
  action_create: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  action_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  action_update: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  action_delete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'permission',
  tableName: 'tenant_management.permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Permission;
