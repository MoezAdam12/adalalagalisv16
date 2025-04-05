const Language = require('../models/language.model');
const AuditLog = require('../models/audit-log.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Language controller for managing supported languages in the application
 */
class LanguageController {
  /**
   * Get all languages
   */
  async getLanguages(req, res) {
    try {
      const { is_active } = req.query;
      
      const whereClause = {};
      
      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }
      
      const languages = await Language.findAll({
        where: whereClause,
        order: [
          ['sort_order', 'ASC'],
          ['name', 'ASC']
        ]
      });
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'LANGUAGES',
        description: 'Viewed languages list',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: languages
      });
    } catch (error) {
      console.error('Error getting languages:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get languages',
        error: error.message
      });
    }
  }
  
  /**
   * Get language by ID
   */
  async getLanguageById(req, res) {
    try {
      const languageId = req.params.id;
      
      const language = await Language.findByPk(languageId);
      
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found'
        });
      }
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'READ',
        entity_type: 'LANGUAGE',
        entity_id: language.id,
        description: `Viewed language: ${language.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        data: language
      });
    } catch (error) {
      console.error('Error getting language:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get language',
        error: error.message
      });
    }
  }
  
  /**
   * Create new language
   */
  async createLanguage(req, res) {
    try {
      const {
        code,
        name,
        native_name,
        flag_icon,
        text_direction,
        is_active,
        is_default,
        sort_order
      } = req.body;
      
      // Validate required fields
      if (!code || !name || !native_name) {
        return res.status(400).json({
          success: false,
          message: 'Language code, name, and native name are required'
        });
      }
      
      // Check if language with same code already exists
      const existingLanguage = await Language.findOne({
        where: {
          code
        }
      });
      
      if (existingLanguage) {
        return res.status(400).json({
          success: false,
          message: `Language with code '${code}' already exists`
        });
      }
      
      // Begin transaction
      const transaction = await sequelize.transaction();
      
      try {
        // If setting as default, unset current default
        if (is_default) {
          await Language.update(
            { is_default: false },
            { 
              where: { is_default: true },
              transaction
            }
          );
        }
        
        // Create language
        const language = await Language.create({
          code,
          name,
          native_name,
          flag_icon: flag_icon || null,
          text_direction: text_direction || 'ltr',
          is_active: is_active !== undefined ? is_active : true,
          is_default: is_default || false,
          sort_order: sort_order || 0,
          created_by: req.userId,
          updated_by: req.userId
        }, { transaction });
        
        // Log audit
        await AuditLog.create({
          tenant_id: req.tenantId,
          user_id: req.userId,
          action: 'CREATE',
          entity_type: 'LANGUAGE',
          entity_id: language.id,
          description: `Created language: ${language.name}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }, { transaction });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(201).json({
          success: true,
          message: 'Language created successfully',
          data: language
        });
      } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error creating language:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create language',
        error: error.message
      });
    }
  }
  
  /**
   * Update language
   */
  async updateLanguage(req, res) {
    try {
      const languageId = req.params.id;
      const {
        name,
        native_name,
        flag_icon,
        text_direction,
        is_active,
        is_default,
        sort_order
      } = req.body;
      
      // Find language
      const language = await Language.findByPk(languageId);
      
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found'
        });
      }
      
      // Store old values for audit log
      const oldValues = {
        name: language.name,
        native_name: language.native_name,
        flag_icon: language.flag_icon,
        text_direction: language.text_direction,
        is_active: language.is_active,
        is_default: language.is_default,
        sort_order: language.sort_order
      };
      
      // Begin transaction
      const transaction = await sequelize.transaction();
      
      try {
        // If setting as default, unset current default
        if (is_default && !language.is_default) {
          await Language.update(
            { is_default: false },
            { 
              where: { is_default: true },
              transaction
            }
          );
        }
        
        // Update language
        await language.update({
          name: name || language.name,
          native_name: native_name || language.native_name,
          flag_icon: flag_icon !== undefined ? flag_icon : language.flag_icon,
          text_direction: text_direction || language.text_direction,
          is_active: is_active !== undefined ? is_active : language.is_active,
          is_default: is_default !== undefined ? is_default : language.is_default,
          sort_order: sort_order !== undefined ? sort_order : language.sort_order,
          updated_by: req.userId,
          updated_at: new Date()
        }, { transaction });
        
        // Log audit
        await AuditLog.create({
          tenant_id: req.tenantId,
          user_id: req.userId,
          action: 'UPDATE',
          entity_type: 'LANGUAGE',
          entity_id: language.id,
          description: `Updated language: ${language.name}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          old_values: oldValues,
          new_values: {
            name: language.name,
            native_name: language.native_name,
            flag_icon: language.flag_icon,
            text_direction: language.text_direction,
            is_active: language.is_active,
            is_default: language.is_default,
            sort_order: language.sort_order
          }
        }, { transaction });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(200).json({
          success: true,
          message: 'Language updated successfully',
          data: language
        });
      } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating language:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update language',
        error: error.message
      });
    }
  }
  
  /**
   * Delete language
   */
  async deleteLanguage(req, res) {
    try {
      const languageId = req.params.id;
      
      // Find language
      const language = await Language.findByPk(languageId);
      
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found'
        });
      }
      
      // Check if language is default
      if (language.is_default) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete default language'
        });
      }
      
      // Store language data for audit log
      const languageData = {
        id: language.id,
        code: language.code,
        name: language.name,
        native_name: language.native_name
      };
      
      // Delete language
      await language.destroy();
      
      // Log audit
      await AuditLog.create({
        tenant_id: req.tenantId,
        user_id: req.userId,
        action: 'DELETE',
        entity_type: 'LANGUAGE',
        entity_id: languageId,
        description: `Deleted language: ${languageData.name}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        old_values: languageData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Language deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting language:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete language',
        error: error.message
      });
    }
  }
  
  /**
   * Set language as default
   */
  async setDefaultLanguage(req, res) {
    try {
      const languageId = req.params.id;
      
      // Find language
      const language = await Language.findByPk(languageId);
      
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found'
        });
      }
      
      // Check if language is already default
      if (language.is_default) {
        return res.status(400).json({
          success: false,
          message: 'Language is already set as default'
        });
      }
      
      // Begin transaction
      const transaction = await sequelize.transaction();
      
      try {
        // Unset current default language
        await Language.update(
          { is_default: false },
          { 
            where: { is_default: true },
            transaction
          }
        );
        
        // Set new default language
        await language.update({
          is_default: true,
          updated_by: req.userId,
          updated_at: new Date()
        }, { transaction });
        
        // Log audit
        await AuditLog.create({
          tenant_id: req.tenantId,
          user_id: req.userId,
          action: 'UPDATE',
          entity_type: 'LANGUAGE',
          entity_id: language.id,
          description: `Set language as default: ${language.name}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          old_values: { is_default: false },
          new_values: { is_default: true }
        }, { transaction });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(200).json({
          success: true,
          message: 'Language set as default successfully',
          data: language
        });
      } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error setting default language:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to set default language',
        error: error.message
      });
    }
  }
  
  /**
   * Get available language text directions
   */
  async getLanguageTextDirections(req, res) {
    try {
      const textDirections = [
        { value: 'ltr', label: 'من اليسار إلى اليمين (LTR)' },
        { value: 'rtl', label: 'من اليمين إلى اليسار (RTL)' }
      ];
      
      return res.status(200).json({
        success: true,
        data: textDirections
      });
    } catch (error) {
      console.error('Error getting language text directions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get language text directions',
        error: error.message
      });
    }
  }
  
  /**
   * Get common languages
   */
  async getCommonLanguages(req, res) {
    try {
      const commonLanguages = [
        { code: 'ar', name: 'Arabic', native_name: 'العربية', text_direction: 'rtl', flag_icon: 'sa' },
        { code: 'en', name: 'English', native_name: 'English', text_direction: 'ltr', flag_icon: 'us' },
        { code: 'fr', name: 'French', native_name: 'Français', text_direction: 'ltr', flag_icon: 'fr' },
        { code: 'es', name: 'Spanish', native_name: 'Español', text_direction: 'ltr', flag_icon: 'es' },
        { code: 'de', name: 'German', native_name: 'Deutsch', text_direction: 'ltr', flag_icon: 'de' },
        { code: 'zh', name: 'Chinese', native_name: '中文', text_direction: 'ltr', flag_icon: 'cn' },
        { code: 'ru', name: 'Russian', native_name: 'Русский', text_direction: 'ltr', flag_icon: 'ru' },
        { code: 'ja', name: 'Japanese', native_name: '日本語', text_direction: 'ltr', flag_icon: 'jp' },
        { code: 'pt', name: 'Portuguese', native_name: 'Português', text_direction: 'ltr', flag_icon: 'pt' },
        { code: 'it', name: 'Italian', native_name: 'Italiano', text_direction: 'ltr', flag_icon: 'it' },
        { code: 'nl', name: 'Dutch', native_name: 'Nederlands', text_direction: 'ltr', flag_icon: 'nl' },
        { code: 'tr', name: 'Turkish', native_name: 'Türkçe', text_direction: 'ltr', flag_icon: 'tr' },
        { code: 'fa', name: 'Persian', native_name: 'فارسی', text_direction: 'rtl', flag_icon: 'ir' },
        { code: 'ur', name: 'Urdu', native_name: 'اردو', text_direction: 'rtl', flag_icon: 'pk' },
        { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', text_direction: 'ltr', flag_icon: 'in' }
      ];
      
      return res.status(200).json({
        success: true,
        data: commonLanguages
      });
    } catch (error) {
      console.error('Error getting common languages:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get common languages',
        error: error.message
      });
    }
  }
  
  /**
   * Import common language
   */
  async importCommonLanguage(req, res) {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Language code is required'
        });
      }
      
      // Get common languages
      const commonLanguagesResponse = await this.getCommonLanguages({}, {
        status: () => {
          return { json: (data) => data };
        }
      });
      
      if (!commonLanguagesResponse.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get common languages'
        });
      }
      
      // Find language with matching code
      const commonLanguage = commonLanguagesResponse.data.find(language => language.code === code);
      
      if (!commonLanguage) {
        return res.status(404).json({
          success: false,
          message: `Common language with code '${code}' not found`
        });
      }
      
      // Check if language with same code already exists
      const existingLanguage = await Language.findOne({
        where: {
          code
        }
      });
      
      if (existingLanguage) {
        return res.status(400).json({
          success: false,
          message: `Language with code '${code}' already exists`
        });
      }
      
      // Begin transaction
      const transaction = await sequelize.transaction();
      
      try {
        // Check if this is the first language
        const languageCount = await Language.count();
        const isFirstLanguage = languageCount === 0;
        
        // Create language
        const language = await Language.create({
          code: commonLanguage.code,
          name: commonLanguage.name,
          native_name: commonLanguage.native_name,
          flag_icon: commonLanguage.flag_icon,
          text_direction: commonLanguage.text_direction,
          is_active: true,
          is_default: isFirstLanguage, // Set as default if it's the first language
          sort_order: languageCount,
          created_by: req.userId,
          updated_by: req.userId
        }, { transaction });
        
        // Log audit
        await AuditLog.create({
          tenant_id: req.tenantId,
          user_id: req.userId,
          action: 'CREATE',
          entity_type: 'LANGUAGE',
          entity_id: language.id,
          description: `Imported common language: ${language.name}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }, { transaction });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(201).json({
          success: true,
          message: 'Common language imported successfully',
          data: language
        });
      } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error importing common language:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to import common language',
        error: error.message
      });
    }
  }
  
  /**
   * Update language sort order
   */
  async updateLanguageSortOrder(req, res) {
    try {
      const { languages } = req.body;
      
      if (!languages || !Array.isArray(languages)) {
        return res.status(400).json({
          success: false,
          message: 'Languages array is required'
        });
      }
      
      // Begin transaction
      const transaction = await sequelize.transaction();
      
      try {
        // Update sort order for each language
        for (let i = 0; i < languages.length; i++) {
          const { id, sort_order } = languages[i];
          
          await Language.update(
            { 
              sort_order,
              updated_by: req.userId,
              updated_at: new Date()
            },
            { 
              where: { id },
              transaction
            }
          );
        }
        
        // Log audit
        await AuditLog.create({
          tenant_id: req.tenantId,
          user_id: req.userId,
          action: 'UPDATE',
          entity_type: 'LANGUAGES',
          description: 'Updated language sort order',
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }, { transaction });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(200).json({
          success: true,
          message: 'Language sort order updated successfully'
        });
      } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating language sort order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update language sort order',
        error: error.message
      });
    }
  }
}

module.exports = new LanguageController();
