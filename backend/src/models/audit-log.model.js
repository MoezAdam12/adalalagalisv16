const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AuditLog model for tracking changes across the system
 */
class AuditLog extends Model {}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.UUID,
    references: {
      model: 'tenant_management.tenants',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    references: {
      model: 'tenant_management.users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.UUID
  },
  old_values: {
    type: DataTypes.JSONB
  },
  new_values: {
    type: DataTypes.JSONB
  },
  ip_address: {
    type: DataTypes.STRING(50)
  },
  user_agent: {
    type: DataTypes.TEXT
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'audit_log',
  tableName: 'shared.audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = AuditLog;
