// Ajmaa Integration Controller for Adalalegalis
// This controller handles HTTP endpoints for Ajmaa integration

const express = require('express');
const ajmaaService = require('./ajmaa.service');
const { authenticateUser, authorizeRole } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * @route GET /api/integration/ajmaa/status
 * @desc Check Ajmaa service status
 * @access Private (Admin)
 */
router.get('/status', 
  authenticateUser, 
  authorizeRole(['admin', 'manager']), 
  async (req, res) => {
    try {
      const status = await ajmaaService.checkServiceStatus();
      return res.status(200).json(status);
    } catch (error) {
      logger.error('Failed to check Ajmaa service status', { error: error.message });
      return res.status(500).json({ message: 'Failed to check Ajmaa service status', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/ajmaa/documents
 * @desc Create a new document in Ajmaa
 * @access Private (Lawyer, Admin)
 */
router.post('/documents',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager']),
  validateRequest({
    body: {
      documentType: { type: 'string', required: true },
      title: { type: 'string', required: true },
      content: { type: 'string', required: true },
      parties: { type: 'array', required: true }
    }
  }),
  async (req, res) => {
    try {
      const documentData = req.body;
      
      // Add audit trail
      logger.info('Creating document in Ajmaa', { 
        userId: req.user.id, 
        documentType: documentData.documentType,
        title: documentData.title
      });
      
      const result = await ajmaaService.createDocument(documentData);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Failed to create document in Ajmaa', { error: error.message });
      return res.status(500).json({ message: 'Failed to create document in Ajmaa', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/ajmaa/documents/:documentId
 * @desc Get document details from Ajmaa
 * @access Private (Lawyer, Admin)
 */
router.get('/documents/:documentId',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const documentDetails = await ajmaaService.getDocumentDetails(documentId);
      return res.status(200).json(documentDetails);
    } catch (error) {
      logger.error('Failed to get document details from Ajmaa', { 
        error: error.message,
        documentId: req.params.documentId
      });
      return res.status(500).json({ message: 'Failed to get document details from Ajmaa', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/ajmaa/documents/:documentId/signature-requests
 * @desc Request electronic signature for a document
 * @access Private (Lawyer, Admin)
 */
router.post('/documents/:documentId/signature-requests',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager']),
  validateRequest({
    body: {
      signatories: { type: 'array', required: true }
    }
  }),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { signatories } = req.body;
      
      // Add audit trail
      logger.info('Requesting signatures in Ajmaa', { 
        userId: req.user.id, 
        documentId,
        signatoryCount: signatories.length
      });
      
      const result = await ajmaaService.requestSignature(documentId, signatories);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Failed to request signatures in Ajmaa', { 
        error: error.message,
        documentId: req.params.documentId
      });
      return res.status(500).json({ message: 'Failed to request signatures in Ajmaa', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/ajmaa/documents/:documentId/signature-requests/:requestId
 * @desc Check signature status for a document
 * @access Private (Lawyer, Admin)
 */
router.get('/documents/:documentId/signature-requests/:requestId',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { documentId, requestId } = req.params;
      const statusDetails = await ajmaaService.checkSignatureStatus(documentId, requestId);
      return res.status(200).json(statusDetails);
    } catch (error) {
      logger.error('Failed to check signature status in Ajmaa', { 
        error: error.message,
        documentId: req.params.documentId,
        requestId: req.params.requestId
      });
      return res.status(500).json({ message: 'Failed to check signature status in Ajmaa', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/ajmaa/documents/:documentId/verify
 * @desc Verify a signed document
 * @access Private (Lawyer, Admin)
 */
router.get('/documents/:documentId/verify',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const verificationResult = await ajmaaService.verifyDocument(documentId);
      return res.status(200).json(verificationResult);
    } catch (error) {
      logger.error('Failed to verify document in Ajmaa', { 
        error: error.message,
        documentId: req.params.documentId
      });
      return res.status(500).json({ message: 'Failed to verify document in Ajmaa', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/ajmaa/documents/:documentId/download
 * @desc Download a document
 * @access Private (Lawyer, Admin)
 */
router.get('/documents/:documentId/download',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { format } = req.query;
      const documentContent = await ajmaaService.downloadDocument(documentId, format);
      return res.status(200).json(documentContent);
    } catch (error) {
      logger.error('Failed to download document from Ajmaa', { 
        error: error.message,
        documentId: req.params.documentId
      });
      return res.status(500).json({ message: 'Failed to download document from Ajmaa', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/ajmaa/documents/:documentId/share
 * @desc Share a document with other parties
 * @access Private (Lawyer, Admin)
 */
router.post('/documents/:documentId/share',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager']),
  validateRequest({
    body: {
      recipients: { type: 'array', required: true }
    }
  }),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { recipients } = req.body;
      
      // Add audit trail
      logger.info('Sharing document in Ajmaa', { 
        userId: req.user.id, 
        documentId,
        recipientCount: recipients.length
      });
      
      const result = await ajmaaService.shareDocument(documentId, recipients);
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Failed to share document in Ajmaa', { 
        error: error.message,
        documentId: req.params.documentId
      });
      return res.status(500).json({ message: 'Failed to share document in Ajmaa', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/ajmaa/documents/search
 * @desc Search for documents by criteria
 * @access Private (Lawyer, Admin)
 */
router.post('/documents/search',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const searchCriteria = req.body;
      const searchResults = await ajmaaService.searchDocuments(searchCriteria);
      return res.status(200).json(searchResults);
    } catch (error) {
      logger.error('Failed to search documents in Ajmaa', { 
        error: error.message
      });
      return res.status(500).json({ message: 'Failed to search documents in Ajmaa', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/ajmaa/templates
 * @desc Get document templates
 * @access Private (Lawyer, Admin)
 */
router.get('/templates',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const templates = await ajmaaService.getTemplates();
      return res.status(200).json(templates);
    } catch (error) {
      logger.error('Failed to get templates from Ajmaa', { 
        error: error.message
      });
      return res.status(500).json({ message: 'Failed to get templates from Ajmaa', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/ajmaa/documents/from-template
 * @desc Create document from template
 * @access Private (Lawyer, Admin)
 */
router.post('/documents/from-template',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager']),
  validateRequest({
    body: {
      templateId: { type: 'string', required: true },
      templateData: { type: 'object', required: true }
    }
  }),
  async (req, res) => {
    try {
      const { templateId, templateData } = req.body;
      
      // Add audit trail
      logger.info('Creating document from template in Ajmaa', { 
        userId: req.user.id, 
        templateId
      });
      
      const result = await ajmaaService.createFromTemplate(templateId, templateData);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Failed to create document from template in Ajmaa', { 
        error: error.message
      });
      return res.status(500).json({ message: 'Failed to create document from template in Ajmaa', error: error.message });
    }
  }
);

module.exports = router;
