const UITheme = require('../models/ui-theme.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

/**
 * UI Theme controller for managing UI customization and white labeling
 */
class UIThemeController {
  /**
   * Get all UI themes for tenant
   */
  async getUIThemes(req, res) {
    try {
      const tenantId = req.tenantId;
      
      const themes = await UITheme.findAll({
        where: {
          tenant_id: tenantId
        },
        order: [
          ['is_default', 'DESC'],
          ['name', 'ASC']
        ]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'LIST',
        entity_type: 'UI_THEME',
        description: 'Listed UI themes',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: themes
      });
    } catch (error) {
      console.error('Error getting UI themes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get UI themes',
        error: error.message
      });
    }
  }
  
  /**
   * Get UI theme by ID
   */
  async getUIThemeById(req, res) {
    try {
      const themeId = req.params.id;
      const tenantId = req.tenantId;
      
      const theme = await UITheme.findOne({
        where: {
          id: themeId,
          tenant_id: tenantId
        }
      });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'UI theme not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'VIEW',
        entity_type: 'UI_THEME',
        entity_id: themeId,
        description: `Viewed UI theme: ${theme.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: theme
      });
    } catch (error) {
      console.error('Error getting UI theme:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get UI theme',
        error: error.message
      });
    }
  }
  
  /**
   * Get active UI theme for tenant
   */
  async getActiveUITheme(req, res) {
    try {
      const tenantId = req.tenantId;
      
      const theme = await UITheme.findOne({
        where: {
          tenant_id: tenantId,
          is_active: true
        }
      });
      
      if (!theme) {
        // If no active theme, try to get default theme
        const defaultTheme = await UITheme.findOne({
          where: {
            tenant_id: tenantId,
            is_default: true
          }
        });
        
        if (!defaultTheme) {
          return res.status(404).json({
            success: false,
            message: 'No active or default UI theme found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: defaultTheme
        });
      }
      
      return res.status(200).json({
        success: true,
        data: theme
      });
    } catch (error) {
      console.error('Error getting active UI theme:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get active UI theme',
        error: error.message
      });
    }
  }
  
  /**
   * Create a new UI theme
   */
  async createUITheme(req, res) {
    try {
      const tenantId = req.tenantId;
      const {
        name,
        is_active,
        is_default,
        primary_color,
        secondary_color,
        text_color,
        text_light_color,
        background_color,
        background_light_color,
        logo_url,
        logo_small_url,
        favicon_url,
        font_family,
        font_size_base,
        custom_css,
        sidebar_color,
        header_color,
        button_border_radius,
        settings
      } = req.body;
      
      // If setting as default, unset any existing default
      if (is_default) {
        await UITheme.update(
          { is_default: false },
          {
            where: {
              tenant_id: tenantId,
              is_default: true
            }
          }
        );
      }
      
      // If setting as active, unset any existing active
      if (is_active) {
        await UITheme.update(
          { is_active: false },
          {
            where: {
              tenant_id: tenantId,
              is_active: true
            }
          }
        );
      }
      
      // Create theme
      const theme = await UITheme.create({
        tenant_id: tenantId,
        name,
        is_active: is_active !== undefined ? is_active : true,
        is_default: is_default !== undefined ? is_default : false,
        primary_color: primary_color || '#3f51b5',
        secondary_color: secondary_color || '#f50057',
        text_color: text_color || '#212121',
        text_light_color: text_light_color || '#ffffff',
        background_color: background_color || '#ffffff',
        background_light_color: background_light_color || '#f5f5f5',
        logo_url,
        logo_small_url,
        favicon_url,
        font_family: font_family || 'Roboto, "Helvetica Neue", sans-serif',
        font_size_base: font_size_base || '14px',
        custom_css,
        sidebar_color: sidebar_color || '#ffffff',
        header_color: header_color || '#ffffff',
        button_border_radius: button_border_radius || '4px',
        settings: settings || {},
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'UI_THEME',
        entity_id: theme.id,
        description: `Created UI theme: ${theme.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        new_values: req.body
      });
      
      return res.status(201).json({
        success: true,
        message: 'UI theme created successfully',
        data: theme
      });
    } catch (error) {
      console.error('Error creating UI theme:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create UI theme',
        error: error.message
      });
    }
  }
  
  /**
   * Update a UI theme
   */
  async updateUITheme(req, res) {
    try {
      const themeId = req.params.id;
      const tenantId = req.tenantId;
      
      // Find theme
      const theme = await UITheme.findOne({
        where: {
          id: themeId,
          tenant_id: tenantId
        }
      });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'UI theme not found'
        });
      }
      
      // If setting as default, unset any existing default
      if (req.body.is_default) {
        await UITheme.update(
          { is_default: false },
          {
            where: {
              tenant_id: tenantId,
              is_default: true,
              id: { [Op.ne]: themeId }
            }
          }
        );
      }
      
      // If setting as active, unset any existing active
      if (req.body.is_active) {
        await UITheme.update(
          { is_active: false },
          {
            where: {
              tenant_id: tenantId,
              is_active: true,
              id: { [Op.ne]: themeId }
            }
          }
        );
      }
      
      // Store old values for audit log
      const oldValues = {
        name: theme.name,
        is_active: theme.is_active,
        is_default: theme.is_default,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        text_color: theme.text_color,
        text_light_color: theme.text_light_color,
        background_color: theme.background_color,
        background_light_color: theme.background_light_color,
        logo_url: theme.logo_url,
        logo_small_url: theme.logo_small_url,
        favicon_url: theme.favicon_url,
        font_family: theme.font_family,
        font_size_base: theme.font_size_base,
        custom_css: theme.custom_css,
        sidebar_color: theme.sidebar_color,
        header_color: theme.header_color,
        button_border_radius: theme.button_border_radius,
        settings: theme.settings
      };
      
      // Update theme
      await theme.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'UI_THEME',
        entity_id: themeId,
        description: `Updated UI theme: ${theme.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: req.body
      });
      
      return res.status(200).json({
        success: true,
        message: 'UI theme updated successfully',
        data: theme
      });
    } catch (error) {
      console.error('Error updating UI theme:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update UI theme',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a UI theme
   */
  async deleteUITheme(req, res) {
    try {
      const themeId = req.params.id;
      const tenantId = req.tenantId;
      
      // Find theme
      const theme = await UITheme.findOne({
        where: {
          id: themeId,
          tenant_id: tenantId
        }
      });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'UI theme not found'
        });
      }
      
      // Check if theme is default
      if (theme.is_default) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete default UI theme'
        });
      }
      
      // Check if theme is active
      if (theme.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete active UI theme'
        });
      }
      
      // Store theme data for audit log
      const themeData = {
        id: theme.id,
        name: theme.name,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color
      };
      
      // Delete theme
      await theme.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'UI_THEME',
        entity_id: themeId,
        description: `Deleted UI theme: ${themeData.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: themeData
      });
      
      return res.status(200).json({
        success: true,
        message: 'UI theme deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting UI theme:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete UI theme',
        error: error.message
      });
    }
  }
  
  /**
   * Set UI theme as active
   */
  async setActiveUITheme(req, res) {
    try {
      const themeId = req.params.id;
      const tenantId = req.tenantId;
      
      // Find theme
      const theme = await UITheme.findOne({
        where: {
          id: themeId,
          tenant_id: tenantId
        }
      });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'UI theme not found'
        });
      }
      
      // Unset any existing active theme
      await UITheme.update(
        { is_active: false },
        {
          where: {
            tenant_id: tenantId,
            is_active: true,
            id: { [Op.ne]: themeId }
          }
        }
      );
      
      // Set theme as active
      await theme.update({
        is_active: true,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'UI_THEME',
        entity_id: themeId,
        description: `Set UI theme as active: ${theme.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: { is_active: false },
        new_values: { is_active: true }
      });
      
      return res.status(200).json({
        success: true,
        message: 'UI theme set as active successfully',
        data: theme
      });
    } catch (error) {
      console.error('Error setting active UI theme:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to set active UI theme',
        error: error.message
      });
    }
  }
  
  /**
   * Upload logo for UI theme
   */
  async uploadLogo(req, res) {
    try {
      const themeId = req.params.id;
      const tenantId = req.tenantId;
      const logoType = req.params.type; // 'logo', 'logo_small', or 'favicon'
      
      // Find theme
      const theme = await UITheme.findOne({
        where: {
          id: themeId,
          tenant_id: tenantId
        }
      });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'UI theme not found'
        });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      // Get file path
      const filePath = req.file.path;
      const fileUrl = `/uploads/themes/${req.file.filename}`;
      
      // Update theme with new logo URL
      const updateData = {};
      
      switch (logoType) {
        case 'logo':
          updateData.logo_url = fileUrl;
          break;
        case 'logo_small':
          updateData.logo_small_url = fileUrl;
          break;
        case 'favicon':
          updateData.favicon_url = fileUrl;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid logo type'
          });
      }
      
      // Store old values for audit log
      const oldValues = {
        logo_url: theme.logo_url,
        logo_small_url: theme.logo_small_url,
        favicon_url: theme.favicon_url
      };
      
      // Update theme
      await theme.update({
        ...updateData,
        updated_by: req.userId,
        updated_at: new Date()
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'UPDATE',
        entity_type: 'UI_THEME',
        entity_id: themeId,
        description: `Uploaded ${logoType} for UI theme: ${theme.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: oldValues,
        new_values: updateData
      });
      
      return res.status(200).json({
        success: true,
        message: `${logoType} uploaded successfully`,
        data: {
          file_url: fileUrl
        }
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload logo',
        error: error.message
      });
    }
  }
  
  /**
   * Generate CSS for UI theme
   */
  async generateCSS(req, res) {
    try {
      const themeId = req.params.id;
      const tenantId = req.tenantId;
      
      // Find theme
      const theme = await UITheme.findOne({
        where: {
          id: themeId,
          tenant_id: tenantId
        }
      });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'UI theme not found'
        });
      }
      
      // Generate CSS
      const css = `
/* Generated CSS for theme: ${theme.name} */
:root {
  --primary-color: ${theme.primary_color};
  --secondary-color: ${theme.secondary_color};
  --text-color: ${theme.text_color};
  --text-light-color: ${theme.text_light_color};
  --background-color: ${theme.background_color};
  --background-light-color: ${theme.background_light_color};
  --sidebar-color: ${theme.sidebar_color};
  --header-color: ${theme.header_color};
  --button-border-radius: ${theme.button_border_radius};
  --font-family: ${theme.font_family};
  --font-size-base: ${theme.font_size_base};
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-color);
  background-color: var(--background-light-color);
}

.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  border-radius: var(--button-border-radius);
}

.btn-secondary {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  border-radius: var(--button-border-radius);
}

.app-header {
  background-color: var(--header-color);
}

.app-sidebar {
  background-color: var(--sidebar-color);
}

.card {
  background-color: var(--background-color);
  color: var(--text-color);
}

/* Custom CSS */
${theme.custom_css || ''}
      `;
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'GENERATE',
        entity_type: 'UI_THEME_CSS',
        entity_id: themeId,
        description: `Generated CSS for UI theme: ${theme.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: {
          css,
          theme
        }
      });
    } catch (error) {
      console.error('Error generating CSS:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate CSS',
        error: error.message
      });
    }
  }
  
  /**
   * Create default UI theme for tenant
   */
  async createDefaultUITheme(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Check if tenant already has themes
      const existingThemes = await UITheme.count({
        where: {
          tenant_id: tenantId
        }
      });
      
      if (existingThemes > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tenant already has UI themes'
        });
      }
      
      // Create default theme
      const theme = await UITheme.create({
        tenant_id: tenantId,
        name: 'Default Theme',
        is_active: true,
        is_default: true,
        primary_color: '#3f51b5',
        secondary_color: '#f50057',
        text_color: '#212121',
        text_light_color: '#ffffff',
        background_color: '#ffffff',
        background_light_color: '#f5f5f5',
        font_family: 'Roboto, "Helvetica Neue", sans-serif',
        font_size_base: '14px',
        sidebar_color: '#ffffff',
        header_color: '#ffffff',
        button_border_radius: '4px',
        created_by: req.userId,
        updated_by: req.userId
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: req.userId,
        action: 'CREATE',
        entity_type: 'UI_THEME',
        entity_id: theme.id,
        description: 'Created default UI theme',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(201).json({
        success: true,
        message: 'Default UI theme created successfully',
        data: theme
      });
    } catch (error) {
      console.error('Error creating default UI theme:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create default UI theme',
        error: error.message
      });
    }
  }
}

module.exports = new UIThemeController();
