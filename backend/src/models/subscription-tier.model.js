const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * SubscriptionTier model for billing and subscription management
 */
class SubscriptionTier extends Model {}

SubscriptionTier.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'Tier name is required' },
      notEmpty: { msg: 'Tier name cannot be empty' }
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Tier code is required' },
      notEmpty: { msg: 'Tier code cannot be empty' }
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  price_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Monthly price is required' },
      isDecimal: { msg: 'Monthly price must be a valid decimal' }
    }
  },
  price_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Yearly price is required' },
      isDecimal: { msg: 'Yearly price must be a valid decimal' }
    }
  },
  discount_percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Discount percentage cannot be negative' },
      max: { args: [100], msg: 'Discount percentage cannot exceed 100' }
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR'
  },
  max_users: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Maximum users is required' },
      isInt: { msg: 'Maximum users must be an integer' }
    }
  },
  max_storage_gb: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Maximum storage is required' },
      isInt: { msg: 'Maximum storage must be an integer' }
    }
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trial_days: {
    type: DataTypes.INTEGER,
    defaultValue: 14
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
  modelName: 'subscription_tier',
  tableName: 'billing.subscription_tiers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SubscriptionTier;
