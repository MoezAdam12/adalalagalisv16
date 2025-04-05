const NotificationTemplate = require('../models/notification-template.model');
const Notification = require('../models/notification.model');
const NotificationSetting = require('../models/notification-setting.model');
const EmailConfig = require('../models/email-config.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

/**
 * Notification controller for managing notifications and templates
 */
class NotificationController {
  /**
   * Get all notification templates
   */
  async getNotificationTemplates(req, res) {
    try {
      const { type, category, search } = req.query;
      
      // Build filter conditions
      const whereConditions = {
        tenant_id: { [Op.or]: [req.tenantId, null] }
      };
      
      if (type) {
        whereConditions.type = type;
      }
      
      if (category) {
        whereConditions.category = category;
      }
      
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const templates = await NotificationTemplate.findAll({
        where: whereConditions,
        order: [
          ['is_system', 'DESC'],
          ['category', 'ASC'],
          ['name', 'ASC']
        ]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'NOTIFICATION_TEMPLATE',
        description: 'Listed notification templates',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error getting notification templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get notification templates',
        error: error.message
      });
    }
  }
  
  /**
   * Get notification template by ID
   */
  async getNotificationTemplateById(req, res) {
    try {
      const templateId = req.params.id;
      
      const template = await NotificationTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: { [Op.or]: [req.tenantId, null] }
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Notification template not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'NOTIFICATION_TEMPLATE',
        entity_id: templateId,
        description: `Viewed notification template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error getting notification template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get notification template',
        error: error.message
      });
    }
  }
  
  /**
   * Create a new notification template
   */
  async createNotificationTemplate(req, res) {
    try {
      const {
        name,
        code,
        description,
        type,
        subject,
        content_html,
        content_text,
        variables,
        category,
        is_active
      } = req.body;
      
      // Check if code already exists
      const existingTemplate = await NotificationTemplate.findOne({
        where: {
          code,
          tenant_id: { [Op.or]: [req.tenantId, null] }
        }
      });
      
      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Notification template code already exists'
        });
      }
      
      // Create template
      const template = await NotificationTemplate.create({
        name,
        code,
        description,
        type,
        subject,
        content_html,
        content_text,
        variables,
        category,
        is_active: is_active !== undefined ? is_active : true,
        is_system: false,
        tenant_id: req.tenantId,
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'NOTIFICATION_TEMPLATE',
        entity_id: template.id,
        description: `Created notification template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: req.body
      });
      
      return res.status(201).json({
        success: true,
        message: 'Notification template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Error creating notification template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create notification template',
        error: error.message
      });
    }
  }
  
  /**
   * Update a notification template
   */
  async updateNotificationTemplate(req, res) {
    try {
      const templateId = req.params.id;
      
      // Find template
      const template = await NotificationTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: req.tenantId
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Notification template not found'
        });
      }
      
      // Check if template is system template
      if (template.is_system) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify system notification template'
        });
      }
      
      // Check if code is being changed and already exists
      if (req.body.code && req.body.code !== template.code) {
        const existingTemplate = await NotificationTemplate.findOne({
          where: { 
            code: req.body.code,
            tenant_id: { [Op.or]: [req.tenantId, null] },
            id: { [Op.ne]: templateId }
          }
        });
        
        if (existingTemplate) {
          return res.status(400).json({
            success: false,
            message: 'Notification template code already exists'
          });
        }
      }
      
      // Store old values for audit log
      const oldValues = {
        name: template.name,
        code: template.code,
        description: template.description,
        type: template.type,
        subject: template.subject,
        content_html: template.content_html,
        content_text: template.content_text,
        variables: template.variables,
        category: template.category,
        is_active: template.is_active
      };
      
      // Update template
      await template.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'NOTIFICATION_TEMPLATE',
        entity_id: templateId,
        description: `Updated notification template: ${template.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: req.body
      });
      
      return res.status(200).json({
        success: true,
        message: 'Notification template updated successfully',
        data: template
      });
    } catch (error) {
      console.error('Error updating notification template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update notification template',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a notification template
   */
  async deleteNotificationTemplate(req, res) {
    try {
      const templateId = req.params.id;
      
      // Find template
      const template = await NotificationTemplate.findOne({
        where: {
          id: templateId,
          tenant_id: req.tenantId
        }
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Notification template not found'
        });
      }
      
      // Check if template is system template
      if (template.is_system) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete system notification template'
        });
      }
      
      // Store template data for audit log
      const templateData = {
        id: template.id,
        name: template.name,
        code: template.code,
        type: template.type,
        category: template.category
      };
      
      // Delete template
      await template.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'NOTIFICATION_TEMPLATE',
        entity_id: templateId,
        description: `Deleted notification template: ${templateData.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: templateData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Notification template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification template',
        error: error.message
      });
    }
  }
  
  /**
   * Get user notifications
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.userId;
      const { page = 1, limit = 10, is_read, category } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter conditions
      const whereConditions = {
        user_id: userId,
        tenant_id: req.tenantId
      };
      
      if (is_read !== undefined) {
        whereConditions.is_read = is_read === 'true';
      }
      
      if (category) {
        whereConditions.category = category;
      }
      
      // Query with pagination
      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereConditions,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });
      
      return res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user notifications',
        error: error.message
      });
    }
  }
  
  /**
   * Create a notification
   */
  async createNotification(req, res) {
    try {
      const {
        user_id,
        title,
        message,
        type = 'info',
        category = 'system',
        action_url,
        image_url,
        metadata
      } = req.body;
      
      // Create notification
      const notification = await Notification.create({
        user_id,
        tenant_id: req.tenantId,
        title,
        message,
        type,
        category,
        action_url,
        image_url,
        metadata,
        is_read: false,
        delivery_status: {
          in_app: 'delivered',
          email: 'pending'
        }
      });
      
      // Check if user has email notifications enabled for this category
      const notificationSetting = await NotificationSetting.findOne({
        where: {
          user_id,
          tenant_id: req.tenantId,
          category
        }
      });
      
      // If email notifications are enabled, send email
      if (!notificationSetting || notificationSetting.email_enabled) {
        // Send email notification (will be implemented in sendEmailNotification method)
        this.sendEmailNotification(notification, req.tenantId)
          .then(() => {
            notification.update({
              email_sent: true,
              email_sent_at: new Date(),
              delivery_status: {
                ...notification.delivery_status,
                email: 'delivered'
              }
            });
          })
          .catch(error => {
            console.error('Error sending email notification:', error);
            notification.update({
              delivery_status: {
                ...notification.delivery_status,
                email: 'failed'
              }
            });
          });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message
      });
    }
  }
  
  /**
   * Mark notification as read
   */
  async markNotificationAsRead(req, res) {
    try {
      const notificationId = req.params.id;
      const userId = req.userId;
      
      // Find notification
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          user_id: userId,
          tenant_id: req.tenantId
        }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
      
      // Update notification
      await notification.update({
        is_read: true,
        read_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }
  
  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(req, res) {
    try {
      const userId = req.userId;
      
      // Update all unread notifications
      const result = await Notification.update(
        {
          is_read: true,
          read_at: new Date(),
          updated_at: new Date()
        },
        {
          where: {
            user_id: userId,
            tenant_id: req.tenantId,
            is_read: false
          }
        }
      );
      
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: {
          count: result[0]
        }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a notification
   */
  async deleteNotification(req, res) {
    try {
      const notificationId = req.params.id;
      const userId = req.userId;
      
      // Find notification
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          user_id: userId,
          tenant_id: req.tenantId
        }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
      
      // Delete notification
      await notification.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }
  
  /**
   * Get user notification settings
   */
  async getUserNotificationSettings(req, res) {
    try {
      const userId = req.userId;
      
      const settings = await NotificationSetting.findAll({
        where: {
          user_id: userId,
          tenant_id: req.tenantId
        },
        order: [['category', 'ASC']]
      });
      
      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting user notification settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user notification settings',
        error: error.message
      });
    }
  }
  
  /**
   * Update user notification settings
   */
  async updateUserNotificationSettings(req, res) {
    try {
      const userId = req.userId;
      const { category, email_enabled, in_app_enabled, sms_enabled, push_enabled, email_digest } = req.body;
      
      // Find or create settings
      const [settings, created] = await NotificationSetting.findOrCreate({
        where: {
          user_id: userId,
          tenant_id: req.tenantId,
          category
        },
        defaults: {
          email_enabled: email_enabled !== undefined ? email_enabled : true,
          in_app_enabled: in_app_enabled !== undefined ? in_app_enabled : true,
          sms_enabled: sms_enabled !== undefined ? sms_enabled : false,
          push_enabled: push_enabled !== undefined ? push_enabled : false,
          email_digest: email_digest || 'instant',
          created_by: userId,
          updated_by: userId
        }
      });
      
      if (!created) {
        // Update existing settings
        await settings.update({
          email_enabled: email_enabled !== undefined ? email_enabled : settings.email_enabled,
          in_app_enabled: in_app_enabled !== undefined ? in_app_enabled : settings.in_app_enabled,
          sms_enabled: sms_enabled !== undefined ? sms_enabled : settings.sms_enabled,
          push_enabled: push_enabled !== undefined ? push_enabled : settings.push_enabled,
          email_digest: email_digest || settings.email_digest,
          updated_by: userId,
          updated_at: new Date()
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Notification settings updated successfully',
        data: settings
      });
    } catch (error) {
      console.error('Error updating user notification settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user notification settings',
        error: error.message
      });
    }
  }
  
  /**
   * Get email configuration
   */
  async getEmailConfig(req, res) {
    try {
      const tenantId = req.tenantId;
      
      const emailConfig = await EmailConfig.findOne({
        where: {
          tenant_id: tenantId,
          is_active: true
        }
      });
      
      if (!emailConfig) {
        return res.status(404).json({
          success: false,
          message: 'Email configuration not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'EMAIL_CONFIG',
        entity_id: emailConfig.id,
        description: 'Viewed email configuration',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      // Remove sensitive data
      const safeConfig = { ...emailConfig.toJSON() };
      delete safeConfig.password;
      delete safeConfig.api_key;
      delete safeConfig.api_secret;
      
      return res.status(200).json({
        success: true,
        data: safeConfig
      });
    } catch (error) {
      console.error('Error getting email configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get email configuration',
        error: error.message
      });
    }
  }
  
  /**
   * Create or update email configuration
   */
  async updateEmailConfig(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        provider,
        host,
        port,
        username,
        password,
        api_key,
        api_secret,
        from_email,
        from_name,
        reply_to,
        encryption,
        settings
      } = req.body;
      
      // Find existing config
      const existingConfig = await EmailConfig.findOne({
        where: {
          tenant_id: tenantId
        }
      });
      
      let emailConfig;
      
      if (existingConfig) {
        // Store old values for audit log
        const oldValues = {
          provider: existingConfig.provider,
          host: existingConfig.host,
          port: existingConfig.port,
          username: existingConfig.username,
          from_email: existingConfig.from_email,
          from_name: existingConfig.from_name,
          reply_to: existingConfig.reply_to,
          encryption: existingConfig.encryption,
          is_active: existingConfig.is_active
        };
        
        // Update existing config
        await existingConfig.update({
          provider,
          host,
          port,
          username,
          password: password || existingConfig.password,
          api_key: api_key || existingConfig.api_key,
          api_secret: api_secret || existingConfig.api_secret,
          from_email,
          from_name,
          reply_to,
          encryption,
          settings: settings || existingConfig.settings,
          is_verified: false, // Reset verification status
          updated_by: req.userId,
          updated_at: new Date()
        });
        
        emailConfig = existingConfig;
        
        // Log audit
        await AuditLog.create({
          tenant_id: tenantId,
          user_id: req.userId,
          action: 'UPDATE',
          entity_type: 'EMAIL_CONFIG',
          entity_id: emailConfig.id,
          description: 'Updated email configuration',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          old_values: oldValues,
          new_values: {
            provider,
            host,
            port,
            username,
            from_email,
            from_name,
            reply_to,
            encryption,
            is_active: true
          }
        });
      } else {
        // Create new config
        emailConfig = await EmailConfig.create({
          tenant_id: tenantId,
          provider,
          host,
          port,
          username,
          password,
          api_key,
          api_secret,
          from_email,
          from_name,
          reply_to,
          encryption,
          settings,
          is_active: true,
          is_verified: false,
          created_by: req.userId,
          updated_by: req.userId
        });
        
        // Log audit
        await AuditLog.create({
          tenant_id: tenantId,
          user_id: req.userId,
          action: 'CREATE',
          entity_type: 'EMAIL_CONFIG',
          entity_id: emailConfig.id,
          description: 'Created email configuration',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          new_values: {
            provider,
            host,
            port,
            username,
            from_email,
            from_name,
            reply_to,
            encryption,
            is_active: true
          }
        });
      }
      
      // Remove sensitive data
      const safeConfig = { ...emailConfig.toJSON() };
      delete safeConfig.password;
      delete safeConfig.api_key;
      delete safeConfig.api_secret;
      
      return res.status(200).json({
        success: true,
        message: 'Email configuration updated successfully',
        data: safeConfig
      });
    } catch (error) {
      console.error('Error updating email configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update email configuration',
        error: error.message
      });
    }
  }
  
  /**
   * Test email configuration
   */
  async testEmailConfig(req, res) {
    try {
      const tenantId = req.tenantId;
      const { recipient_email } = req.body;
      
      if (!recipient_email) {
        return res.status(400).json({
          success: false,
          message: 'Recipient email is required'
        });
      }
      
      // Find email config
      const emailConfig = await EmailConfig.findOne({
        where: {
          tenant_id: tenantId,
          is_active: true
        }
      });
      
      if (!emailConfig) {
        return res.status(404).json({
          success: false,
          message: 'Email configuration not found'
        });
      }
      
      // Create transporter based on provider
      let transporter;
      
      switch (emailConfig.provider) {
        case 'smtp':
          transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.encryption === 'ssl',
            auth: {
              user: emailConfig.username,
              pass: emailConfig.password
            },
            tls: {
              rejectUnauthorized: false
            }
          });
          break;
          
        case 'sendgrid':
          // Implement SendGrid transport
          break;
          
        case 'mailgun':
          // Implement Mailgun transport
          break;
          
        case 'ses':
          // Implement Amazon SES transport
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported email provider'
          });
      }
      
      // Send test email
      const info = await transporter.sendMail({
        from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
        to: recipient_email,
        subject: 'Test Email Configuration',
        text: 'This is a test email to verify your email configuration.',
        html: '<p>This is a test email to verify your email configuration.</p>'
      });
      
      // Update verification status
      await emailConfig.update({
        is_verified: true,
        verification_date: new Date(),
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'TEST',
        entity_type: 'EMAIL_CONFIG',
        entity_id: emailConfig.id,
        description: 'Tested email configuration',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        metadata: {
          recipient_email,
          message_id: info.messageId
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          message_id: info.messageId,
          recipient: recipient_email
        }
      });
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error.message
      });
    }
  }
  
  /**
   * Send email notification
   * @private
   */
  async sendEmailNotification(notification, tenantId) {
    try {
      // Find email config
      const emailConfig = await EmailConfig.findOne({
        where: {
          tenant_id: tenantId,
          is_active: true,
          is_verified: true
        }
      });
      
      if (!emailConfig) {
        throw new Error('No verified email configuration found');
      }
      
      // Find notification template
      let template = await NotificationTemplate.findOne({
        where: {
          tenant_id: tenantId,
          type: 'email',
          category: notification.category,
          is_active: true
        }
      });
      
      if (!template) {
        // Try to find system template
        template = await NotificationTemplate.findOne({
          where: {
            tenant_id: null,
            type: 'email',
            category: notification.category,
            is_active: true
          }
        });
      }
      
      if (!template) {
        // Use default template
        template = {
          subject: notification.title,
          content_html: `<p>${notification.message}</p>`,
          content_text: notification.message
        };
      }
      
      // Compile template with Handlebars
      const compiledSubject = handlebars.compile(template.subject || notification.title);
      const compiledHtml = handlebars.compile(template.content_html);
      const compiledText = handlebars.compile(template.content_text || notification.message);
      
      // Prepare template data
      const templateData = {
        title: notification.title,
        message: notification.message,
        action_url: notification.action_url,
        ...notification.metadata
      };
      
      // Render templates
      const subject = compiledSubject(templateData);
      const html = compiledHtml(templateData);
      const text = compiledText(templateData);
      
      // Create transporter based on provider
      let transporter;
      
      switch (emailConfig.provider) {
        case 'smtp':
          transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.encryption === 'ssl',
            auth: {
              user: emailConfig.username,
              pass: emailConfig.password
            },
            tls: {
              rejectUnauthorized: false
            }
          });
          break;
          
        case 'sendgrid':
          // Implement SendGrid transport
          break;
          
        case 'mailgun':
          // Implement Mailgun transport
          break;
          
        case 'ses':
          // Implement Amazon SES transport
          break;
          
        default:
          throw new Error('Unsupported email provider');
      }
      
      // Get user email
      const User = require('../models/user.model');
      const user = await User.findByPk(notification.user_id);
      
      if (!user || !user.email) {
        throw new Error('User email not found');
      }
      
      // Send email
      const info = await transporter.sendMail({
        from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
        to: user.email,
        subject: subject,
        text: text,
        html: html
      });
      
      return info;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationController();
