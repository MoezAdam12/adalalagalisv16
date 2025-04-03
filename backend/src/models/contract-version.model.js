const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');
const Contract = require('./contract.model');

/**
 * ContractVersion model for tracking contract versions
 */
class ContractVersion extends Model {}

ContractVersion.init({
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
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.users',
      key: 'id'
    }
  },
  version_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  terms: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(50),
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
  change_summary: {
    type: DataTypes.TEXT
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'contract_version',
  tableName: 'contract_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['contract_id']
    },
    {
      fields: ['version_number']
    }
  ]
});

// Define associations
ContractVersion.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
ContractVersion.belongsTo(Contract, { foreignKey: 'contract_id', as: 'contract' });
ContractVersion.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Contract.hasMany(ContractVersion, { foreignKey: 'contract_id', as: 'versions' });

module.exports = ContractVersion;
