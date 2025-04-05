const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Invoice model for billing management
 */
class Invoice extends Model {}

Invoice.init({
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
  subscription_id: {
    type: DataTypes.UUID,
    references: {
      model: 'billing.subscriptions',
      key: 'id'
    }
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Invoice number is required' },
      notEmpty: { msg: 'Invoice number cannot be empty' }
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: {
        args: [['draft', 'sent', 'paid', 'overdue', 'canceled', 'refunded']],
        msg: 'Status must be one of: draft, sent, paid, overdue, canceled, refunded'
      }
    }
  },
  issue_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: { msg: 'Issue date is required' }
    }
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: { msg: 'Due date is required' }
    }
  },
  payment_date: {
    type: DataTypes.DATE
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Subtotal is required' },
      isDecimal: { msg: 'Subtotal must be a valid decimal' }
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: { msg: 'Tax amount must be a valid decimal' }
    }
  },
  tax_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: { msg: 'Tax percentage must be a valid decimal' }
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: { msg: 'Discount amount must be a valid decimal' }
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Total is required' },
      isDecimal: { msg: 'Total must be a valid decimal' }
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR'
  },
  notes: {
    type: DataTypes.TEXT
  },
  payment_method: {
    type: DataTypes.STRING(50)
  },
  payment_reference: {
    type: DataTypes.STRING(255)
  },
  billing_address: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  pdf_url: {
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
  modelName: 'invoice',
  tableName: 'billing.invoices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['subscription_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['issue_date']
    },
    {
      fields: ['due_date']
    }
  ]
});

module.exports = Invoice;
