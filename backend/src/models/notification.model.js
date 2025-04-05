const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Notification model for storing user notifications
 */
class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user_management.users',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'User ID is required' },
      notEmpty: { msg: 'User ID cannot be empty' }
    }
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notNull: { msg: 'Notification title is required' },
      notEmpty: { msg: 'Notification title cannot be empty' }
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: { msg: 'Notification message is required' },
      notEmpty: { msg: 'Notification message cannot be empty' }
    }
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'info',
    validate: {
      isIn: {
        args: [['info', 'success', 'warning', 'error']],
        msg: 'Type must be one of: info, success, warning, error'
      }
    }
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'system',
    validate: {
      notNull: { msg: 'Category is required' },
      notEmpty: { msg: 'Category cannot be empty' }
    }
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE
  },
  action_url: {
    type: DataTypes.STRING(255)
  },
  image_url: {
    type: DataTypes.STRING(255)
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  delivery_status: {
    type: DataTypes.JSONB,
    defaultValue: {
      in_app: 'pending',
      email: 'pending'
    }
  },
  email_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_sent_at: {
    type: DataTypes.DATE
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'notification',
  tableName: 'notification.notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['tenant_id']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['category']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = Notification;
