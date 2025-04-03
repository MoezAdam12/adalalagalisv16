const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients.controller');
const { validateClient } = require('../middleware/validators/client.validator');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all clients for current tenant
router.get('/', clientsController.getAllClients);

// Get client by ID
router.get('/:id', clientsController.getClientById);

// Create new client
router.post('/', validateClient, clientsController.createClient);

// Update client
router.put('/:id', validateClient, clientsController.updateClient);

// Delete client
router.delete('/:id', authorize(['admin', 'manager']), clientsController.deleteClient);

// Get client contracts
router.get('/:id/contracts', clientsController.getClientContracts);

// Get client documents
router.get('/:id/documents', clientsController.getClientDocuments);

// Get client consultations
router.get('/:id/consultations', clientsController.getClientConsultations);

// Add client note
router.post('/:id/notes', clientsController.addClientNote);

// Get client notes
router.get('/:id/notes', clientsController.getClientNotes);

// Get client categories
router.get('/categories', clientsController.getClientCategories);

// Create client category
router.post('/categories', authorize(['admin', 'manager']), clientsController.createClientCategory);

// Search clients
router.get('/search', clientsController.searchClients);

module.exports = router;
