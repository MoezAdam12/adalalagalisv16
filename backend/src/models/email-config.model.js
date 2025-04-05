const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * EmailConfig model for email server settings
 */
class EmailConfig extends Model {}

EmailConfig.init({
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
  provider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'smtp',
    validate: {
      isIn: {
        args: [['smtp', 'sendgrid', 'mailgun', 'ses', 'mailchimp']],
        msg: 'Provider must be one of: smtp, sendgrid, mailgun, ses, mailchimp'
      }
    }
  },
  host: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: { msg: 'Port must be an integer' }
    }
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  api_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  from_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notNull: { msg: 'From email is required' },
      notEmpty: { msg: 'From email cannot be empty' },
      isEmail: { msg: 'From email must be a valid email address' }
    }
  },
  from_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notNull: { msg: 'From name is required' },
      notEmpty: { msg: 'From name cannot be empty' }
    }
  },
  reply_to: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Reply to must be a valid email address' }
    }
  },
  encryption: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      isIn: {
        args: [['tls', 'ssl', 'none', null]],
        msg: 'Encryption must be one of: tls, ssl, none'
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_date: {
    type: DataTypes.DATE
  },
  settings: {
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
  },
  created_by: {
    type: DataTypes.UUID
  },
  updated_by: {
    type: DataTypes.UUID
  }
}, {
  sequelize,
  modelName: 'email_config',
  tableName: 'notification.email_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['provider']
    }
  ]
});

module.exports = EmailConfig;
