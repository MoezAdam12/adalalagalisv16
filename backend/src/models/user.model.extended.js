const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');

/**
 * Extended User model with enhanced role management and notification preferences
 */
class User extends Model {}

User.init({
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
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notNull: { msg: 'Email is required' },
      notEmpty: { msg: 'Email cannot be empty' },
      isEmail: { msg: 'Email must be a valid email address' }
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notNull: { msg: 'Password hash is required' },
      notEmpty: { msg: 'Password hash cannot be empty' }
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'First name is required' },
      notEmpty: { msg: 'First name cannot be empty' },
      len: {
        args: [2, 100],
        msg: 'First name must be between 2 and 100 characters'
      }
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'Last name is required' },
      notEmpty: { msg: 'Last name cannot be empty' },
      len: {
        args: [2, 100],
        msg: 'Last name must be between 2 and 100 characters'
      }
    }
  },
  // Legacy role field - maintained for backward compatibility
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notNull: { msg: 'Role is required' },
      notEmpty: { msg: 'Role cannot be empty' },
      isIn: {
        args: [['admin', 'manager', 'lawyer', 'assistant', 'user']],
        msg: 'Role must be one of: admin, manager, lawyer, assistant, user'
      }
    }
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
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_login: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    allowNull: false,
    validate: {
      isIn: {
        args: [['active', 'inactive', 'suspended', 'pending']],
        msg: 'Status must be one of: active, inactive, suspended, pending'
      }
    }
  },
  profile_image_url: {
    type: DataTypes.TEXT,
    validate: {
      isUrl: {
        msg: 'Profile image URL must be a valid URL'
      }
    }
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Enhanced settings field with structured preferences
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      notification_preferences: {
        email_notifications: true,
        in_app_notifications: true,
        notification_sound: true,
        email_digest: 'none' // 'none', 'daily', 'weekly'
      },
      ui_preferences: {
        theme: 'system', // 'light', 'dark', 'system'
        sidebar_collapsed: false,
        language: 'ar', // 'ar', 'en'
        items_per_page: 10
      },
      security_preferences: {
        two_factor_auth: false,
        login_notification: true
      }
    }
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockout_until: {
    type: DataTypes.DATE
  },
  // New fields for enhanced user management
  job_title: {
    type: DataTypes.STRING(100)
  },
  department: {
    type: DataTypes.STRING(100)
  },
  phone_number: {
    type: DataTypes.STRING(20),
    validate: {
      is: {
        args: /^[+]?[0-9]{8,15}$/,
        msg: 'Phone number must be a valid format'
      }
    }
  },
  last_password_change: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  password_reset_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  account_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'standard',
    validate: {
      isIn: {
        args: [['standard', 'admin', 'system']],
        msg: 'Account type must be one of: standard, admin, system'
      }
    }
  },
  created_by: {
    type: DataTypes.UUID
  },
  updated_by: {
    type: DataTypes.UUID
  }
}, {
  sequelize,
  modelName: 'user',
  tableName: 'tenant_management.users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'email']
    }
  ],
  hooks: {
    beforeCreate: (user) => {
      // Ensure settings is a valid JSON object
      if (typeof user.settings === 'string') {
        try {
          user.settings = JSON.parse(user.settings);
        } catch (e) {
          user.settings = {
            notification_preferences: {
              email_notifications: true,
              in_app_notifications: true,
              notification_sound: true,
              email_digest: 'none'
            },
            ui_preferences: {
              theme: 'system',
              sidebar_collapsed: false,
              language: 'ar',
              items_per_page: 10
            },
            security_preferences: {
              two_factor_auth: false,
              login_notification: true
            }
          };
        }
      } else if (!user.settings) {
        user.settings = {
          notification_preferences: {
            email_notifications: true,
            in_app_notifications: true,
            notification_sound: true,
            email_digest: 'none'
          },
          ui_preferences: {
            theme: 'system',
            sidebar_collapsed: false,
            language: 'ar',
            items_per_page: 10
          },
          security_preferences: {
            two_factor_auth: false,
            login_notification: true
          }
        };
      }
      
      // Set last_password_change to current date
      user.last_password_change = new Date();
    },
    beforeUpdate: (user) => {
      // Ensure settings is a valid JSON object
      if (typeof user.settings === 'string') {
        try {
          user.settings = JSON.parse(user.settings);
        } catch (e) {
          // Keep existing settings if parsing fails
        }
      }
    }
  }
});

// Define association with Tenant
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });

// Instance methods
User.prototype.isLocked = function() {
  return this.lockout_until && new Date() < this.lockout_until;
};

User.prototype.incrementLoginAttempts = async function() {
  const authConfig = require('../config/auth.config');
  this.login_attempts += 1;
  
  // Lock account if max attempts reached
  if (this.login_attempts >= authConfig.maxLoginAttempts) {
    this.lockout_until = new Date(Date.now() + authConfig.lockoutDuration);
  }
  
  await this.save();
};

User.prototype.resetLoginAttempts = async function() {
  this.login_attempts = 0;
  this.lockout_until = null;
  await this.save();
};

// New instance methods for enhanced user management
User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

User.prototype.isPasswordExpired = function() {
  const authConfig = require('../config/auth.config');
  if (!authConfig.passwordExpiryDays || !this.last_password_change) {
    return false;
  }
  
  const expiryDate = new Date(this.last_password_change);
  expiryDate.setDate(expiryDate.getDate() + authConfig.passwordExpiryDays);
  
  return new Date() > expiryDate;
};

User.prototype.getNotificationPreferences = function() {
  return this.settings?.notification_preferences || {
    email_notifications: true,
    in_app_notifications: true,
    notification_sound: true,
    email_digest: 'none'
  };
};

User.prototype.getUIPreferences = function() {
  return this.settings?.ui_preferences || {
    theme: 'system',
    sidebar_collapsed: false,
    language: 'ar',
    items_per_page: 10
  };
};

User.prototype.updateNotificationPreferences = async function(preferences) {
  if (!this.settings) {
    this.settings = {};
  }
  
  this.settings.notification_preferences = {
    ...this.getNotificationPreferences(),
    ...preferences
  };
  
  await this.save();
};

User.prototype.updateUIPreferences = async function(preferences) {
  if (!this.settings) {
    this.settings = {};
  }
  
  this.settings.ui_preferences = {
    ...this.getUIPreferences(),
    ...preferences
  };
  
  await this.save();
};

module.exports = User;
