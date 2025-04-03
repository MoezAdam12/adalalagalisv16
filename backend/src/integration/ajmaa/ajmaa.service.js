// Ajmaa Integration Service for Adalalegalis
// This service handles integration with the Saudi Ajmaa platform
// for electronic legal document management and verification

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class AjmaaService {
  constructor() {
    this.baseUrl = process.env.AJMAA_API_BASE_URL || 'https://api.ajmaa.gov.sa';
    this.apiKey = process.env.AJMAA_API_KEY;
    this.secretKey = process.env.AJMAA_SECRET_KEY;
    this.organizationId = process.env.AJMAA_ORGANIZATION_ID;
    
    if (!this.apiKey || !this.secretKey || !this.organizationId) {
      logger.error('Ajmaa integration: Missing required environment variables');
      throw new Error('Ajmaa integration configuration is incomplete. Please check environment variables.');
    }
  }

  /**
   * Generate authentication headers for Ajmaa API
   * @returns {Object} Headers object with authentication details
   */
  generateAuthHeaders() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Create signature based on Ajmaa requirements
    const signatureBase = `${this.organizationId}:${timestamp}:${nonce}`;
    const signature = crypto.createHmac('sha256', this.secretKey)
      .update(signatureBase)
      .digest('hex');
    
    return {
      'X-Ajmaa-API-Key': this.apiKey,
      'X-Ajmaa-Organization-ID': this.organizationId,
      'X-Ajmaa-Timestamp': timestamp,
      'X-Ajmaa-Nonce': nonce,
      'X-Ajmaa-Signature': signature,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Make authenticated request to Ajmaa API
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
      
      logger.info(`Ajmaa API request successful: ${method} ${endpoint}`);
      return response.data;
    } catch (error) {
      logger.error(`Ajmaa API request failed: ${method} ${endpoint}`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      throw new Error(`Ajmaa API request failed: ${error.message}`);
    }
  }

  /**
   * Check Ajmaa service status
   * @returns {Promise<Object>} Service status information
   */
  async checkServiceStatus() {
    return this.makeRequest('/v1/status', 'GET');
  }

  /**
   * Create a new document in Ajmaa
   * @param {Object} documentData - Document information
   * @returns {Promise<Object>} Created document details with Ajmaa reference ID
   */
  async createDocument(documentData) {
    // Validate required document data
    const requiredFields = ['documentType', 'title', 'content', 'parties'];
    for (const field of requiredFields) {
      if (!documentData[field]) {
        throw new Error(`Missing required field for Ajmaa document creation: ${field}`);
      }
    }
    
    return this.makeRequest('/v1/documents', 'POST', documentData);
  }

  /**
   * Get document details from Ajmaa
   * @param {string} documentId - Ajmaa document reference ID
   * @returns {Promise<Object>} Document details
   */
  async getDocumentDetails(documentId) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    return this.makeRequest(`/v1/documents/${documentId}`, 'GET');
  }

  /**
   * Request electronic signature for a document
   * @param {string} documentId - Ajmaa document reference ID
   * @param {Array} signatories - Array of signatory information
   * @returns {Promise<Object>} Signature request details
   */
  async requestSignature(documentId, signatories) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    if (!Array.isArray(signatories) || signatories.length === 0) {
      throw new Error('At least one signatory is required');
    }
    
    // Validate signatory information
    for (let i = 0; i < signatories.length; i++) {
      const signatory = signatories[i];
      if (!signatory.name || !signatory.nationalId || !signatory.email || !signatory.mobile) {
        throw new Error(`Signatory at index ${i} is missing required fields`);
      }
    }
    
    return this.makeRequest(`/v1/documents/${documentId}/signature-requests`, 'POST', { signatories });
  }

  /**
   * Check signature status for a document
   * @param {string} documentId - Ajmaa document reference ID
   * @param {string} requestId - Signature request ID
   * @returns {Promise<Object>} Signature status details
   */
  async checkSignatureStatus(documentId, requestId) {
    if (!documentId || !requestId) {
      throw new Error('Document ID and request ID are required');
    }
    
    return this.makeRequest(`/v1/documents/${documentId}/signature-requests/${requestId}`, 'GET');
  }

  /**
   * Verify a signed document
   * @param {string} documentId - Ajmaa document reference ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocument(documentId) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    return this.makeRequest(`/v1/documents/${documentId}/verify`, 'GET');
  }

  /**
   * Download a document
   * @param {string} documentId - Ajmaa document reference ID
   * @param {string} format - Document format (pdf, xml)
   * @returns {Promise<Object>} Document content and metadata
   */
  async downloadDocument(documentId, format = 'pdf') {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    return this.makeRequest(`/v1/documents/${documentId}/download`, 'GET', { format });
  }

  /**
   * Share a document with other parties
   * @param {string} documentId - Ajmaa document reference ID
   * @param {Array} recipients - Array of recipient information
   * @returns {Promise<Object>} Sharing result
   */
  async shareDocument(documentId, recipients) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }
    
    // Validate recipient information
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      if (!recipient.name || !recipient.email) {
        throw new Error(`Recipient at index ${i} is missing required fields`);
      }
    }
    
    return this.makeRequest(`/v1/documents/${documentId}/share`, 'POST', { recipients });
  }

  /**
   * Search for documents by criteria
   * @param {Object} searchCriteria - Search parameters
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchDocuments(searchCriteria) {
    return this.makeRequest('/v1/documents/search', 'POST', searchCriteria);
  }

  /**
   * Get document templates
   * @returns {Promise<Array>} List of available templates
   */
  async getTemplates() {
    return this.makeRequest('/v1/templates', 'GET');
  }

  /**
   * Create document from template
   * @param {string} templateId - Template ID
   * @param {Object} templateData - Data to populate template
   * @returns {Promise<Object>} Created document details
   */
  async createFromTemplate(templateId, templateData) {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    return this.makeRequest('/v1/documents/from-template', 'POST', {
      templateId,
      templateData
    });
  }
}

module.exports = new AjmaaService();
