const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model.extended');
const Role = require('./role.model');

/**
 * UserRole model for RBAC implementation - junction table between users and roles
 */
class UserRole extends Model {}

UserRole.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.users',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'user_id is required' },
      notEmpty: { msg: 'user_id cannot be empty' }
    }
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
  }
}, {
  sequelize,
  modelName: 'user_role',
  tableName: 'tenant_management.user_roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'role_id']
    }
  ]
});

// Define associations
User.belongsToMany(Role, { 
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
});

Role.belongsToMany(User, { 
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
});

module.exports = UserRole;
