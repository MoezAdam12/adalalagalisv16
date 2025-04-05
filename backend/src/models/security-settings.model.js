const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * SecuritySettings model for advanced security configuration
 */
class SecuritySettings extends Model {}

SecuritySettings.init({
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
  // Password policy settings
  password_min_length: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 8,
    validate: {
      min: { args: [6], msg: 'Minimum password length must be at least 6 characters' },
      max: { args: [128], msg: 'Minimum password length cannot exceed 128 characters' }
    }
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
    defaultValue: 90, // 0 means no expiry
    validate: {
      min: { args: [0], msg: 'Password expiry days cannot be negative' }
    }
  },
  password_history_count: {
    type: DataTypes.INTEGER,
    defaultValue: 5, // Number of previous passwords to remember
    validate: {
      min: { args: [0], msg: 'Password history count cannot be negative' }
    }
  },
  // Two-factor authentication settings
  mfa_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mfa_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mfa_methods: {
    type: DataTypes.JSONB,
    defaultValue: {
      app: true,
      sms: true,
      email: true
    }
  },
  // Session settings
  session_timeout_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    validate: {
      min: { args: [1], msg: 'Session timeout must be at least 1 minute' }
    }
  },
  session_inactivity_timeout_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    validate: {
      min: { args: [0], msg: 'Session inactivity timeout cannot be negative' }
    }
  },
  session_absolute_timeout_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 24,
    validate: {
      min: { args: [0], msg: 'Session absolute timeout cannot be negative' }
    }
  },
  session_concurrent_max: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: { args: [1], msg: 'Maximum concurrent sessions must be at least 1' }
    }
  },
  // IP restrictions
  ip_whitelist_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ip_whitelist: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Login security
  max_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: { args: [1], msg: 'Maximum login attempts must be at least 1' }
    }
  },
  lockout_duration_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    validate: {
      min: { args: [1], msg: 'Lockout duration must be at least 1 minute' }
    }
  },
  // API security
  api_rate_limit_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  api_rate_limit_requests: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: { args: [1], msg: 'API rate limit requests must be at least 1' }
    }
  },
  api_rate_limit_window_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    validate: {
      min: { args: [1], msg: 'API rate limit window must be at least 1 minute' }
    }
  },
  // Audit settings
  audit_log_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  audit_log_retention_days: {
    type: DataTypes.INTEGER,
    defaultValue: 90,
    validate: {
      min: { args: [1], msg: 'Audit log retention days must be at least 1' }
    }
  },
  // CORS settings
  cors_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  cors_allowed_origins: {
    type: DataTypes.JSONB,
    defaultValue: ['*']
  },
  cors_allowed_methods: {
    type: DataTypes.JSONB,
    defaultValue: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  // Additional security settings
  security_headers_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  content_security_policy_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  content_security_policy: {
    type: DataTypes.TEXT
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
  modelName: 'security_settings',
  tableName: 'settings.security_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id'],
      unique: true
    }
  ]
});

module.exports = SecuritySettings;
