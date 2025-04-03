// Najiz Integration Service for Adalalegalis
// This service handles integration with the Saudi Ministry of Justice's Najiz platform
// for electronic case filing and management

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class NajizService {
  constructor() {
    this.baseUrl = process.env.NAJIZ_API_BASE_URL || 'https://api.najiz.sa';
    this.apiKey = process.env.NAJIZ_API_KEY;
    this.secretKey = process.env.NAJIZ_SECRET_KEY;
    this.clientId = process.env.NAJIZ_CLIENT_ID;
    
    if (!this.apiKey || !this.secretKey || !this.clientId) {
      logger.error('Najiz integration: Missing required environment variables');
      throw new Error('Najiz integration configuration is incomplete. Please check environment variables.');
    }
  }

  /**
   * Generate authentication headers for Najiz API
   * @returns {Object} Headers object with authentication details
   */
  generateAuthHeaders() {
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Create signature based on Najiz requirements
    const signatureBase = `${this.clientId}:${timestamp}:${nonce}:${this.secretKey}`;
    const signature = crypto.createHmac('sha256', this.secretKey)
      .update(signatureBase)
      .digest('base64');
    
    return {
      'X-Najiz-Client-Id': this.clientId,
      'X-Najiz-Timestamp': timestamp,
      'X-Najiz-Nonce': nonce,
      'X-Najiz-Signature': signature,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Make authenticated request to Najiz API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request payload
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = this.generateAuthHeaders();
      
      const response = await axios({
        method,
        url,
        headers,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined
      });
      
      logger.info(`Najiz API request successful: ${method} ${endpoint}`);
      return response.data;
    } catch (error) {
      logger.error(`Najiz API request failed: ${method} ${endpoint}`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      throw new Error(`Najiz API request failed: ${error.message}`);
    }
  }

  /**
   * Check Najiz service status
   * @returns {Promise<Object>} Service status information
   */
  async checkServiceStatus() {
    return this.makeRequest('/v1/status', 'GET');
  }

  /**
   * Submit a new case to Najiz
   * @param {Object} caseData - Case information
   * @returns {Promise<Object>} Submitted case details with Najiz reference number
   */
  async submitCase(caseData) {
    // Validate required case data
    const requiredFields = ['caseType', 'courtId', 'plaintiffId', 'plaintiffName', 'defendantId', 'defendantName', 'caseDetails'];
    for (const field of requiredFields) {
      if (!caseData[field]) {
        throw new Error(`Missing required field for Najiz case submission: ${field}`);
      }
    }
    
    return this.makeRequest('/v1/cases', 'POST', caseData);
  }

  /**
   * Get case details from Najiz
   * @param {string} caseNumber - Najiz case reference number
   * @returns {Promise<Object>} Case details
   */
  async getCaseDetails(caseNumber) {
    if (!caseNumber) {
      throw new Error('Case number is required');
    }
    
    return this.makeRequest(`/v1/cases/${caseNumber}`, 'GET');
  }

  /**
   * Submit documents for an existing case
   * @param {string} caseNumber - Najiz case reference number
   * @param {Array} documents - Array of document objects with file paths and metadata
   * @returns {Promise<Object>} Document submission result
   */
  async submitDocuments(caseNumber, documents) {
    if (!caseNumber) {
      throw new Error('Case number is required');
    }
    
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('At least one document is required');
    }
    
    const formData = new FormData();
    formData.append('caseNumber', caseNumber);
    
    // Process each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      if (!doc.filePath || !doc.documentType) {
        throw new Error(`Document at index ${i} is missing required fields`);
      }
      
      // Read file and convert to base64
      const fileContent = fs.readFileSync(doc.filePath);
      const base64Content = fileContent.toString('base64');
      
      formData.append(`documents[${i}][content]`, base64Content);
      formData.append(`documents[${i}][fileName]`, path.basename(doc.filePath));
      formData.append(`documents[${i}][documentType]`, doc.documentType);
      formData.append(`documents[${i}][description]`, doc.description || '');
    }
    
    return this.makeRequest(`/v1/cases/${caseNumber}/documents`, 'POST', formData);
  }

  /**
   * Get hearing schedule for a case
   * @param {string} caseNumber - Najiz case reference number
   * @returns {Promise<Array>} List of scheduled hearings
   */
  async getHearingSchedule(caseNumber) {
    if (!caseNumber) {
      throw new Error('Case number is required');
    }
    
    return this.makeRequest(`/v1/cases/${caseNumber}/hearings`, 'GET');
  }

  /**
   * Get case status updates
   * @param {string} caseNumber - Najiz case reference number
   * @returns {Promise<Array>} List of status updates
   */
  async getCaseStatusUpdates(caseNumber) {
    if (!caseNumber) {
      throw new Error('Case number is required');
    }
    
    return this.makeRequest(`/v1/cases/${caseNumber}/status-updates`, 'GET');
  }

  /**
   * Submit a petition or request related to a case
   * @param {string} caseNumber - Najiz case reference number
   * @param {Object} petitionData - Petition details
   * @returns {Promise<Object>} Petition submission result
   */
  async submitPetition(caseNumber, petitionData) {
    if (!caseNumber) {
      throw new Error('Case number is required');
    }
    
    if (!petitionData.petitionType || !petitionData.details) {
      throw new Error('Petition type and details are required');
    }
    
    return this.makeRequest(`/v1/cases/${caseNumber}/petitions`, 'POST', petitionData);
  }

  /**
   * Get judgments for a case
   * @param {string} caseNumber - Najiz case reference number
   * @returns {Promise<Array>} List of judgments
   */
  async getJudgments(caseNumber) {
    if (!caseNumber) {
      throw new Error('Case number is required');
    }
    
    return this.makeRequest(`/v1/cases/${caseNumber}/judgments`, 'GET');
  }

  /**
   * Search for cases by criteria
   * @param {Object} searchCriteria - Search parameters
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchCases(searchCriteria) {
    return this.makeRequest('/v1/cases/search', 'POST', searchCriteria);
  }

  /**
   * Get available courts list
   * @returns {Promise<Array>} List of courts
   */
  async getCourts() {
    return this.makeRequest('/v1/courts', 'GET');
  }

  /**
   * Get case types
   * @returns {Promise<Array>} List of case types
   */
  async getCaseTypes() {
    return this.makeRequest('/v1/case-types', 'GET');
  }
}

module.exports = new NajizService();
