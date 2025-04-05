const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * EmailTemplate model for managing email templates
 */
class EmailTemplate extends Model {}

EmailTemplate.init({
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
      notNull: { msg: 'Template name is required' },
      notEmpty: { msg: 'Template name cannot be empty' }
    }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Template code is required' },
      notEmpty: { msg: 'Template code cannot be empty' }
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Email subject is required' },
      notEmpty: { msg: 'Email subject cannot be empty' }
    }
  },
  body_html: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: { msg: 'HTML body is required' },
      notEmpty: { msg: 'HTML body cannot be empty' }
    }
  },
  body_text: {
    type: DataTypes.TEXT
  },
  variables: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Category is required' },
      notEmpty: { msg: 'Category cannot be empty' },
      isIn: {
        args: [['authentication', 'notification', 'billing', 'marketing', 'system', 'other']],
        msg: 'Category must be one of: authentication, notification, billing, marketing, system, other'
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  modelName: 'email_template',
  tableName: 'settings.email_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id'],
      name: 'email_templates_tenant_id_idx'
    },
    {
      fields: ['code'],
      name: 'email_templates_code_idx'
    },
    {
      fields: ['category'],
      name: 'email_templates_category_idx'
    },
    {
      fields: ['is_active'],
      name: 'email_templates_is_active_idx'
    },
    {
      fields: ['is_default'],
      name: 'email_templates_is_default_idx'
    },
    {
      fields: ['is_system'],
      name: 'email_templates_is_system_idx'
    }
  ]
});

module.exports = EmailTemplate;
