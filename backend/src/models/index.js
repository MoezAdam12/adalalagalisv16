const Contract = require('./contract.model');
const ContractTemplate = require('./contract-template.model');
const ContractPayment = require('./contract-payment.model');
const ContractVersion = require('./contract-version.model');
const Document = require('./document.model');
const Client = require('./client.model');
const Task = require('./task.model');
const Workflow = require('./workflow.model');
const Tenant = require('./tenant.model');
const User = require('./user.model');
const TenantSettings = require('./tenant-settings.model');
const AuditLog = require('./audit-log.model');

module.exports = {
  Contract,
  ContractTemplate,
  ContractPayment,
  ContractVersion,
  Document,
  Client,
  Task,
  Workflow,
  Tenant,
  User,
  TenantSettings,
  AuditLog
};
