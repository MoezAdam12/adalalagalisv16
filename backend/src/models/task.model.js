const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');

/**
 * Task model for managing legal tasks and workflows
 */
class Task extends Model {}

Task.init({
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
    }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_management.users',
      key: 'id'
    }
  },
  assigned_to: {
    type: DataTypes.UUID,
    references: {
      model: 'tenant_management.users',
      key: 'id'
    }
  },
  client_id: {
    type: DataTypes.UUID,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  contract_id: {
    type: DataTypes.UUID,
    references: {
      model: 'contracts',
      key: 'id'
    }
  },
  workflow_id: {
    type: DataTypes.UUID,
    references: {
      model: 'workflows',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    allowNull: false
  },
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'medium',
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100)
  },
  due_date: {
    type: DataTypes.DATE
  },
  start_date: {
    type: DataTypes.DATE
  },
  completion_date: {
    type: DataTypes.DATE
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(8, 2)
  },
  actual_hours: {
    type: DataTypes.DECIMAL(8, 2)
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reminder_date: {
    type: DataTypes.DATE
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  metadata: {
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
  }
}, {
  sequelize,
  modelName: 'task',
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['contract_id']
    },
    {
      fields: ['workflow_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['due_date']
    }
  ]
});

// Define associations
Task.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

module.exports = Task;
