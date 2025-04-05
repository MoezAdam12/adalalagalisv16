const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');

/**
 * Client model for managing legal clients
 */
class Client extends Model {}

Client.init({
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
  client_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'individual' // individual, company, government
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact_person: {
    type: DataTypes.STRING(255)
  },
  email: {
    type: DataTypes.STRING(255)
  },
  phone: {
    type: DataTypes.STRING(50)
  },
  mobile: {
    type: DataTypes.STRING(50)
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING(100)
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'المملكة العربية السعودية'
  },
  postal_code: {
    type: DataTypes.STRING(20)
  },
  national_id: {
    type: DataTypes.STRING(50)
  },
  commercial_register: {
    type: DataTypes.STRING(50)
  },
  tax_number: {
    type: DataTypes.STRING(50)
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100)
  },
  notes: {
    type: DataTypes.TEXT
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  portal_access: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  portal_username: {
    type: DataTypes.STRING(255)
  },
  portal_password_hash: {
    type: DataTypes.STRING(255)
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
  modelName: 'client',
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['email']
    },
    {
      fields: ['phone']
    },
    {
      fields: ['national_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
Client.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Client.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = Client;
