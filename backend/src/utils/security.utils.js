/**
 * Security utilities for input validation and sanitization
 */

const xss = require('xss');
const validator = require('validator');

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Convert to string if not already
  const stringInput = String(input);
  
  // Use xss library to sanitize HTML
  return xss(stringInput.trim());
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
  if (!email) return false;
  return validator.isEmail(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with valid flag and message
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true, message: 'Password is valid' };
}

/**
 * Sanitize and validate SQL input to prevent SQL injection
 * @param {string} input - SQL input to sanitize
 * @returns {string} Sanitized SQL input
 */
function sanitizeSqlInput(input) {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Convert to string if not already
  const stringInput = String(input);
  
  // Escape SQL injection characters
  return validator.escape(stringInput.trim());
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate and sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
function validateAndSanitizeUrl(url) {
  if (!url) return null;
  
  // Check if URL is valid
  if (!validator.isURL(url, { require_protocol: true })) {
    return null;
  }
  
  // Sanitize URL
  return xss(url.trim());
}

/**
 * Validate account number format (6 digits)
 * @param {string} accountNumber - Account number to validate
 * @returns {boolean} Whether account number is valid
 */
function validateAccountNumber(accountNumber) {
  if (!accountNumber) return false;
  
  // Check if account number is exactly 6 digits
  return /^\d{6}$/.test(accountNumber);
}

module.exports = {
  sanitizeInput,
  validateEmail,
  validatePassword,
  sanitizeSqlInput,
  validateAndSanitizeUrl,
  validateAccountNumber
};
