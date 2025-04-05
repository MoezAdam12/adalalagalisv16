const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');

/**
 * Document model for managing legal documents
 */
class Document extends Model {}

Document.init({
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
  contract_id: {
    type: DataTypes.UUID,
    references: {
      model: 'contracts',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  document_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  document_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100)
  },
  description: {
    type: DataTypes.TEXT
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    allowNull: false
  },
  is_template: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_confidential: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiry_date: {
    type: DataTypes.DATE
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'ar'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  ocr_processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ocr_content: {
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
  modelName: 'document',
  tableName: 'documents',
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
      fields: ['contract_id']
    },
    {
      fields: ['document_number']
    },
    {
      fields: ['document_type']
    }
  ]
});

// Define associations
Document.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Document.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = Document;
