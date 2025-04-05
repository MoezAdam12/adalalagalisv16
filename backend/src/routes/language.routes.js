const express = require('express');
const router = express.Router();
const languageController = require('../controllers/language.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get all languages
router.get('/', authMiddleware.hasPermission('languages:read'), languageController.getLanguages);

// Get language by ID
router.get('/:id', authMiddleware.hasPermission('languages:read'), languageController.getLanguageById);

// Create new language
router.post('/', authMiddleware.hasPermission('languages:create'), languageController.createLanguage);

// Update language
router.put('/:id', authMiddleware.hasPermission('languages:update'), languageController.updateLanguage);

// Delete language
router.delete('/:id', authMiddleware.hasPermission('languages:delete'), languageController.deleteLanguage);

// Set language as default
router.post('/:id/set-default', authMiddleware.hasPermission('languages:update'), languageController.setDefaultLanguage);

// Get available language text directions
router.get('/options/text-directions', authMiddleware.hasPermission('languages:read'), languageController.getLanguageTextDirections);

// Get common languages
router.get('/common/languages', authMiddleware.hasPermission('languages:read'), languageController.getCommonLanguages);

// Import common language
router.post('/common/import', authMiddleware.hasPermission('languages:create'), languageController.importCommonLanguage);

// Update language sort order
router.post('/sort-order', authMiddleware.hasPermission('languages:update'), languageController.updateLanguageSortOrder);

module.exports = router;
