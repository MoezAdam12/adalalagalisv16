const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * NotificationTemplate model for email and in-app notification templates
 */
class NotificationTemplate extends Model {}

NotificationTemplate.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'Template name is required' },
      notEmpty: { msg: 'Template name cannot be empty' }
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Template code is required' },
      notEmpty: { msg: 'Template code cannot be empty' }
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'email',
    validate: {
      isIn: {
        args: [['email', 'in_app', 'sms']],
        msg: 'Type must be one of: email, in_app, sms'
      }
    }
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  content_html: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: { msg: 'HTML content is required' },
      notEmpty: { msg: 'HTML content cannot be empty' }
    }
  },
  content_text: {
    type: DataTypes.TEXT
  },
  variables: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notNull: { msg: 'Category is required' },
      notEmpty: { msg: 'Category cannot be empty' }
    }
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tenant_management.tenants',
      key: 'id'
    }
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
  modelName: 'notification_template',
  tableName: 'notification.templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['type']
    },
    {
      fields: ['category']
    },
    {
      fields: ['tenant_id']
    }
  ]
});

module.exports = NotificationTemplate;
