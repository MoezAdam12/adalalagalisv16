const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');

/**
 * TenantSettings model for multi-tenant architecture
 */
class TenantSettings extends Model {}

TenantSettings.init({
  tenant_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: 'tenant_management.tenants',
      key: 'id'
    }
  },
  default_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'ar',
    allowNull: false
  },
  enabled_modules: {
    type: DataTypes.JSONB,
    defaultValue: ['contracts', 'documents', 'clients', 'tasks'],
    allowNull: false
  },
  theme_settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  notification_settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
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
  modelName: 'tenant_settings',
  tableName: 'tenant_management.tenant_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define association with Tenant
TenantSettings.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasOne(TenantSettings, { foreignKey: 'tenant_id', as: 'settings' });

module.exports = TenantSettings;
