const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Subscription model for tenant subscription management
 */
class Subscription extends Model {}

Subscription.init({
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
  tier_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'billing.subscription_tiers',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'tier_id is required' },
      notEmpty: { msg: 'tier_id cannot be empty' }
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'canceled', 'expired', 'trial', 'past_due', 'unpaid']],
        msg: 'Status must be one of: active, canceled, expired, trial, past_due, unpaid'
      }
    }
  },
  billing_cycle: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'monthly',
    validate: {
      isIn: {
        args: [['monthly', 'yearly']],
        msg: 'Billing cycle must be either monthly or yearly'
      }
    }
  },
  price_at_purchase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Price at purchase is required' },
      isDecimal: { msg: 'Price at purchase must be a valid decimal' }
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: { msg: 'Start date is required' }
    }
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: { msg: 'End date is required' }
    }
  },
  trial_end_date: {
    type: DataTypes.DATE
  },
  auto_renew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  canceled_at: {
    type: DataTypes.DATE
  },
  cancellation_reason: {
    type: DataTypes.TEXT
  },
  payment_method_id: {
    type: DataTypes.UUID
  },
  payment_gateway: {
    type: DataTypes.STRING(50)
  },
  gateway_subscription_id: {
    type: DataTypes.STRING(255)
  },
  gateway_customer_id: {
    type: DataTypes.STRING(255)
  },
  last_payment_date: {
    type: DataTypes.DATE
  },
  next_payment_date: {
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
  created_by: {
    type: DataTypes.UUID
  },
  updated_by: {
    type: DataTypes.UUID
  }
}, {
  sequelize,
  modelName: 'subscription',
  tableName: 'billing.subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['tier_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['end_date']
    }
  ]
});

module.exports = Subscription;
