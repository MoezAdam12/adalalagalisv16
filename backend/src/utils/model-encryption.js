const mongoose = require('mongoose');
const { encryptionPlugin } = require('../utils/encryption');
const config = require('../config');

/**
 * Apply encryption plugin to sensitive models
 * This file configures which models and fields should be encrypted
 */

// Get encryption key from environment or config
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || config.encryption.key;

if (!ENCRYPTION_KEY) {
  console.error('WARNING: Encryption key not found. Sensitive data will not be encrypted.');
}

/**
 * Apply encryption to Client model
 * Encrypts personally identifiable information
 */
function applyClientEncryption(clientSchema) {
  if (!ENCRYPTION_KEY) return;
  
  clientSchema.plugin(encryptionPlugin, {
    fields: [
      'id_number',
      'phone',
      'email',
      'address.street',
      'address.postal_code'
    ],
    encryptionKey: ENCRYPTION_KEY,
    hideEncryptedFields: false,
    virtualDecryption: true
  });
}

/**
 * Apply encryption to Case model
 * Encrypts sensitive case details
 */
function applyCaseEncryption(caseSchema) {
  if (!ENCRYPTION_KEY) return;
  
  caseSchema.plugin(encryptionPlugin, {
    fields: [
      'sensitive_details',
      'private_notes'
    ],
    encryptionKey: ENCRYPTION_KEY,
    hideEncryptedFields: true,
    virtualDecryption: true
  });
}

/**
 * Apply encryption to Document model
 * Encrypts document metadata
 */
function applyDocumentEncryption(documentSchema) {
  if (!ENCRYPTION_KEY) return;
  
  documentSchema.plugin(encryptionPlugin, {
    fields: [
      'access_code',
      'private_notes'
    ],
    encryptionKey: ENCRYPTION_KEY,
    hideEncryptedFields: true,
    virtualDecryption: true
  });
}

/**
 * Apply encryption to Employee model
 * Encrypts employee personal information
 */
function applyEmployeeEncryption(employeeSchema) {
  if (!ENCRYPTION_KEY) return;
  
  employeeSchema.plugin(encryptionPlugin, {
    fields: [
      'id_number',
      'phone',
      'email',
      'address.street',
      'address.postal_code',
      'bank_account'
    ],
    encryptionKey: ENCRYPTION_KEY,
    hideEncryptedFields: false,
    virtualDecryption: true
  });
}

/**
 * Apply encryption to Payment model
 * Encrypts payment details
 */
function applyPaymentEncryption(paymentSchema) {
  if (!ENCRYPTION_KEY) return;
  
  paymentSchema.plugin(encryptionPlugin, {
    fields: [
      'transaction_id',
      'payment_method_details'
    ],
    encryptionKey: ENCRYPTION_KEY,
    hideEncryptedFields: false,
    virtualDecryption: true
  });
}

module.exports = {
  applyClientEncryption,
  applyCaseEncryption,
  applyDocumentEncryption,
  applyEmployeeEncryption,
  applyPaymentEncryption
};
