const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Role model for RBAC implementation
 */
class Role extends Model {}

Role.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.tenants',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'tenant_id is required' },
      notEmpty: { msg: 'tenant_id cannot be empty' }
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'Role name is required' },
      notEmpty: { msg: 'Role name cannot be empty' },
      len: {
        args: [2, 100],
        msg: 'Role name must be between 2 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  is_system_role: {
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
  },
  created_by: {
    type: DataTypes.UUID
  },
  updated_by: {
    type: DataTypes.UUID
  }
}, {
  sequelize,
  modelName: 'role',
  tableName: 'tenant_management.roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'name']
    }
  ]
});

module.exports = Role;
