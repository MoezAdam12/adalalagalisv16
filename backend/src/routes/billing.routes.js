const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Subscription tiers routes
router.get('/tiers', authMiddleware.hasPermission('billing:read'), billingController.getSubscriptionTiers);
router.get('/tiers/:id', authMiddleware.hasPermission('billing:read'), billingController.getSubscriptionTierById);
router.post('/tiers', authMiddleware.hasPermission('billing:update'), billingController.createSubscriptionTier);
router.put('/tiers/:id', authMiddleware.hasPermission('billing:update'), billingController.updateSubscriptionTier);
router.delete('/tiers/:id', authMiddleware.hasPermission('billing:update'), billingController.deleteSubscriptionTier);

// Tenant subscription routes
router.get('/subscription', authMiddleware.hasPermission('billing:read'), billingController.getTenantSubscription);
router.get('/subscription/history', authMiddleware.hasPermission('billing:read'), billingController.getTenantSubscriptionHistory);
router.post('/subscribe', authMiddleware.hasPermission('billing:update'), billingController.subscribeTenant);
router.post('/subscription/cancel', authMiddleware.hasPermission('billing:update'), billingController.cancelSubscription);

// Invoice routes
router.get('/invoices', authMiddleware.hasPermission('billing:read'), billingController.getTenantInvoices);
router.get('/invoices/:id', authMiddleware.hasPermission('billing:read'), billingController.getInvoiceById);

// Payment method routes
router.get('/payment-methods', authMiddleware.hasPermission('billing:read'), billingController.getTenantPaymentMethods);
router.post('/payment-methods', authMiddleware.hasPermission('billing:update'), billingController.addPaymentMethod);
router.put('/payment-methods/:id', authMiddleware.hasPermission('billing:update'), billingController.updatePaymentMethod);
router.delete('/payment-methods/:id', authMiddleware.hasPermission('billing:update'), billingController.deletePaymentMethod);

module.exports = router;
