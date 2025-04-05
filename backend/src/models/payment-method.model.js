const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PaymentMethod model for billing management
 */
class PaymentMethod extends Model {}

PaymentMethod.init({
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
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: {
        args: [['credit_card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay', 'other']],
        msg: 'Type must be one of: credit_card, bank_transfer, paypal, apple_pay, google_pay, other'
      }
    }
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nickname: {
    type: DataTypes.STRING(100)
  },
  holder_name: {
    type: DataTypes.STRING(100)
  },
  // For credit cards
  last_four: {
    type: DataTypes.STRING(4)
  },
  card_type: {
    type: DataTypes.STRING(20)
  },
  expiry_month: {
    type: DataTypes.INTEGER
  },
  expiry_year: {
    type: DataTypes.INTEGER
  },
  // For bank accounts
  bank_name: {
    type: DataTypes.STRING(100)
  },
  account_last_four: {
    type: DataTypes.STRING(4)
  },
  // For payment gateways
  gateway: {
    type: DataTypes.STRING(50)
  },
  gateway_payment_method_id: {
    type: DataTypes.STRING(255)
  },
  gateway_customer_id: {
    type: DataTypes.STRING(255)
  },
  // Metadata
  billing_address: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  modelName: 'payment_method',
  tableName: 'billing.payment_methods',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['gateway_payment_method_id']
    },
    {
      fields: ['gateway_customer_id']
    }
  ]
});

module.exports = PaymentMethod;
