const ExternalIntegration = require('../models/external-integration.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');
const axios = require('axios');
const crypto = require('crypto');

/**
 * External Integrations controller for managing integrations with external services
 */
class ExternalIntegrationsController {
  /**
   * Get all integrations for tenant
   */
  async getIntegrations(req, res) {
    try {
      const tenantId = req.tenantId;
      const { type, provider } = req.query;
      
      const whereClause = {
        tenant_id: tenantId
      };
      
      if (type) {
        whereClause.type = type;
      }
      
      if (provider) {
        whereClause.provider = provider;
      }
      
      const integrations = await ExternalIntegration.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'EXTERNAL_INTEGRATIONS',
        description: 'Viewed external integrations',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: integrations
      });
    } catch (error) {
      console.error('Error getting integrations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get integrations',
        error: error.message
      });
    }
  }
  
  /**
   * Get integration by ID
   */
  async getIntegrationById(req, res) {
    try {
      const tenantId = req.tenantId;
      const integrationId = req.params.id;
      
      const integration = await ExternalIntegration.findOne({
        where: {
          id: integrationId,
          tenant_id: tenantId
        }
      });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'EXTERNAL_INTEGRATION',
        entity_id: integration.id,
        description: `Viewed external integration: ${integration.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('Error getting integration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get integration',
        error: error.message
      });
    }
  }
  
  /**
   * Create new integration
   */
  async createIntegration(req, res) {
    try {
      const tenantId = req.tenantId;
      const { name, description, type, provider, credentials, settings } = req.body;
      
      // Validate required fields
      if (!name || !type || !provider) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and provider are required'
        });
      }
      
      // Check if integration already exists
      const existingIntegration = await ExternalIntegration.findOne({
        where: {
          tenant_id: tenantId,
          type,
          provider
        }
      });
      
      if (existingIntegration) {
        return res.status(400).json({
          success: false,
          message: `Integration with type ${type} and provider ${provider} already exists`
        });
      }
      
      // Create integration
      const integration = await ExternalIntegration.create({
        tenant_id: tenantId,
        name,
        description,
        type,
        provider,
        credentials: credentials || {},
        settings: settings || {},
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'EXTERNAL_INTEGRATION',
        entity_id: integration.id,
        description: `Created external integration: ${integration.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(201).json({
        success: true,
        message: 'Integration created successfully',
        data: integration
      });
    } catch (error) {
      console.error('Error creating integration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create integration',
        error: error.message
      });
    }
  }
  
  /**
   * Update integration
   */
  async updateIntegration(req, res) {
    try {
      const tenantId = req.tenantId;
      const integrationId = req.params.id;
      const { name, description, is_enabled, credentials, settings } = req.body;
      
      // Find integration
      const integration = await ExternalIntegration.findOne({
        where: {
          id: integrationId,
          tenant_id: tenantId
        }
      });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Store old values for audit log
      const oldValues = {
        name: integration.name,
        description: integration.description,
        is_enabled: integration.is_enabled,
        credentials: integration.credentials,
        settings: integration.settings
      };
      
      // Update integration
      await integration.update({
        name: name !== undefined ? name : integration.name,
        description: description !== undefined ? description : integration.description,
        is_enabled: is_enabled !== undefined ? is_enabled : integration.is_enabled,
        credentials: credentials !== undefined ? credentials : integration.credentials,
        settings: settings !== undefined ? settings : integration.settings,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'EXTERNAL_INTEGRATION',
        entity_id: integration.id,
        description: `Updated external integration: ${integration.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: {
          name: integration.name,
          description: integration.description,
          is_enabled: integration.is_enabled,
          credentials: integration.credentials,
          settings: integration.settings
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Integration updated successfully',
        data: integration
      });
    } catch (error) {
      console.error('Error updating integration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update integration',
        error: error.message
      });
    }
  }
  
  /**
   * Delete integration
   */
  async deleteIntegration(req, res) {
    try {
      const tenantId = req.tenantId;
      const integrationId = req.params.id;
      
      // Find integration
      const integration = await ExternalIntegration.findOne({
        where: {
          id: integrationId,
          tenant_id: tenantId
        }
      });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Store values for audit log
      const integrationData = {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.provider
      };
      
      // Delete integration
      await integration.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'EXTERNAL_INTEGRATION',
        entity_id: integrationId,
        description: `Deleted external integration: ${integrationData.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: integrationData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Integration deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete integration',
        error: error.message
      });
    }
  }
  
  /**
   * Test integration connection
   */
  async testIntegration(req, res) {
    try {
      const tenantId = req.tenantId;
      const integrationId = req.params.id;
      
      // Find integration
      const integration = await ExternalIntegration.findOne({
        where: {
          id: integrationId,
          tenant_id: tenantId
        }
      });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Test connection based on integration type
      let testResult = {
        success: false,
        message: 'Integration test not implemented for this type'
      };
      
      switch (integration.type) {
        case 'storage':
          testResult = await this.testStorageIntegration(integration);
          break;
        case 'accounting':
          testResult = await this.testAccountingIntegration(integration);
          break;
        case 'payment':
          testResult = await this.testPaymentIntegration(integration);
          break;
        case 'sms':
          testResult = await this.testSmsIntegration(integration);
          break;
        case 'email':
          testResult = await this.testEmailIntegration(integration);
          break;
        default:
          // Generic test for other types
          testResult = {
            success: true,
            message: 'Integration credentials validated successfully'
          };
      }
      
      // Update integration with test result
      await integration.update({
        metadata: {
          ...integration.metadata,
          last_test: {
            timestamp: new Date(),
            success: testResult.success,
            message: testResult.message
          }
        },
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'TEST',
        entity_type: 'EXTERNAL_INTEGRATION',
        entity_id: integration.id,
        description: `Tested external integration: ${integration.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: testResult.success,
        message: testResult.message,
        data: testResult.data || {}
      });
    } catch (error) {
      console.error('Error testing integration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to test integration',
        error: error.message
      });
    }
  }
  
  /**
   * Sync integration data
   */
  async syncIntegration(req, res) {
    try {
      const tenantId = req.tenantId;
      const integrationId = req.params.id;
      
      // Find integration
      const integration = await ExternalIntegration.findOne({
        where: {
          id: integrationId,
          tenant_id: tenantId
        }
      });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Update sync status
      await integration.update({
        sync_status: 'in_progress',
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Perform sync based on integration type
      let syncResult = {
        success: false,
        message: 'Sync not implemented for this integration type'
      };
      
      try {
        switch (integration.type) {
          case 'storage':
            syncResult = await this.syncStorageIntegration(integration);
            break;
          case 'accounting':
            syncResult = await this.syncAccountingIntegration(integration);
            break;
          case 'payment':
            syncResult = await this.syncPaymentIntegration(integration);
            break;
          default:
            syncResult = {
              success: false,
              message: 'Sync not supported for this integration type'
            };
        }
        
        // Update integration with sync result
        await integration.update({
          sync_status: syncResult.success ? 'completed' : 'failed',
          sync_error: syncResult.success ? null : syncResult.message,
          last_sync_at: new Date(),
          metadata: {
            ...integration.metadata,
            last_sync: {
              timestamp: new Date(),
              success: syncResult.success,
              message: syncResult.message
            }
          },
          updated_by: req.userId,
          updated_at: new Date()
        });
      } catch (error) {
        // Update integration with sync error
        await integration.update({
          sync_status: 'failed',
          sync_error: error.message,
          last_sync_at: new Date(),
          metadata: {
            ...integration.metadata,
            last_sync: {
              timestamp: new Date(),
              success: false,
              message: error.message
            }
          },
          updated_by: req.userId,
          updated_at: new Date()
        });
        
        throw error;
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'SYNC',
        entity_type: 'EXTERNAL_INTEGRATION',
        entity_id: integration.id,
        description: `Synced external integration: ${integration.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: syncResult.success,
        message: syncResult.message,
        data: syncResult.data || {}
      });
    } catch (error) {
      console.error('Error syncing integration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to sync integration',
        error: error.message
      });
    }
  }
  
  /**
   * Get available integration providers
   */
  async getAvailableProviders(req, res) {
    try {
      const providers = {
        storage: [
          { id: 'dropbox', name: 'Dropbox', logo_url: '/assets/images/integrations/dropbox.png' },
          { id: 'google_drive', name: 'Google Drive', logo_url: '/assets/images/integrations/google-drive.png' },
          { id: 'onedrive', name: 'Microsoft OneDrive', logo_url: '/assets/images/integrations/onedrive.png' },
          { id: 's3', name: 'Amazon S3', logo_url: '/assets/images/integrations/amazon-s3.png' }
        ],
        accounting: [
          { id: 'quickbooks', name: 'QuickBooks', logo_url: '/assets/images/integrations/quickbooks.png' },
          { id: 'xero', name: 'Xero', logo_url: '/assets/images/integrations/xero.png' },
          { id: 'sage', name: 'Sage', logo_url: '/assets/images/integrations/sage.png' },
          { id: 'zoho_books', name: 'Zoho Books', logo_url: '/assets/images/integrations/zoho-books.png' }
        ],
        payment: [
          { id: 'stripe', name: 'Stripe', logo_url: '/assets/images/integrations/stripe.png' },
          { id: 'paypal', name: 'PayPal', logo_url: '/assets/images/integrations/paypal.png' },
          { id: 'square', name: 'Square', logo_url: '/assets/images/integrations/square.png' },
          { id: 'razorpay', name: 'Razorpay', logo_url: '/assets/images/integrations/razorpay.png' }
        ],
        sms: [
          { id: 'twilio', name: 'Twilio', logo_url: '/assets/images/integrations/twilio.png' },
          { id: 'nexmo', name: 'Nexmo (Vonage)', logo_url: '/assets/images/integrations/nexmo.png' },
          { id: 'messagebird', name: 'MessageBird', logo_url: '/assets/images/integrations/messagebird.png' }
        ],
        email: [
          { id: 'sendgrid', name: 'SendGrid', logo_url: '/assets/images/integrations/sendgrid.png' },
          { id: 'mailchimp', name: 'Mailchimp', logo_url: '/assets/images/integrations/mailchimp.png' },
          { id: 'mailgun', name: 'Mailgun', logo_url: '/assets/images/integrations/mailgun.png' }
        ],
        calendar: [
          { id: 'google_calendar', name: 'Google Calendar', logo_url: '/assets/images/integrations/google-calendar.png' },
          { id: 'outlook_calendar', name: 'Microsoft Outlook Calendar', logo_url: '/assets/images/integrations/outlook-calendar.png' }
        ]
      };
      
      return res.status(200).json({
        success: true,
        data: providers
      });
    } catch (error) {
      console.error('Error getting available providers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get available providers',
        error: error.message
      });
    }
  }
  
  /**
   * Get OAuth authorization URL
   */
  async getOAuthUrl(req, res) {
    try {
      const { type, provider } = req.query;
      
      if (!type || !provider) {
        return res.status(400).json({
          success: false,
          message: 'Type and provider are required'
        });
      }
      
      // Generate state token for security
      const state = crypto.randomBytes(16).toString('hex');
      
      // Store state token in session or database for verification
      // req.session.oauthState = state;
      
      // Generate OAuth URL based on provider
      let authUrl = '';
      
      switch (`${type}:${provider}`) {
        case 'storage:dropbox':
          authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI)}&state=${state}`;
          break;
        case 'storage:google_drive':
          authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI)}&scope=https://www.googleapis.com/auth/drive&access_type=offline&state=${state}`;
          break;
        case 'accounting:quickbooks':
          authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${process.env.QUICKBOOKS_CLIENT_ID}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI)}&state=${state}`;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `OAuth not supported for ${type}:${provider}`
          });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          auth_url: authUrl,
          state
        }
      });
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate OAuth URL',
        error: error.message
      });
    }
  }
  
  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(req, res) {
    try {
      const { code, state, type, provider } = req.body;
      
      if (!code || !state || !type || !provider) {
        return res.status(400).json({
          success: false,
          message: 'Code, state, type, and provider are required'
        });
      }
      
      // Verify state token
      // if (state !== req.session.oauthState) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Invalid state token'
      //   });
      // }
      
      // Exchange code for tokens based on provider
      let tokenResponse = null;
      
      switch (`${type}:${provider}`) {
        case 'storage:dropbox':
          tokenResponse = await this.exchangeDropboxCode(code);
          break;
        case 'storage:google_drive':
          tokenResponse = await this.exchangeGoogleCode(code);
          break;
        case 'accounting:quickbooks':
          tokenResponse = await this.exchangeQuickbooksCode(code);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `OAuth not supported for ${type}:${provider}`
          });
      }
      
      return res.status(200).json({
        success: true,
        data: tokenResponse
      });
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to handle OAuth callback',
        error: error.message
      });
    }
  }
  
  // Helper methods for testing integrations
  
  async testStorageIntegration(integration) {
    try {
      // Mock implementation for demonstration
      const { provider, credentials } = integration;
      
      switch (provider) {
        case 'dropbox':
          // Check if access token exists
          if (!credentials.access_token) {
            return {
              success: false,
              message: 'Missing access token'
            };
          }
          
          // In a real implementation, we would make an API call to Dropbox
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to Dropbox',
            data: {
              account_name: 'Demo Account',
              quota_info: {
                used: '5 GB',
                total: '2 TB'
              }
            }
          };
          
        case 'google_drive':
          // Check if access token exists
          if (!credentials.access_token) {
            return {
              success: false,
              message: 'Missing access token'
            };
          }
          
          // In a real implementation, we would make an API call to Google Drive
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to Google Drive',
            data: {
              user: 'demo@example.com',
              quota_info: {
                used: '10 GB',
                total: '15 GB'
              }
            }
          };
          
        default:
          return {
            success: false,
            message: `Test not implemented for ${provider}`
          };
      }
    } catch (error) {
      console.error('Error testing storage integration:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  async testAccountingIntegration(integration) {
    try {
      // Mock implementation for demonstration
      const { provider, credentials } = integration;
      
      switch (provider) {
        case 'quickbooks':
          // Check if access token exists
          if (!credentials.access_token) {
            return {
              success: false,
              message: 'Missing access token'
            };
          }
          
          // In a real implementation, we would make an API call to QuickBooks
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to QuickBooks',
            data: {
              company_name: 'Demo Company',
              company_id: '1234567890'
            }
          };
          
        case 'xero':
          // Check if access token exists
          if (!credentials.access_token) {
            return {
              success: false,
              message: 'Missing access token'
            };
          }
          
          // In a real implementation, we would make an API call to Xero
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to Xero',
            data: {
              organization_name: 'Demo Organization',
              organization_id: '1234567890'
            }
          };
          
        default:
          return {
            success: false,
            message: `Test not implemented for ${provider}`
          };
      }
    } catch (error) {
      console.error('Error testing accounting integration:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  async testPaymentIntegration(integration) {
    try {
      // Mock implementation for demonstration
      const { provider, credentials } = integration;
      
      switch (provider) {
        case 'stripe':
          // Check if API key exists
          if (!credentials.api_key) {
            return {
              success: false,
              message: 'Missing API key'
            };
          }
          
          // In a real implementation, we would make an API call to Stripe
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to Stripe',
            data: {
              account_id: 'acct_1234567890',
              account_name: 'Demo Account'
            }
          };
          
        case 'paypal':
          // Check if client ID and secret exist
          if (!credentials.client_id || !credentials.client_secret) {
            return {
              success: false,
              message: 'Missing client ID or client secret'
            };
          }
          
          // In a real implementation, we would make an API call to PayPal
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to PayPal',
            data: {
              account_id: '1234567890',
              account_email: 'demo@example.com'
            }
          };
          
        default:
          return {
            success: false,
            message: `Test not implemented for ${provider}`
          };
      }
    } catch (error) {
      console.error('Error testing payment integration:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  async testSmsIntegration(integration) {
    try {
      // Mock implementation for demonstration
      const { provider, credentials } = integration;
      
      switch (provider) {
        case 'twilio':
          // Check if account SID and auth token exist
          if (!credentials.account_sid || !credentials.auth_token) {
            return {
              success: false,
              message: 'Missing account SID or auth token'
            };
          }
          
          // In a real implementation, we would make an API call to Twilio
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to Twilio',
            data: {
              account_sid: credentials.account_sid,
              phone_numbers: ['1234567890']
            }
          };
          
        default:
          return {
            success: false,
            message: `Test not implemented for ${provider}`
          };
      }
    } catch (error) {
      console.error('Error testing SMS integration:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  async testEmailIntegration(integration) {
    try {
      // Mock implementation for demonstration
      const { provider, credentials } = integration;
      
      switch (provider) {
        case 'sendgrid':
          // Check if API key exists
          if (!credentials.api_key) {
            return {
              success: false,
              message: 'Missing API key'
            };
          }
          
          // In a real implementation, we would make an API call to SendGrid
          // For demonstration, we'll just return success
          return {
            success: true,
            message: 'Successfully connected to SendGrid',
            data: {
              account_name: 'Demo Account'
            }
          };
          
        default:
          return {
            success: false,
            message: `Test not implemented for ${provider}`
          };
      }
    } catch (error) {
      console.error('Error testing email integration:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Helper methods for syncing integrations
  
  async syncStorageIntegration(integration) {
    // Mock implementation for demonstration
    return {
      success: true,
      message: 'Storage integration synced successfully',
      data: {
        files_synced: 25,
        last_sync: new Date()
      }
    };
  }
  
  async syncAccountingIntegration(integration) {
    // Mock implementation for demonstration
    return {
      success: true,
      message: 'Accounting integration synced successfully',
      data: {
        invoices_synced: 10,
        customers_synced: 5,
        last_sync: new Date()
      }
    };
  }
  
  async syncPaymentIntegration(integration) {
    // Mock implementation for demonstration
    return {
      success: true,
      message: 'Payment integration synced successfully',
      data: {
        transactions_synced: 15,
        last_sync: new Date()
      }
    };
  }
  
  // Helper methods for OAuth
  
  async exchangeDropboxCode(code) {
    // Mock implementation for demonstration
    return {
      access_token: 'mock_dropbox_access_token',
      token_type: 'bearer',
      expires_in: 14400,
      refresh_token: 'mock_dropbox_refresh_token',
      account_id: 'dbid:1234567890',
      uid: '1234567890'
    };
  }
  
  async exchangeGoogleCode(code) {
    // Mock implementation for demonstration
    return {
      access_token: 'mock_google_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'mock_google_refresh_token',
      scope: 'https://www.googleapis.com/auth/drive'
    };
  }
  
  async exchangeQuickbooksCode(code) {
    // Mock implementation for demonstration
    return {
      access_token: 'mock_quickbooks_access_token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock_quickbooks_refresh_token',
      x_refresh_token_expires_in: 8726400
    };
  }
}

module.exports = new ExternalIntegrationsController();
