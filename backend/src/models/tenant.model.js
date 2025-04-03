const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Tenant model for multi-tenant architecture
 */
class Tenant extends Model {}

Tenant.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  account_number: {
    type: DataTypes.STRING(6),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subdomain: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    allowNull: false
  },
  subscription_plan: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  subscription_start_date: {
    type: DataTypes.DATE
  },
  subscription_end_date: {
    type: DataTypes.DATE
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact_phone: {
    type: DataTypes.STRING(50)
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING(100)
  },
  country: {
    type: DataTypes.STRING(100)
  },
  logo_url: {
    type: DataTypes.TEXT
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'tenant',
  tableName: 'tenant_management.tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Tenant;
