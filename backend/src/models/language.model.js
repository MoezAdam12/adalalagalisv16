const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Language model for managing supported languages in the application
 */
class Language extends Model {}

Language.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Language code is required' },
      notEmpty: { msg: 'Language code cannot be empty' }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Language name is required' },
      notEmpty: { msg: 'Language name cannot be empty' }
    }
  },
  native_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Native language name is required' },
      notEmpty: { msg: 'Native language name cannot be empty' }
    }
  },
  flag_icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  text_direction: {
    type: DataTypes.ENUM('ltr', 'rtl'),
    defaultValue: 'ltr',
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  modelName: 'language',
  tableName: 'settings.languages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['code'],
      unique: true,
      name: 'languages_code_idx'
    },
    {
      fields: ['is_active'],
      name: 'languages_is_active_idx'
    },
    {
      fields: ['is_default'],
      name: 'languages_is_default_idx'
    },
    {
      fields: ['sort_order'],
      name: 'languages_sort_order_idx'
    }
  ]
});

module.exports = Language;
