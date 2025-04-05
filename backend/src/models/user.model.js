const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');

/**
 * User model for multi-tenant architecture
 */
class User extends Model {}

User.init({
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
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'ar'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_login: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    allowNull: false
  },
  profile_image_url: {
    type: DataTypes.TEXT
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'user',
  tableName: 'tenant_management.users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'email']
    }
  ]
});

// Define association with Tenant
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });

module.exports = User;
