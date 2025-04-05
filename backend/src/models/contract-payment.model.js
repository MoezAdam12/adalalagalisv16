const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');
const Contract = require('./contract.model');

/**
 * ContractPayment model for tracking payments related to contracts
 */
class ContractPayment extends Model {}

ContractPayment.init({
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
  contract_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'contracts',
      key: 'id'
    }
  },
  recorded_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR',
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  reference_number: {
    type: DataTypes.STRING(100)
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'completed',
    allowNull: false
  },
  payment_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'installment',
    allowNull: false
  },
  installment_number: {
    type: DataTypes.INTEGER
  },
  receipt_url: {
    type: DataTypes.TEXT
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
  modelName: 'contract_payment',
  tableName: 'contract_payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['contract_id']
    },
    {
      fields: ['payment_date']
    }
  ]
});

// Define associations
ContractPayment.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
ContractPayment.belongsTo(Contract, { foreignKey: 'contract_id', as: 'contract' });
ContractPayment.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });
Contract.hasMany(ContractPayment, { foreignKey: 'contract_id', as: 'payments' });

module.exports = ContractPayment;
