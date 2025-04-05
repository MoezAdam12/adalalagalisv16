const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * NotificationSetting model for user notification preferences
 */
class NotificationSetting extends Model {}

NotificationSetting.init({
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
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notNull: { msg: 'Category is required' },
      notEmpty: { msg: 'Category cannot be empty' }
    }
  },
  email_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  in_app_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sms_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  push_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_digest: {
    type: DataTypes.STRING(20),
    defaultValue: 'instant',
    validate: {
      isIn: {
        args: [['instant', 'daily', 'weekly', 'never']],
        msg: 'Email digest must be one of: instant, daily, weekly, never'
      }
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
  modelName: 'notification_setting',
  tableName: 'notification.settings',
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
      fields: ['category']
    },
    {
      unique: true,
      fields: ['user_id', 'tenant_id', 'category']
    }
  ]
});

module.exports = NotificationSetting;
