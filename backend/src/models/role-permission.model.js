const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Role = require('./role.model');
const Permission = require('./permission.model');

/**
 * RolePermission model for RBAC implementation - junction table between roles and permissions
 */
class RolePermission extends Model {}

RolePermission.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.roles',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'role_id is required' },
      notEmpty: { msg: 'role_id cannot be empty' }
    }
  },
  permission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.permissions',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'permission_id is required' },
      notEmpty: { msg: 'permission_id cannot be empty' }
    }
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
  modelName: 'role_permission',
  tableName: 'tenant_management.role_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id']
    }
  ]
});

// Define associations
Role.belongsToMany(Permission, { 
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});

Permission.belongsToMany(Role, { 
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

module.exports = RolePermission;
