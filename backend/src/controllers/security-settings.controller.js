const SecuritySettings = require('../models/security-settings.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');

/**
 * Security Settings controller for managing advanced security configuration
 */
class SecuritySettingsController {
  /**
   * Get security settings for tenant
   */
  async getSecuritySettings(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Find or create security settings
      const [settings, created] = await SecuritySettings.findOrCreate({
        where: {
          tenant_id: tenantId
        },
        defaults: {
          tenant_id: tenantId,
          created_by: req.userId,
          updated_by: req.userId
        }
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'SECURITY_SETTINGS',
        entity_id: settings.id,
        description: 'Viewed security settings',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting security settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get security settings',
        error: error.message
      });
    }
  }
  
  /**
   * Update security settings
   */
  async updateSecuritySettings(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Find or create security settings
      const [settings, created] = await SecuritySettings.findOrCreate({
        where: {
          tenant_id: tenantId
        },
        defaults: {
          tenant_id: tenantId,
          created_by: req.userId,
          updated_by: req.userId
        }
      });
      
      // Store old values for audit log
      const oldValues = {
        password_min_length: settings.password_min_length,
        password_require_uppercase: settings.password_require_uppercase,
        password_require_lowercase: settings.password_require_lowercase,
        password_require_numbers: settings.password_require_numbers,
        password_require_symbols: settings.password_require_symbols,
        password_expiry_days: settings.password_expiry_days,
        password_history_count: settings.password_history_count,
        mfa_enabled: settings.mfa_enabled,
        mfa_required: settings.mfa_required,
        mfa_methods: settings.mfa_methods,
        session_timeout_minutes: settings.session_timeout_minutes,
        session_inactivity_timeout_minutes: settings.session_inactivity_timeout_minutes,
        session_absolute_timeout_hours: settings.session_absolute_timeout_hours,
        session_concurrent_max: settings.session_concurrent_max,
        ip_whitelist_enabled: settings.ip_whitelist_enabled,
        ip_whitelist: settings.ip_whitelist,
        max_login_attempts: settings.max_login_attempts,
        lockout_duration_minutes: settings.lockout_duration_minutes,
        api_rate_limit_enabled: settings.api_rate_limit_enabled,
        api_rate_limit_requests: settings.api_rate_limit_requests,
        api_rate_limit_window_minutes: settings.api_rate_limit_window_minutes,
        audit_log_enabled: settings.audit_log_enabled,
        audit_log_retention_days: settings.audit_log_retention_days,
        cors_enabled: settings.cors_enabled,
        cors_allowed_origins: settings.cors_allowed_origins,
        cors_allowed_methods: settings.cors_allowed_methods,
        security_headers_enabled: settings.security_headers_enabled,
        content_security_policy_enabled: settings.content_security_policy_enabled,
        content_security_policy: settings.content_security_policy
      };
      
      // Update settings
      await settings.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'SECURITY_SETTINGS',
        entity_id: settings.id,
        description: 'Updated security settings',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: req.body
      });
      
      return res.status(200).json({
        success: true,
        message: 'Security settings updated successfully',
        data: settings
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update security settings',
        error: error.message
      });
    }
  }
  
  /**
   * Reset security settings to defaults
   */
  async resetSecuritySettings(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Find security settings
      const settings = await SecuritySettings.findOne({
        where: {
          tenant_id: tenantId
        }
      });
      
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Security settings not found'
        });
      }
      
      // Store old values for audit log
      const oldValues = {
        password_min_length: settings.password_min_length,
        password_require_uppercase: settings.password_require_uppercase,
        password_require_lowercase: settings.password_require_lowercase,
        password_require_numbers: settings.password_require_numbers,
        password_require_symbols: settings.password_require_symbols,
        password_expiry_days: settings.password_expiry_days,
        password_history_count: settings.password_history_count,
        mfa_enabled: settings.mfa_enabled,
        mfa_required: settings.mfa_required,
        mfa_methods: settings.mfa_methods,
        session_timeout_minutes: settings.session_timeout_minutes,
        session_inactivity_timeout_minutes: settings.session_inactivity_timeout_minutes,
        session_absolute_timeout_hours: settings.session_absolute_timeout_hours,
        session_concurrent_max: settings.session_concurrent_max,
        ip_whitelist_enabled: settings.ip_whitelist_enabled,
        ip_whitelist: settings.ip_whitelist,
        max_login_attempts: settings.max_login_attempts,
        lockout_duration_minutes: settings.lockout_duration_minutes,
        api_rate_limit_enabled: settings.api_rate_limit_enabled,
        api_rate_limit_requests: settings.api_rate_limit_requests,
        api_rate_limit_window_minutes: settings.api_rate_limit_window_minutes,
        audit_log_enabled: settings.audit_log_enabled,
        audit_log_retention_days: settings.audit_log_retention_days,
        cors_enabled: settings.cors_enabled,
        cors_allowed_origins: settings.cors_allowed_origins,
        cors_allowed_methods: settings.cors_allowed_methods,
        security_headers_enabled: settings.security_headers_enabled,
        content_security_policy_enabled: settings.content_security_policy_enabled,
        content_security_policy: settings.content_security_policy
      };
      
      // Default values
      const defaultValues = {
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: true,
        password_expiry_days: 90,
        password_history_count: 5,
        mfa_enabled: false,
        mfa_required: false,
        mfa_methods: {
          app: true,
          sms: true,
          email: true
        },
        session_timeout_minutes: 30,
        session_inactivity_timeout_minutes: 15,
        session_absolute_timeout_hours: 24,
        session_concurrent_max: 5,
        ip_whitelist_enabled: false,
        ip_whitelist: [],
        max_login_attempts: 5,
        lockout_duration_minutes: 30,
        api_rate_limit_enabled: true,
        api_rate_limit_requests: 100,
        api_rate_limit_window_minutes: 15,
        audit_log_enabled: true,
        audit_log_retention_days: 90,
        cors_enabled: true,
        cors_allowed_origins: ['*'],
        cors_allowed_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        security_headers_enabled: true,
        content_security_policy_enabled: false,
        content_security_policy: null
      };
      
      // Update settings with default values
      await settings.update({
        ...defaultValues,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'RESET',
        entity_type: 'SECURITY_SETTINGS',
        entity_id: settings.id,
        description: 'Reset security settings to defaults',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: defaultValues
      });
      
      return res.status(200).json({
        success: true,
        message: 'Security settings reset to defaults successfully',
        data: settings
      });
    } catch (error) {
      console.error('Error resetting security settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset security settings',
        error: error.message
      });
    }
  }
  
  /**
   * Test password against policy
   */
  async testPasswordPolicy(req, res) {
    try {
      const tenantId = req.tenantId;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }
      
      // Get security settings
      const settings = await SecuritySettings.findOne({
        where: {
          tenant_id: tenantId
        }
      });
      
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Security settings not found'
        });
      }
      
      // Test password against policy
      const validationResults = {
        length: password.length >= settings.password_min_length,
        uppercase: !settings.password_require_uppercase || /[A-Z]/.test(password),
        lowercase: !settings.password_require_lowercase || /[a-z]/.test(password),
        numbers: !settings.password_require_numbers || /[0-9]/.test(password),
        symbols: !settings.password_require_symbols || /[^A-Za-z0-9]/.test(password)
      };
      
      const isValid = Object.values(validationResults).every(result => result === true);
      
      return res.status(200).json({
        success: true,
        data: {
          is_valid: isValid,
          validation_results: validationResults,
          policy: {
            min_length: settings.password_min_length,
            require_uppercase: settings.password_require_uppercase,
            require_lowercase: settings.password_require_lowercase,
            require_numbers: settings.password_require_numbers,
            require_symbols: settings.password_require_symbols
          }
        }
      });
    } catch (error) {
      console.error('Error testing password policy:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to test password policy',
        error: error.message
      });
    }
  }
  
  /**
   * Get active user sessions
   */
  async getActiveSessions(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.query.user_id || req.userId;
      
      // This would typically query a session store or database
      // For demonstration purposes, we'll return mock data
      const mockSessions = [
        {
          id: '1',
          user_id: userId,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          created_at: new Date(Date.now() - 3600000),
          last_activity: new Date(),
          expires_at: new Date(Date.now() + 3600000),
          is_current: true
        },
        {
          id: '2',
          user_id: userId,
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          created_at: new Date(Date.now() - 86400000),
          last_activity: new Date(Date.now() - 3600000),
          expires_at: new Date(Date.now() + 3600000),
          is_current: false
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: mockSessions
      });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get active sessions',
        error: error.message
      });
    }
  }
  
  /**
   * Terminate user session
   */
  async terminateSession(req, res) {
    try {
      const sessionId = req.params.id;
      const tenantId = req.tenantId;
      
      // This would typically terminate a session in a session store or database
      // For demonstration purposes, we'll just return success
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'TERMINATE',
        entity_type: 'USER_SESSION',
        entity_id: sessionId,
        description: 'Terminated user session',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        message: 'Session terminated successfully'
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to terminate session',
        error: error.message
      });
    }
  }
  
  /**
   * Terminate all user sessions
   */
  async terminateAllSessions(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.query.user_id || req.userId;
      
      // This would typically terminate all sessions for a user in a session store or database
      // For demonstration purposes, we'll just return success
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'TERMINATE_ALL',
        entity_type: 'USER_SESSIONS',
        entity_id: userId,
        description: 'Terminated all user sessions',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        message: 'All sessions terminated successfully'
      });
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to terminate all sessions',
        error: error.message
      });
    }
  }
  
  /**
   * Update IP whitelist
   */
  async updateIPWhitelist(req, res) {
    try {
      const tenantId = req.tenantId;
      const { ip_whitelist, ip_whitelist_enabled } = req.body;
      
      // Find security settings
      const settings = await SecuritySettings.findOne({
        where: {
          tenant_id: tenantId
        }
      });
      
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Security settings not found'
        });
      }
      
      // Store old values for audit log
      const oldValues = {
        ip_whitelist_enabled: settings.ip_whitelist_enabled,
        ip_whitelist: settings.ip_whitelist
      };
      
      // Update settings
      await settings.update({
        ip_whitelist: ip_whitelist || settings.ip_whitelist,
        ip_whitelist_enabled: ip_whitelist_enabled !== undefined ? ip_whitelist_enabled : settings.ip_whitelist_enabled,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'IP_WHITELIST',
        entity_id: settings.id,
        description: 'Updated IP whitelist',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: {
          ip_whitelist_enabled: ip_whitelist_enabled !== undefined ? ip_whitelist_enabled : settings.ip_whitelist_enabled,
          ip_whitelist: ip_whitelist || settings.ip_whitelist
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'IP whitelist updated successfully',
        data: {
          ip_whitelist_enabled: settings.ip_whitelist_enabled,
          ip_whitelist: settings.ip_whitelist
        }
      });
    } catch (error) {
      console.error('Error updating IP whitelist:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update IP whitelist',
        error: error.message
      });
    }
  }
}

module.exports = new SecuritySettingsController();
