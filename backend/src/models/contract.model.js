const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');

/**
 * Contract model for managing legal contracts
 */
class Contract extends Model {}

Contract.init({
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
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.users',
      key: 'id'
    }
  },
  client_id: {
    type: DataTypes.UUID,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contract_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  contract_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft',
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE
  },
  end_date: {
    type: DataTypes.DATE
  },
  value: {
    type: DataTypes.DECIMAL(15, 2)
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR'
  },
  description: {
    type: DataTypes.TEXT
  },
  terms: {
    type: DataTypes.TEXT
  },
  content: {
    type: DataTypes.TEXT
  },
  template_id: {
    type: DataTypes.UUID,
    references: {
      model: 'contract_templates',
      key: 'id'
    }
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  is_signed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  signature_date: {
    type: DataTypes.DATE
  },
  signature_method: {
    type: DataTypes.STRING(50)
  },
  signature_data: {
    type: DataTypes.JSONB
  },
  payment_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  payment_schedule: {
    type: DataTypes.JSONB
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  metadata: {
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
  modelName: 'contract',
  tableName: 'contracts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['contract_number']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
Contract.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Contract.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = Contract;
