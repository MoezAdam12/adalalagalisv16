const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant.model');
const User = require('./user.model');
const Task = require('./task.model');

/**
 * Workflow model for managing legal workflows and processes
 */
class Workflow extends Model {}

Workflow.init({
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  workflow_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    allowNull: false
  },
  steps: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  is_template: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  category: {
    type: DataTypes.STRING(100)
  },
  estimated_duration_days: {
    type: DataTypes.INTEGER
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
  modelName: 'workflow',
  tableName: 'workflows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['workflow_type']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
Workflow.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Workflow.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Workflow.hasMany(Task, { foreignKey: 'workflow_id', as: 'tasks' });

module.exports = Workflow;
