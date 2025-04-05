const { Tenant, TenantSettings, User } = require('../models');
const { generateAccountNumber } = require('../utils/tenant.utils');

/**
 * Tenants controller for handling tenant operations
 */
class TenantsController {
  /**
   * Get all tenants (super admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllTenants(req, res) {
    try {
      const tenants = await Tenant.findAll({
        attributes: ['id', 'account_number', 'name', 'subdomain', 'status', 'subscription_plan', 
                    'subscription_start_date', 'subscription_end_date', 'contact_email', 
                    'contact_phone', 'address', 'city', 'country', 'created_at']
      });
      
      res.status(200).json(tenants);
    } catch (error) {
      console.error('Get all tenants error:', error);
      res.status(500).json({ message: 'An error occurred while fetching tenants' });
    }
  }
  
  /**
   * Get tenant by ID (super admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTenantById(req, res) {
    try {
      const { id } = req.params;
      
      const tenant = await Tenant.findByPk(id, {
        include: [
          { model: TenantSettings, as: 'settings' }
        ]
      });
      
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      res.status(200).json(tenant);
    } catch (error) {
      console.error('Get tenant by ID error:', error);
      res.status(500).json({ message: 'An error occurred while fetching tenant' });
    }
  }
  
  /**
   * Create new tenant (super admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTenant(req, res) {
    try {
      const { 
        name, subdomain, subscription_plan, contact_email, contact_phone,
        address, city, country, admin_email, admin_password, admin_first_name, admin_last_name
      } = req.body;
      
      // Check if subdomain is already taken
      const existingTenant = await Tenant.findOne({ where: { subdomain } });
      if (existingTenant) {
        return res.status(400).json({ message: 'Subdomain is already taken' });
      }
      
      // Generate account number
      const account_number = await generateAccountNumber();
      
      // Create tenant
      const tenant = await Tenant.create({
        name,
        subdomain,
        account_number,
        subscription_plan,
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        contact_email,
        contact_phone,
        address,
        city,
        country,
        status: 'active'
      });
      
      // Create tenant settings
      await TenantSettings.create({
        tenant_id: tenant.id,
        default_language: 'ar',
        enabled_modules: ['contracts', 'documents', 'clients', 'tasks', 'consultations']
      });
      
      // Create admin user for the tenant
      if (admin_email && admin_password) {
        const bcrypt = require('bcryptjs');
        const passwordHash = bcrypt.hashSync(admin_password, 10);
        
        await User.create({
          email: admin_email,
          password_hash: passwordHash,
          first_name: admin_first_name || 'Admin',
          last_name: admin_last_name || 'User',
          role: 'admin',
          tenant_id: tenant.id,
          language: 'ar',
          status: 'active'
        });
      }
      
      res.status(201).json({
        message: 'Tenant created successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          account_number: tenant.account_number
        }
      });
    } catch (error) {
      console.error('Create tenant error:', error);
      res.status(500).json({ message: 'An error occurred while creating tenant' });
    }
  }
  
  /**
   * Update tenant (super admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, subscription_plan, subscription_end_date, status,
        contact_email, contact_phone, address, city, country
      } = req.body;
      
      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      // Update tenant
      await tenant.update({
        name,
        subscription_plan,
        subscription_end_date,
        status,
        contact_email,
        contact_phone,
        address,
        city,
        country
      });
      
      res.status(200).json({
        message: 'Tenant updated successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status
        }
      });
    } catch (error) {
      console.error('Update tenant error:', error);
      res.status(500).json({ message: 'An error occurred while updating tenant' });
    }
  }
  
  /**
   * Delete tenant (super admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteTenant(req, res) {
    try {
      const { id } = req.params;
      
      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      // Delete tenant (this will cascade delete all related records)
      await tenant.destroy();
      
      res.status(200).json({ message: 'Tenant deleted successfully' });
    } catch (error) {
      console.error('Delete tenant error:', error);
      res.status(500).json({ message: 'An error occurred while deleting tenant' });
    }
  }
  
  /**
   * Get tenant by subdomain (public)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTenantBySubdomain(req, res) {
    try {
      const { subdomain } = req.params;
      
      const tenant = await Tenant.findOne({
        where: { subdomain },
        attributes: ['id', 'name', 'subdomain', 'status', 'logo_url']
      });
      
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      if (tenant.status !== 'active') {
        return res.status(403).json({ message: 'Tenant is inactive or suspended' });
      }
      
      res.status(200).json(tenant);
    } catch (error) {
      console.error('Get tenant by subdomain error:', error);
      res.status(500).json({ message: 'An error occurred while fetching tenant' });
    }
  }
  
  /**
   * Get current tenant settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCurrentTenantSettings(req, res) {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant information is required' });
      }
      
      const settings = await TenantSettings.findOne({
        where: { tenant_id: tenantId }
      });
      
      if (!settings) {
        return res.status(404).json({ message: 'Tenant settings not found' });
      }
      
      res.status(200).json(settings);
    } catch (error) {
      console.error('Get current tenant settings error:', error);
      res.status(500).json({ message: 'An error occurred while fetching tenant settings' });
    }
  }
  
  /**
   * Update current tenant settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateCurrentTenantSettings(req, res) {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant information is required' });
      }
      
      const { 
        default_language, enabled_modules, theme_settings, notification_settings
      } = req.body;
      
      const settings = await TenantSettings.findOne({
        where: { tenant_id: tenantId }
      });
      
      if (!settings) {
        return res.status(404).json({ message: 'Tenant settings not found' });
      }
      
      // Update settings
      await settings.update({
        default_language,
        enabled_modules,
        theme_settings,
        notification_settings
      });
      
      res.status(200).json({
        message: 'Tenant settings updated successfully',
        settings
      });
    } catch (error) {
      console.error('Update current tenant settings error:', error);
      res.status(500).json({ message: 'An error occurred while updating tenant settings' });
    }
  }
}

module.exports = new TenantsController();
