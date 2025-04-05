const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ExternalIntegration model for managing integrations with external services
 */
class ExternalIntegration extends Model {}

ExternalIntegration.init({
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
      notNull: { msg: 'Tenant ID is required' },
      notEmpty: { msg: 'Tenant ID cannot be empty' }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Integration name is required' },
      notEmpty: { msg: 'Integration name cannot be empty' }
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Integration type is required' },
      notEmpty: { msg: 'Integration type cannot be empty' },
      isIn: {
        args: [['storage', 'accounting', 'payment', 'sms', 'email', 'calendar', 'other']],
        msg: 'Integration type must be one of: storage, accounting, payment, sms, email, calendar, other'
      }
    }
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Provider is required' },
      notEmpty: { msg: 'Provider cannot be empty' }
    }
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  credentials: {
    type: DataTypes.JSONB,
    defaultValue: {},
    get() {
      // Decrypt credentials when retrieving
      const encryptedCredentials = this.getDataValue('credentials');
      if (!encryptedCredentials) return {};
      
      // In a real implementation, this would decrypt the credentials
      // For demonstration purposes, we'll just return them as is
      return encryptedCredentials;
    },
    set(value) {
      // Encrypt credentials when storing
      if (!value) {
        this.setDataValue('credentials', {});
        return;
      }
      
      // In a real implementation, this would encrypt the credentials
      // For demonstration purposes, we'll just store them as is
      this.setDataValue('credentials', value);
    }
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  last_sync_at: {
    type: DataTypes.DATE
  },
  sync_status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'in_progress', 'completed', 'failed']],
        msg: 'Sync status must be one of: pending, in_progress, completed, failed'
      }
    }
  },
  sync_error: {
    type: DataTypes.TEXT
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
  modelName: 'external_integration',
  tableName: 'settings.external_integrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id', 'type', 'provider'],
      unique: true,
      name: 'external_integrations_tenant_type_provider_idx'
    },
    {
      fields: ['tenant_id'],
      name: 'external_integrations_tenant_id_idx'
    },
    {
      fields: ['type'],
      name: 'external_integrations_type_idx'
    },
    {
      fields: ['provider'],
      name: 'external_integrations_provider_idx'
    }
  ]
});

module.exports = ExternalIntegration;
