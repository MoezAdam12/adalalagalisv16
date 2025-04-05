const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * SystemSettings model for centralized application configuration
 */
class SystemSettings extends Model {}

SystemSettings.init({
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
      notNull: { msg: 'tenant_id is required' },
      notEmpty: { msg: 'tenant_id cannot be empty' }
    }
  },
  // General settings
  system_name: {
    type: DataTypes.STRING(100),
    defaultValue: 'Adala Legalis'
  },
  logo_url: {
    type: DataTypes.TEXT
  },
  primary_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#1976d2'
  },
  secondary_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#424242'
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'ar',
    validate: {
      isIn: {
        args: [['ar', 'en']],
        msg: 'Language must be either ar or en'
      }
    }
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Riyadh'
  },
  date_format: {
    type: DataTypes.STRING(20),
    defaultValue: 'DD/MM/YYYY'
  },
  time_format: {
    type: DataTypes.STRING(10),
    defaultValue: '24h',
    validate: {
      isIn: {
        args: [['12h', '24h']],
        msg: 'Time format must be either 12h or 24h'
      }
    }
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'SAR'
  },
  // Security settings
  password_min_length: {
    type: DataTypes.INTEGER,
    defaultValue: 8
  },
  password_require_uppercase: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  password_require_lowercase: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  password_require_numbers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  password_require_symbols: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  password_expiry_days: {
    type: DataTypes.INTEGER,
    defaultValue: 90
  },
  session_timeout_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  max_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  two_factor_auth_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ip_restriction_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowed_ips: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('allowed_ips');
      return value ? value.split(',') : [];
    },
    set(val) {
      this.setDataValue('allowed_ips', Array.isArray(val) ? val.join(',') : val);
    }
  },
  // Email settings
  smtp_server: {
    type: DataTypes.STRING(255)
  },
  smtp_port: {
    type: DataTypes.INTEGER,
    defaultValue: 587
  },
  smtp_username: {
    type: DataTypes.STRING(255)
  },
  smtp_password: {
    type: DataTypes.STRING(255)
  },
  smtp_secure: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  from_email: {
    type: DataTypes.STRING(255)
  },
  from_name: {
    type: DataTypes.STRING(255)
  },
  email_signature: {
    type: DataTypes.TEXT
  },
  // Notification settings
  email_notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  in_app_notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notification_sound_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // White labeling
  custom_css: {
    type: DataTypes.TEXT
  },
  custom_js: {
    type: DataTypes.TEXT
  },
  favicon_url: {
    type: DataTypes.TEXT
  },
  login_background_url: {
    type: DataTypes.TEXT
  },
  // Billing settings
  vat_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 15.00
  },
  default_payment_terms: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  invoice_prefix: {
    type: DataTypes.STRING(10),
    defaultValue: 'INV'
  },
  invoice_footer_text: {
    type: DataTypes.TEXT
  },
  // External integrations
  google_drive_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  google_drive_client_id: {
    type: DataTypes.STRING(255)
  },
  google_drive_client_secret: {
    type: DataTypes.STRING(255)
  },
  dropbox_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dropbox_app_key: {
    type: DataTypes.STRING(255)
  },
  dropbox_app_secret: {
    type: DataTypes.STRING(255)
  },
  sms_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sms_provider: {
    type: DataTypes.STRING(50)
  },
  sms_api_key: {
    type: DataTypes.STRING(255)
  },
  payment_gateway_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  payment_gateway_provider: {
    type: DataTypes.STRING(50)
  },
  payment_gateway_api_key: {
    type: DataTypes.STRING(255)
  },
  // Audit settings
  audit_log_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  audit_log_retention_days: {
    type: DataTypes.INTEGER,
    defaultValue: 365
  },
  // Metadata
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
  modelName: 'system_settings',
  tableName: 'tenant_management.system_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id']
    }
  ]
});

module.exports = SystemSettings;
