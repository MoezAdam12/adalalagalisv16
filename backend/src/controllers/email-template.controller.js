const EmailTemplate = require('../models/email-template.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');
const handlebars = require('handlebars');

/**
 * EmailTemplate controller for managing email templates
 */
class EmailTemplateController {
  /**
   * Get all email templates
   */
  async getEmailTemplates(req, res) {
    try {
      const tenantId = req.tenantId;
      const { category, is_active, search } = req.query;
      
      const whereClause = {
        tenant_id: tenantId
      };
      
      if (category) {
        whereClause.category = category;
      }
      
      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const templates = await EmailTemplate.findAll({
        where: whereClause,
        order: [
          ['category', 'ASC'],
          ['name', 'ASC']
        ]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'EMAIL_TEMPLATES',
        description: 'Viewed email templates',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error getting email templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get email templates',
        error: error.message
      });
    }
  }
  
  /**
   * Get email template by ID
   */
  async getEmailTemplateById(req, res) {
    try {
      const tenantId = req.tenantId;
      const templateId = req.params.id;
      
      const template = await EmailTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: tenantId
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'EMAIL_TEMPLATE',
        entity_id: template.id,
        description: `Viewed email template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error getting email template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get email template',
        error: error.message
      });
    }
  }
  
  /**
   * Create new email template
   */
  async createEmailTemplate(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        name,
        code,
        description,
        subject,
        body_html,
        body_text,
        variables,
        category,
        is_active
      } = req.body;
      
      // Validate required fields
      if (!name || !code || !subject || !body_html || !category) {
        return res.status(400).json({
          success: false,
          message: 'Name, code, subject, HTML body, and category are required'
        });
      }
      
      // Check if template with same code already exists
      const existingTemplate = await EmailTemplate.findOne({
        where: {
          tenant_id: tenantId,
          code
        }
      });
      
      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: `Email template with code '${code}' already exists`
        });
      }
      
      // Create template
      const template = await EmailTemplate.create({
        tenant_id: tenantId,
        name,
        code,
        description,
        subject,
        body_html,
        body_text: body_text || this.convertHtmlToText(body_html),
        variables: variables || [],
        category,
        is_active: is_active !== undefined ? is_active : true,
        is_default: false,
        is_system: false,
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'EMAIL_TEMPLATE',
        entity_id: template.id,
        description: `Created email template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Error creating email template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create email template',
        error: error.message
      });
    }
  }
  
  /**
   * Update email template
   */
  async updateEmailTemplate(req, res) {
    try {
      const tenantId = req.tenantId;
      const templateId = req.params.id;
      const {
        name,
        description,
        subject,
        body_html,
        body_text,
        variables,
        category,
        is_active
      } = req.body;
      
      // Find template
      const template = await EmailTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: tenantId
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }
      
      // Check if template is system template
      if (template.is_system) {
        return res.status(403).json({
          success: false,
          message: 'System templates cannot be modified'
        });
      }
      
      // Store old values for audit log
      const oldValues = {
        name: template.name,
        description: template.description,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text,
        variables: template.variables,
        category: template.category,
        is_active: template.is_active
      };
      
      // Update template
      await template.update({
        name: name || template.name,
        description: description !== undefined ? description : template.description,
        subject: subject || template.subject,
        body_html: body_html || template.body_html,
        body_text: body_text || (body_html ? this.convertHtmlToText(body_html) : template.body_text),
        variables: variables || template.variables,
        category: category || template.category,
        is_active: is_active !== undefined ? is_active : template.is_active,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'EMAIL_TEMPLATE',
        entity_id: template.id,
        description: `Updated email template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: {
          name: template.name,
          description: template.description,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          variables: template.variables,
          category: template.category,
          is_active: template.is_active
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Email template updated successfully',
        data: template
      });
    } catch (error) {
      console.error('Error updating email template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update email template',
        error: error.message
      });
    }
  }
  
  /**
   * Delete email template
   */
  async deleteEmailTemplate(req, res) {
    try {
      const tenantId = req.tenantId;
      const templateId = req.params.id;
      
      // Find template
      const template = await EmailTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: tenantId
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }
      
      // Check if template is system template
      if (template.is_system) {
        return res.status(403).json({
          success: false,
          message: 'System templates cannot be deleted'
        });
      }
      
      // Check if template is default template
      if (template.is_default) {
        return res.status(403).json({
          success: false,
          message: 'Default templates cannot be deleted'
        });
      }
      
      // Store template data for audit log
      const templateData = {
        id: template.id,
        name: template.name,
        code: template.code,
        category: template.category
      };
      
      // Delete template
      await template.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'EMAIL_TEMPLATE',
        entity_id: templateId,
        description: `Deleted email template: ${templateData.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: templateData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Email template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting email template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete email template',
        error: error.message
      });
    }
  }
  
  /**
   * Set template as default
   */
  async setDefaultTemplate(req, res) {
    try {
      const tenantId = req.tenantId;
      const templateId = req.params.id;
      
      // Find template
      const template = await EmailTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: tenantId
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }
      
      // Find current default template for this code
      const currentDefault = await EmailTemplate.findOne({
        where: {
          tenant_id: tenantId,
          code: template.code,
          is_default: true
        }
      });
      
      // Begin transaction
      const transaction = await sequelize.transaction();
      
      try {
        // If there's a current default, unset it
        if (currentDefault && currentDefault.id !== template.id) {
          await currentDefault.update({
            is_default: false,
            updated_by: req.userId,
            updated_at: new Date()
          }, { transaction });
          
          // Log audit for unsetting previous default
          await AuditLog.create({
            tenant_id: tenantId,
            user_id: req.userId,
            action: 'UPDATE',
            entity_type: 'EMAIL_TEMPLATE',
            entity_id: currentDefault.id,
            description: `Unset default status for email template: ${currentDefault.name}`,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            old_values: { is_default: true },
            new_values: { is_default: false }
          }, { transaction });
        }
        
        // Set new template as default
        await template.update({
          is_default: true,
          updated_by: req.userId,
          updated_at: new Date()
        }, { transaction });
        
        // Log audit for setting new default
        await AuditLog.create({
          tenant_id: tenantId,
          user_id: req.userId,
          action: 'UPDATE',
          entity_type: 'EMAIL_TEMPLATE',
          entity_id: template.id,
          description: `Set as default email template: ${template.name}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          old_values: { is_default: template.is_default },
          new_values: { is_default: true }
        }, { transaction });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(200).json({
          success: true,
          message: 'Email template set as default successfully',
          data: template
        });
      } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to set default template',
        error: error.message
      });
    }
  }
  
  /**
   * Preview email template with test data
   */
  async previewEmailTemplate(req, res) {
    try {
      const tenantId = req.tenantId;
      const templateId = req.params.id;
      const { test_data } = req.body;
      
      // Find template
      const template = await EmailTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: tenantId
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }
      
      // Generate test data if not provided
      const testData = test_data || this.generateTestData(template.variables);
      
      // Compile template
      const compiledSubject = this.compileTemplate(template.subject, testData);
      const compiledHtml = this.compileTemplate(template.body_html, testData);
      const compiledText = this.compileTemplate(template.body_text || '', testData);
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'EMAIL_TEMPLATE',
        entity_id: template.id,
        description: `Previewed email template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: {
          subject: compiledSubject,
          body_html: compiledHtml,
          body_text: compiledText,
          test_data: testData
        }
      });
    } catch (error) {
      console.error('Error previewing email template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to preview email template',
        error: error.message
      });
    }
  }
  
  /**
   * Get available email template categories
   */
  async getEmailTemplateCategories(req, res) {
    try {
      const categories = [
        { value: 'authentication', label: 'المصادقة' },
        { value: 'notification', label: 'الإشعارات' },
        { value: 'billing', label: 'الفوترة' },
        { value: 'marketing', label: 'التسويق' },
        { value: 'system', label: 'النظام' },
        { value: 'other', label: 'أخرى' }
      ];
      
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error getting email template categories:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get email template categories',
        error: error.message
      });
    }
  }
  
  /**
   * Get system email templates
   */
  async getSystemEmailTemplates(req, res) {
    try {
      const systemTemplates = [
        {
          code: 'welcome_email',
          name: 'Welcome Email',
          description: 'Sent to new users when they register',
          subject: 'Welcome to {{company_name}}',
          body_html: '<h1>Welcome to {{company_name}}</h1><p>Dear {{user_name}},</p><p>Thank you for registering with us. Your account has been created successfully.</p><p>You can now log in using your email and password.</p><p>Best regards,<br>The {{company_name}} Team</p>',
          variables: ['company_name', 'user_name'],
          category: 'authentication'
        },
        {
          code: 'password_reset',
          name: 'Password Reset',
          description: 'Sent when a user requests a password reset',
          subject: 'Password Reset Request',
          body_html: '<h1>Password Reset Request</h1><p>Dear {{user_name}},</p><p>We received a request to reset your password. Please click the link below to reset your password:</p><p><a href="{{reset_link}}">Reset Password</a></p><p>If you did not request a password reset, please ignore this email.</p><p>Best regards,<br>The {{company_name}} Team</p>',
          variables: ['company_name', 'user_name', 'reset_link'],
          category: 'authentication'
        },
        {
          code: 'email_verification',
          name: 'Email Verification',
          description: 'Sent to verify user email address',
          subject: 'Verify Your Email Address',
          body_html: '<h1>Verify Your Email Address</h1><p>Dear {{user_name}},</p><p>Please click the link below to verify your email address:</p><p><a href="{{verification_link}}">Verify Email</a></p><p>If you did not create an account, please ignore this email.</p><p>Best regards,<br>The {{company_name}} Team</p>',
          variables: ['company_name', 'user_name', 'verification_link'],
          category: 'authentication'
        },
        {
          code: 'invoice_created',
          name: 'Invoice Created',
          description: 'Sent when a new invoice is created',
          subject: 'New Invoice #{{invoice_number}}',
          body_html: '<h1>New Invoice</h1><p>Dear {{client_name}},</p><p>A new invoice has been created for you.</p><p><strong>Invoice Number:</strong> {{invoice_number}}<br><strong>Amount:</strong> {{invoice_amount}}<br><strong>Due Date:</strong> {{due_date}}</p><p>You can view and pay your invoice by clicking the link below:</p><p><a href="{{invoice_link}}">View Invoice</a></p><p>Thank you for your business.</p><p>Best regards,<br>The {{company_name}} Team</p>',
          variables: ['company_name', 'client_name', 'invoice_number', 'invoice_amount', 'due_date', 'invoice_link'],
          category: 'billing'
        },
        {
          code: 'payment_received',
          name: 'Payment Received',
          description: 'Sent when a payment is received',
          subject: 'Payment Received - Thank You',
          body_html: '<h1>Payment Received</h1><p>Dear {{client_name}},</p><p>We have received your payment of {{payment_amount}} for invoice #{{invoice_number}}.</p><p>Thank you for your payment.</p><p>Best regards,<br>The {{company_name}} Team</p>',
          variables: ['company_name', 'client_name', 'payment_amount', 'invoice_number'],
          category: 'billing'
        },
        {
          code: 'subscription_renewal',
          name: 'Subscription Renewal',
          description: 'Sent before a subscription is renewed',
          subject: 'Your Subscription Will Renew Soon',
          body_html: '<h1>Subscription Renewal Notice</h1><p>Dear {{client_name}},</p><p>Your subscription to {{plan_name}} will renew on {{renewal_date}}. You will be charged {{renewal_amount}}.</p><p>If you wish to make any changes to your subscription, please do so before the renewal date.</p><p>Best regards,<br>The {{company_name}} Team</p>',
          variables: ['company_name', 'client_name', 'plan_name', 'renewal_date', 'renewal_amount'],
          category: 'billing'
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: systemTemplates
      });
    } catch (error) {
      console.error('Error getting system email templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get system email templates',
        error: error.message
      });
    }
  }
  
  /**
   * Import system email template
   */
  async importSystemTemplate(req, res) {
    try {
      const tenantId = req.tenantId;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Template code is required'
        });
      }
      
      // Get system templates
      const systemTemplatesResponse = await this.getSystemEmailTemplates({}, {
        status: () => {
          return { json: (data) => data };
        }
      });
      
      if (!systemTemplatesResponse.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get system templates'
        });
      }
      
      // Find template with matching code
      const systemTemplate = systemTemplatesResponse.data.find(template => template.code === code);
      
      if (!systemTemplate) {
        return res.status(404).json({
          success: false,
          message: `System template with code '${code}' not found`
        });
      }
      
      // Check if template with same code already exists
      const existingTemplate = await EmailTemplate.findOne({
        where: {
          tenant_id: tenantId,
          code
        }
      });
      
      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: `Email template with code '${code}' already exists`
        });
      }
      
      // Create template
      const template = await EmailTemplate.create({
        tenant_id: tenantId,
        name: systemTemplate.name,
        code: systemTemplate.code,
        description: systemTemplate.description,
        subject: systemTemplate.subject,
        body_html: systemTemplate.body_html,
        body_text: this.convertHtmlToText(systemTemplate.body_html),
        variables: systemTemplate.variables,
        category: systemTemplate.category,
        is_active: true,
        is_default: true,
        is_system: true,
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'EMAIL_TEMPLATE',
        entity_id: template.id,
        description: `Imported system email template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(201).json({
        success: true,
        message: 'System email template imported successfully',
        data: template
      });
    } catch (error) {
      console.error('Error importing system template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to import system template',
        error: error.message
      });
    }
  }
  
  /**
   * Helper method to compile template with data
   */
  compileTemplate(template, data) {
    try {
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      console.error('Error compiling template:', error);
      return template;
    }
  }
  
  /**
   * Helper method to generate test data for template variables
   */
  generateTestData(variables) {
    const testData = {};
    
    if (!variables || !Array.isArray(variables)) {
      return testData;
    }
    
    // Common test values
    const commonTestValues = {
      company_name: 'شركة أدالة للخدمات القانونية',
      user_name: 'محمد أحمد',
      client_name: 'شركة النور للاستشارات',
      email: 'user@example.com',
      reset_link: 'https://example.com/reset-password?token=abc123',
      verification_link: 'https://example.com/verify-email?token=abc123',
      invoice_number: 'INV-2023-001',
      invoice_amount: '1,500.00 ريال',
      payment_amount: '1,500.00 ريال',
      due_date: '2023-12-31',
      invoice_link: 'https://example.com/invoices/INV-2023-001',
      plan_name: 'الباقة المتقدمة',
      renewal_date: '2023-12-31',
      renewal_amount: '1,500.00 ريال'
    };
    
    // Generate test data for each variable
    variables.forEach(variable => {
      if (commonTestValues[variable]) {
        testData[variable] = commonTestValues[variable];
      } else {
        testData[variable] = `[قيمة ${variable}]`;
      }
    });
    
    return testData;
  }
  
  /**
   * Helper method to convert HTML to plain text
   */
  convertHtmlToText(html) {
    if (!html) return '';
    
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new EmailTemplateController();
