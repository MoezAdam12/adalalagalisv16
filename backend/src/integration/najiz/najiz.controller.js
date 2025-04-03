// Najiz Integration Controller for Adalalegalis
// This controller handles HTTP endpoints for Najiz integration

const express = require('express');
const najizService = require('./najiz.service');
const { authenticateUser, authorizeRole } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * @route GET /api/integration/najiz/status
 * @desc Check Najiz service status
 * @access Private (Admin)
 */
router.get('/status', 
  authenticateUser, 
  authorizeRole(['admin', 'manager']), 
  async (req, res) => {
    try {
      const status = await najizService.checkServiceStatus();
      return res.status(200).json(status);
    } catch (error) {
      logger.error('Failed to check Najiz service status', { error: error.message });
      return res.status(500).json({ message: 'Failed to check Najiz service status', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/najiz/cases
 * @desc Submit a new case to Najiz
 * @access Private (Lawyer, Admin)
 */
router.post('/cases',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager']),
  validateRequest({
    body: {
      caseType: { type: 'string', required: true },
      courtId: { type: 'string', required: true },
      plaintiffId: { type: 'string', required: true },
      plaintiffName: { type: 'string', required: true },
      defendantId: { type: 'string', required: true },
      defendantName: { type: 'string', required: true },
      caseDetails: { type: 'string', required: true }
    }
  }),
  async (req, res) => {
    try {
      const caseData = req.body;
      
      // Add audit trail
      logger.info('Submitting case to Najiz', { 
        userId: req.user.id, 
        caseType: caseData.caseType,
        plaintiffName: caseData.plaintiffName,
        defendantName: caseData.defendantName
      });
      
      const result = await najizService.submitCase(caseData);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Failed to submit case to Najiz', { error: error.message });
      return res.status(500).json({ message: 'Failed to submit case to Najiz', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/najiz/cases/:caseNumber
 * @desc Get case details from Najiz
 * @access Private (Lawyer, Admin)
 */
router.get('/cases/:caseNumber',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { caseNumber } = req.params;
      const caseDetails = await najizService.getCaseDetails(caseNumber);
      return res.status(200).json(caseDetails);
    } catch (error) {
      logger.error('Failed to get case details from Najiz', { 
        error: error.message,
        caseNumber: req.params.caseNumber
      });
      return res.status(500).json({ message: 'Failed to get case details from Najiz', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/najiz/cases/:caseNumber/documents
 * @desc Submit documents for an existing case
 * @access Private (Lawyer, Admin)
 */
router.post('/cases/:caseNumber/documents',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager']),
  validateRequest({
    body: {
      documents: { type: 'array', required: true }
    }
  }),
  async (req, res) => {
    try {
      const { caseNumber } = req.params;
      const { documents } = req.body;
      
      // Add audit trail
      logger.info('Submitting documents to Najiz', { 
        userId: req.user.id, 
        caseNumber,
        documentCount: documents.length
      });
      
      const result = await najizService.submitDocuments(caseNumber, documents);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Failed to submit documents to Najiz', { 
        error: error.message,
        caseNumber: req.params.caseNumber
      });
      return res.status(500).json({ message: 'Failed to submit documents to Najiz', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/najiz/cases/:caseNumber/hearings
 * @desc Get hearing schedule for a case
 * @access Private (Lawyer, Admin)
 */
router.get('/cases/:caseNumber/hearings',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { caseNumber } = req.params;
      const hearings = await najizService.getHearingSchedule(caseNumber);
      return res.status(200).json(hearings);
    } catch (error) {
      logger.error('Failed to get hearing schedule from Najiz', { 
        error: error.message,
        caseNumber: req.params.caseNumber
      });
      return res.status(500).json({ message: 'Failed to get hearing schedule from Najiz', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/najiz/cases/:caseNumber/status-updates
 * @desc Get case status updates
 * @access Private (Lawyer, Admin)
 */
router.get('/cases/:caseNumber/status-updates',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { caseNumber } = req.params;
      const statusUpdates = await najizService.getCaseStatusUpdates(caseNumber);
      return res.status(200).json(statusUpdates);
    } catch (error) {
      logger.error('Failed to get case status updates from Najiz', { 
        error: error.message,
        caseNumber: req.params.caseNumber
      });
      return res.status(500).json({ message: 'Failed to get case status updates from Najiz', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/najiz/cases/:caseNumber/petitions
 * @desc Submit a petition or request related to a case
 * @access Private (Lawyer, Admin)
 */
router.post('/cases/:caseNumber/petitions',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager']),
  validateRequest({
    body: {
      petitionType: { type: 'string', required: true },
      details: { type: 'string', required: true }
    }
  }),
  async (req, res) => {
    try {
      const { caseNumber } = req.params;
      const petitionData = req.body;
      
      // Add audit trail
      logger.info('Submitting petition to Najiz', { 
        userId: req.user.id, 
        caseNumber,
        petitionType: petitionData.petitionType
      });
      
      const result = await najizService.submitPetition(caseNumber, petitionData);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Failed to submit petition to Najiz', { 
        error: error.message,
        caseNumber: req.params.caseNumber
      });
      return res.status(500).json({ message: 'Failed to submit petition to Najiz', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/najiz/cases/:caseNumber/judgments
 * @desc Get judgments for a case
 * @access Private (Lawyer, Admin)
 */
router.get('/cases/:caseNumber/judgments',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const { caseNumber } = req.params;
      const judgments = await najizService.getJudgments(caseNumber);
      return res.status(200).json(judgments);
    } catch (error) {
      logger.error('Failed to get judgments from Najiz', { 
        error: error.message,
        caseNumber: req.params.caseNumber
      });
      return res.status(500).json({ message: 'Failed to get judgments from Najiz', error: error.message });
    }
  }
);

/**
 * @route POST /api/integration/najiz/cases/search
 * @desc Search for cases by criteria
 * @access Private (Lawyer, Admin)
 */
router.post('/cases/search',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const searchCriteria = req.body;
      const searchResults = await najizService.searchCases(searchCriteria);
      return res.status(200).json(searchResults);
    } catch (error) {
      logger.error('Failed to search cases in Najiz', { 
        error: error.message
      });
      return res.status(500).json({ message: 'Failed to search cases in Najiz', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/najiz/courts
 * @desc Get available courts list
 * @access Private (Lawyer, Admin)
 */
router.get('/courts',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const courts = await najizService.getCourts();
      return res.status(200).json(courts);
    } catch (error) {
      logger.error('Failed to get courts list from Najiz', { 
        error: error.message
      });
      return res.status(500).json({ message: 'Failed to get courts list from Najiz', error: error.message });
    }
  }
);

/**
 * @route GET /api/integration/najiz/case-types
 * @desc Get case types
 * @access Private (Lawyer, Admin)
 */
router.get('/case-types',
  authenticateUser,
  authorizeRole(['admin', 'lawyer', 'manager', 'paralegal']),
  async (req, res) => {
    try {
      const caseTypes = await najizService.getCaseTypes();
      return res.status(200).json(caseTypes);
    } catch (error) {
      logger.error('Failed to get case types from Najiz', { 
        error: error.message
      });
      return res.status(500).json({ message: 'Failed to get case types from Najiz', error: error.message });
    }
  }
);

module.exports = router;
