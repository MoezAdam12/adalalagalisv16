const SubscriptionTier = require('../models/subscription-tier.model');
const Subscription = require('../models/subscription.model');
const Invoice = require('../models/invoice.model');
const PaymentMethod = require('../models/payment-method.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Billing controller for subscription and payment management
 */
class BillingController {
  /**
   * Get all subscription tiers
   */
  async getSubscriptionTiers(req, res) {
    try {
      const { active_only = 'true' } = req.query;
      
      const whereConditions = {};
      if (active_only === 'true') {
        whereConditions.is_active = true;
      }
      
      const tiers = await SubscriptionTier.findAll({
        where: whereConditions,
        order: [['sort_order', 'ASC'], ['price_monthly', 'ASC']]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'SUBSCRIPTION_TIER',
        description: 'Listed subscription tiers',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: tiers
      });
    } catch (error) {
      console.error('Error getting subscription tiers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get subscription tiers',
        error: error.message
      });
    }
  }
  
  /**
   * Get subscription tier by ID
   */
  async getSubscriptionTierById(req, res) {
    try {
      const tierId = req.params.id;
      
      const tier = await SubscriptionTier.findByPk(tierId);
      
      if (!tier) {
        return res.status(404).json({
          success: false,
          message: 'Subscription tier not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'SUBSCRIPTION_TIER',
        entity_id: tierId,
        description: `Viewed subscription tier: ${tier.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: tier
      });
    } catch (error) {
      console.error('Error getting subscription tier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get subscription tier',
        error: error.message
      });
    }
  }
  
  /**
   * Create a new subscription tier
   */
  async createSubscriptionTier(req, res) {
    try {
      const {
        name,
        code,
        description,
        price_monthly,
        price_yearly,
        discount_percentage,
        currency,
        max_users,
        max_storage_gb,
        features,
        is_active,
        is_featured,
        trial_days,
        sort_order
      } = req.body;
      
      // Check if code already exists
      const existingTier = await SubscriptionTier.findOne({
        where: { code }
      });
      
      if (existingTier) {
        return res.status(400).json({
          success: false,
          message: 'Subscription tier code already exists'
        });
      }
      
      // Create tier
      const tier = await SubscriptionTier.create({
        name,
        code,
        description,
        price_monthly,
        price_yearly,
        discount_percentage,
        currency,
        max_users,
        max_storage_gb,
        features,
        is_active,
        is_featured,
        trial_days,
        sort_order,
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'SUBSCRIPTION_TIER',
        entity_id: tier.id,
        description: `Created subscription tier: ${tier.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: req.body
      });
      
      return res.status(201).json({
        success: true,
        message: 'Subscription tier created successfully',
        data: tier
      });
    } catch (error) {
      console.error('Error creating subscription tier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create subscription tier',
        error: error.message
      });
    }
  }
  
  /**
   * Update a subscription tier
   */
  async updateSubscriptionTier(req, res) {
    try {
      const tierId = req.params.id;
      
      // Find tier
      const tier = await SubscriptionTier.findByPk(tierId);
      
      if (!tier) {
        return res.status(404).json({
          success: false,
          message: 'Subscription tier not found'
        });
      }
      
      // Check if code is being changed and already exists
      if (req.body.code && req.body.code !== tier.code) {
        const existingTier = await SubscriptionTier.findOne({
          where: { 
            code: req.body.code,
            id: { [Op.ne]: tierId }
          }
        });
        
        if (existingTier) {
          return res.status(400).json({
            success: false,
            message: 'Subscription tier code already exists'
          });
        }
      }
      
      // Store old values for audit log
      const oldValues = {
        name: tier.name,
        code: tier.code,
        description: tier.description,
        price_monthly: tier.price_monthly,
        price_yearly: tier.price_yearly,
        discount_percentage: tier.discount_percentage,
        currency: tier.currency,
        max_users: tier.max_users,
        max_storage_gb: tier.max_storage_gb,
        features: tier.features,
        is_active: tier.is_active,
        is_featured: tier.is_featured,
        trial_days: tier.trial_days,
        sort_order: tier.sort_order
      };
      
      // Update tier
      await tier.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'SUBSCRIPTION_TIER',
        entity_id: tierId,
        description: `Updated subscription tier: ${tier.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: req.body
      });
      
      return res.status(200).json({
        success: true,
        message: 'Subscription tier updated successfully',
        data: tier
      });
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update subscription tier',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a subscription tier
   */
  async deleteSubscriptionTier(req, res) {
    try {
      const tierId = req.params.id;
      
      // Find tier
      const tier = await SubscriptionTier.findByPk(tierId);
      
      if (!tier) {
        return res.status(404).json({
          success: false,
          message: 'Subscription tier not found'
        });
      }
      
      // Check if tier is in use
      const subscriptionsUsingTier = await Subscription.count({
        where: { tier_id: tierId }
      });
      
      if (subscriptionsUsingTier > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete subscription tier that is in use'
        });
      }
      
      // Store tier data for audit log
      const tierData = {
        id: tier.id,
        name: tier.name,
        code: tier.code,
        price_monthly: tier.price_monthly,
        price_yearly: tier.price_yearly
      };
      
      // Delete tier
      await tier.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'SUBSCRIPTION_TIER',
        entity_id: tierId,
        description: `Deleted subscription tier: ${tierData.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: tierData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Subscription tier deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subscription tier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete subscription tier',
        error: error.message
      });
    }
  }
  
  /**
   * Get tenant subscription
   */
  async getTenantSubscription(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Get active subscription
      const subscription = await Subscription.findOne({
        where: {
          tenant_id: tenantId,
          status: {
            [Op.in]: ['active', 'trial']
          },
          end_date: {
            [Op.gt]: new Date()
          }
        },
        include: [
          {
            model: SubscriptionTier,
            as: 'tier'
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'SUBSCRIPTION',
        entity_id: subscription.id,
        description: 'Viewed tenant subscription',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: subscription
      });
    } catch (error) {
      console.error('Error getting tenant subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get tenant subscription',
        error: error.message
      });
    }
  }
  
  /**
   * Get tenant subscription history
   */
  async getTenantSubscriptionHistory(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Get subscription history
      const subscriptions = await Subscription.findAll({
        where: {
          tenant_id: tenantId
        },
        include: [
          {
            model: SubscriptionTier,
            as: 'tier'
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'SUBSCRIPTION',
        description: 'Listed tenant subscription history',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      console.error('Error getting tenant subscription history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get tenant subscription history',
        error: error.message
      });
    }
  }
  
  /**
   * Subscribe tenant to a tier
   */
  async subscribeTenant(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        tier_id,
        billing_cycle,
        payment_method_id,
        auto_renew = true
      } = req.body;
      
      // Find tier
      const tier = await SubscriptionTier.findByPk(tier_id);
      
      if (!tier) {
        return res.status(404).json({
          success: false,
          message: 'Subscription tier not found'
        });
      }
      
      // Check if tenant already has an active subscription
      const activeSubscription = await Subscription.findOne({
        where: {
          tenant_id: tenantId,
          status: {
            [Op.in]: ['active', 'trial']
          },
          end_date: {
            [Op.gt]: new Date()
          }
        }
      });
      
      if (activeSubscription) {
        return res.status(400).json({
          success: false,
          message: 'Tenant already has an active subscription'
        });
      }
      
      // Calculate subscription details
      const startDate = new Date();
      let endDate;
      let price;
      
      if (billing_cycle === 'yearly') {
        endDate = moment(startDate).add(1, 'year').toDate();
        price = tier.price_yearly;
      } else {
        endDate = moment(startDate).add(1, 'month').toDate();
        price = tier.price_monthly;
      }
      
      // Set trial end date if applicable
      let trialEndDate = null;
      let status = 'active';
      
      if (tier.trial_days > 0) {
        trialEndDate = moment(startDate).add(tier.trial_days, 'days').toDate();
        status = 'trial';
      }
      
      // Create subscription
      const subscription = await Subscription.create({
        tenant_id: tenantId,
        tier_id: tier.id,
        status,
        billing_cycle,
        price_at_purchase: price,
        currency: tier.currency,
        start_date: startDate,
        end_date: endDate,
        trial_end_date: trialEndDate,
        auto_renew,
        payment_method_id,
        next_payment_date: trialEndDate || endDate,
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Generate invoice
      const invoiceNumber = `INV-${moment().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const invoice = await Invoice.create({
        tenant_id: tenantId,
        subscription_id: subscription.id,
        invoice_number: invoiceNumber,
        status: trialEndDate ? 'draft' : 'sent',
        issue_date: startDate,
        due_date: moment(startDate).add(30, 'days').toDate(),
        subtotal: price,
        tax_amount: 0, // Calculate tax if needed
        tax_percentage: 0,
        discount_amount: 0,
        total: price,
        currency: tier.currency,
        notes: `Subscription to ${tier.name} plan (${billing_cycle})`,
        payment_method: payment_method_id ? 'card' : null,
        items: [
          {
            description: `${tier.name} subscription (${billing_cycle})`,
            quantity: 1,
            unit_price: price,
            amount: price
          }
        ],
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'SUBSCRIPTION',
        entity_id: subscription.id,
        description: `Subscribed tenant to tier: ${tier.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: {
          tier_id,
          billing_cycle,
          payment_method_id,
          auto_renew,
          status,
          start_date: startDate,
          end_date: endDate,
          trial_end_date: trialEndDate
        }
      });
      
      return res.status(201).json({
        success: true,
        message: 'Tenant subscribed successfully',
        data: {
          subscription,
          invoice
        }
      });
    } catch (error) {
      console.error('Error subscribing tenant:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to subscribe tenant',
        error: error.message
      });
    }
  }
  
  /**
   * Cancel tenant subscription
   */
  async cancelSubscription(req, res) {
    try {
      const tenantId = req.tenantId;
      const { subscription_id, cancellation_reason } = req.body;
      
      // Find subscription
      const subscription = await Subscription.findOne({
        where: {
          id: subscription_id,
          tenant_id: tenantId,
          status: {
            [Op.in]: ['active', 'trial']
          }
        }
      });
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Active subscription not found'
        });
      }
      
      // Store old values for audit log
      const oldValues = {
        status: subscription.status,
        auto_renew: subscription.auto_renew,
        canceled_at: subscription.canceled_at,
        cancellation_reason: subscription.cancellation_reason
      };
      
      // Update subscription
      await subscription.update({
        status: 'canceled',
        auto_renew: false,
        canceled_at: new Date(),
        cancellation_reason,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'SUBSCRIPTION',
        entity_id: subscription_id,
        description: 'Canceled tenant subscription',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: {
          status: 'canceled',
          auto_renew: false,
          canceled_at: new Date(),
          cancellation_reason
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Subscription canceled successfully',
        data: subscription
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error.message
      });
    }
  }
  
  /**
   * Get tenant invoices
   */
  async getTenantInvoices(req, res) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 10, status } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter conditions
      const whereConditions = { tenant_id: tenantId };
      
      if (status) {
        whereConditions.status = status;
      }
      
      // Query with pagination
      const { count, rows: invoices } = await Invoice.findAndCountAll({
        where: whereConditions,
        order: [['issue_date', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'INVOICE',
        description: 'Listed tenant invoices',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: {
          invoices,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting tenant invoices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get tenant invoices',
        error: error.message
      });
    }
  }
  
  /**
   * Get invoice by ID
   */
  async getInvoiceById(req, res) {
    try {
      const tenantId = req.tenantId;
      const invoiceId = req.params.id;
      
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          tenant_id: tenantId
        }
      });
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'INVOICE',
        entity_id: invoiceId,
        description: `Viewed invoice: ${invoice.invoice_number}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Error getting invoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get invoice',
        error: error.message
      });
    }
  }
  
  /**
   * Get tenant payment methods
   */
  async getTenantPaymentMethods(req, res) {
    try {
      const tenantId = req.tenantId;
      
      const paymentMethods = await PaymentMethod.findAll({
        where: {
          tenant_id: tenantId,
          is_active: true
        },
        order: [
          ['is_default', 'DESC'],
          ['created_at', 'DESC']
        ]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'PAYMENT_METHOD',
        description: 'Listed tenant payment methods',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      console.error('Error getting tenant payment methods:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get tenant payment methods',
        error: error.message
      });
    }
  }
  
  /**
   * Add payment method
   */
  async addPaymentMethod(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        type,
        is_default,
        nickname,
        holder_name,
        last_four,
        card_type,
        expiry_month,
        expiry_year,
        bank_name,
        account_last_four,
        gateway,
        gateway_payment_method_id,
        gateway_customer_id,
        billing_address
      } = req.body;
      
      // If setting as default, unset any existing default
      if (is_default) {
        await PaymentMethod.update(
          { is_default: false },
          {
            where: {
              tenant_id: tenantId,
              is_default: true
            }
          }
        );
      }
      
      // Create payment method
      const paymentMethod = await PaymentMethod.create({
        tenant_id: tenantId,
        type,
        is_default: is_default || false,
        nickname,
        holder_name,
        last_four,
        card_type,
        expiry_month,
        expiry_year,
        bank_name,
        account_last_four,
        gateway,
        gateway_payment_method_id,
        gateway_customer_id,
        billing_address,
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'PAYMENT_METHOD',
        entity_id: paymentMethod.id,
        description: `Added payment method: ${type}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: {
          type,
          is_default,
          nickname,
          holder_name,
          last_four,
          card_type,
          expiry_month,
          expiry_year,
          bank_name,
          account_last_four,
          gateway,
          gateway_payment_method_id,
          gateway_customer_id
        }
      });
      
      return res.status(201).json({
        success: true,
        message: 'Payment method added successfully',
        data: paymentMethod
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add payment method',
        error: error.message
      });
    }
  }
  
  /**
   * Update payment method
   */
  async updatePaymentMethod(req, res) {
    try {
      const tenantId = req.tenantId;
      const paymentMethodId = req.params.id;
      
      // Find payment method
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          id: paymentMethodId,
          tenant_id: tenantId
        }
      });
      
      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }
      
      // If setting as default, unset any existing default
      if (req.body.is_default) {
        await PaymentMethod.update(
          { is_default: false },
          {
            where: {
              tenant_id: tenantId,
              is_default: true,
              id: { [Op.ne]: paymentMethodId }
            }
          }
        );
      }
      
      // Store old values for audit log
      const oldValues = {
        is_default: paymentMethod.is_default,
        nickname: paymentMethod.nickname,
        holder_name: paymentMethod.holder_name,
        expiry_month: paymentMethod.expiry_month,
        expiry_year: paymentMethod.expiry_year,
        billing_address: paymentMethod.billing_address
      };
      
      // Update payment method
      await paymentMethod.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'PAYMENT_METHOD',
        entity_id: paymentMethodId,
        description: `Updated payment method: ${paymentMethod.type}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: req.body
      });
      
      return res.status(200).json({
        success: true,
        message: 'Payment method updated successfully',
        data: paymentMethod
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update payment method',
        error: error.message
      });
    }
  }
  
  /**
   * Delete payment method
   */
  async deletePaymentMethod(req, res) {
    try {
      const tenantId = req.tenantId;
      const paymentMethodId = req.params.id;
      
      // Find payment method
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          id: paymentMethodId,
          tenant_id: tenantId
        }
      });
      
      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }
      
      // Check if payment method is default
      if (paymentMethod.is_default) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete default payment method'
        });
      }
      
      // Check if payment method is in use
      const subscriptionsUsingMethod = await Subscription.count({
        where: {
          payment_method_id: paymentMethodId,
          status: {
            [Op.in]: ['active', 'trial']
          }
        }
      });
      
      if (subscriptionsUsingMethod > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete payment method that is in use'
        });
      }
      
      // Store payment method data for audit log
      const paymentMethodData = {
        id: paymentMethod.id,
        type: paymentMethod.type,
        nickname: paymentMethod.nickname,
        last_four: paymentMethod.last_four
      };
      
      // Delete payment method
      await paymentMethod.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'PAYMENT_METHOD',
        entity_id: paymentMethodId,
        description: `Deleted payment method: ${paymentMethodData.type}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: paymentMethodData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete payment method',
        error: error.message
      });
    }
  }
}

module.exports = new BillingController();
