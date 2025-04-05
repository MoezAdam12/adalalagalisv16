const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * UITheme model for UI customization and white labeling
 */
class UITheme extends Model {}

UITheme.init({
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
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'Theme name is required' },
      notEmpty: { msg: 'Theme name cannot be empty' }
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
  // Primary colors
  primary_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#3f51b5',
    validate: {
      notNull: { msg: 'Primary color is required' },
      notEmpty: { msg: 'Primary color cannot be empty' }
    }
  },
  secondary_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#f50057',
    validate: {
      notNull: { msg: 'Secondary color is required' },
      notEmpty: { msg: 'Secondary color cannot be empty' }
    }
  },
  // Text colors
  text_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#212121',
    validate: {
      notNull: { msg: 'Text color is required' },
      notEmpty: { msg: 'Text color cannot be empty' }
    }
  },
  text_light_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#ffffff',
    validate: {
      notNull: { msg: 'Text light color is required' },
      notEmpty: { msg: 'Text light color cannot be empty' }
    }
  },
  // Background colors
  background_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#ffffff',
    validate: {
      notNull: { msg: 'Background color is required' },
      notEmpty: { msg: 'Background color cannot be empty' }
    }
  },
  background_light_color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#f5f5f5',
    validate: {
      notNull: { msg: 'Background light color is required' },
      notEmpty: { msg: 'Background light color cannot be empty' }
    }
  },
  // Logo settings
  logo_url: {
    type: DataTypes.STRING(255)
  },
  logo_small_url: {
    type: DataTypes.STRING(255)
  },
  favicon_url: {
    type: DataTypes.STRING(255)
  },
  // Font settings
  font_family: {
    type: DataTypes.STRING(100),
    defaultValue: 'Roboto, "Helvetica Neue", sans-serif'
  },
  font_size_base: {
    type: DataTypes.STRING(10),
    defaultValue: '14px'
  },
  // Custom CSS
  custom_css: {
    type: DataTypes.TEXT
  },
  // Navigation settings
  sidebar_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#ffffff'
  },
  header_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#ffffff'
  },
  // Button styles
  button_border_radius: {
    type: DataTypes.STRING(10),
    defaultValue: '4px'
  },
  // Additional settings
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
  modelName: 'ui_theme',
  tableName: 'settings.ui_themes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_default']
    }
  ]
});

module.exports = UITheme;
