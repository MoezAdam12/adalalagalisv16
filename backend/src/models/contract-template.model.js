const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');

/**
 * ContractTemplate model for managing contract templates
 */
class ContractTemplate extends Model {}

ContractTemplate.init({
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  contract_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variables: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'ar'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  category: {
    type: DataTypes.STRING(100)
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
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
  modelName: 'contract_template',
  tableName: 'contract_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['contract_type']
    }
  ]
});

// Define associations
ContractTemplate.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
ContractTemplate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = ContractTemplate;
