const express = require('express');
const router = express.Router();
const contractsController = require('../controllers/contracts.controller');
const { validateContract } = require('../middleware/validators/contract.validator');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all contracts for current tenant
router.get('/', contractsController.getAllContracts);

// Get contract by ID
router.get('/:id', contractsController.getContractById);

// Create new contract
router.post('/', validateContract, contractsController.createContract);

// Update contract
router.put('/:id', validateContract, contractsController.updateContract);

// Delete contract
router.delete('/:id', authorize(['admin', 'manager']), contractsController.deleteContract);

// Get contract versions
router.get('/:id/versions', contractsController.getContractVersions);

// Get specific contract version
router.get('/:id/versions/:versionId', contractsController.getContractVersion);

// Create contract from template
router.post('/from-template/:templateId', contractsController.createFromTemplate);

// Generate contract PDF
router.get('/:id/pdf', contractsController.generatePdf);

// Send contract for electronic signature
router.post('/:id/send-for-signature', contractsController.sendForSignature);

// Check signature status
router.get('/:id/signature-status', contractsController.checkSignatureStatus);

// Record payment for contract
router.post('/:id/payments', contractsController.recordPayment);

// Get contract payments
router.get('/:id/payments', contractsController.getContractPayments);

// Get contract templates
router.get('/templates', contractsController.getContractTemplates);

// Create contract template
router.post('/templates', authorize(['admin', 'manager']), contractsController.createContractTemplate);

module.exports = router;
