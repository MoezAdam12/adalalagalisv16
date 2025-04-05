const express = require('express');
const router = express.Router();
const tenantsController = require('../controllers/tenants.controller');
const { validateTenant } = require('../middleware/validators/tenant.validator');
const { isAdmin } = require('../middleware/auth.middleware');

// Get all tenants (super admin only)
router.get('/', isAdmin, tenantsController.getAllTenants);

// Get tenant by ID
router.get('/:id', isAdmin, tenantsController.getTenantById);

// Create new tenant
router.post('/', isAdmin, validateTenant, tenantsController.createTenant);

// Update tenant
router.put('/:id', isAdmin, validateTenant, tenantsController.updateTenant);

// Delete tenant
router.delete('/:id', isAdmin, tenantsController.deleteTenant);

// Get tenant by subdomain (public)
router.get('/by-subdomain/:subdomain', tenantsController.getTenantBySubdomain);

// Get current tenant settings
router.get('/settings/current', tenantsController.getCurrentTenantSettings);

// Update current tenant settings
router.put('/settings/current', isAdmin, tenantsController.updateCurrentTenantSettings);

module.exports = router;
