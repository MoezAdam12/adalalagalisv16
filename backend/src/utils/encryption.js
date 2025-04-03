const crypto = require('crypto');
const util = require('util');

/**
 * Field-level encryption utility for sensitive data
 * This utility provides methods to encrypt and decrypt sensitive fields
 * in documents before storing them in the database
 */
class FieldEncryption {
  constructor(encryptionKey) {
    // Check if key is provided as hex string
    if (typeof encryptionKey === 'string') {
      // Convert hex string to buffer
      if (encryptionKey.length === 64) { // 32 bytes in hex is 64 characters
        this.encryptionKey = Buffer.from(encryptionKey, 'hex');
      } else if (encryptionKey.length === 32) { // 32 bytes as UTF-8 string
        this.encryptionKey = Buffer.from(encryptionKey, 'utf8');
      } else {
        throw new Error('Encryption key must be 32 bytes (256 bits)');
      }
    } else if (Buffer.isBuffer(encryptionKey) && encryptionKey.length === 32) {
      // Key is already a buffer of correct length
      this.encryptionKey = encryptionKey;
    } else {
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }
    
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encrypt a field value
   * @param {string} text - Plain text to encrypt
   * @returns {Object} - Encrypted data object with iv, tag, and encryptedData
   */
  encrypt(text) {
    if (!text) return null;
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encryptedData: encrypted
    };
  }

  /**
   * Decrypt a field value
   * @param {Object} encryptedData - Object containing iv, tag, and encryptedData
   * @returns {string} - Decrypted plain text
   */
  decrypt(encryptedData) {
    if (!encryptedData) return null;
    
    const { iv, tag, encryptedData: encrypted } = encryptedData;
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    // Set authentication tag
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

/**
 * Mongoose plugin for field-level encryption
 * @param {Object} schema - Mongoose schema
 * @param {Object} options - Plugin options
 */
function encryptionPlugin(schema, options) {
  if (!options || !options.fields || !options.fields.length) {
    throw new Error('Encryption fields must be specified');
  }
  
  if (!options.encryptionKey) {
    throw new Error('Encryption key must be provided');
  }
  
  const fieldEncryption = new FieldEncryption(options.encryptionKey);
  const fields = options.fields;
  
  // Add encrypted fields to schema
  fields.forEach(field => {
    // Add encrypted field schema
    const encryptedFieldName = `${field}_encrypted`;
    const schemaUpdate = {};
    
    schemaUpdate[encryptedFieldName] = {
      iv: String,
      tag: String,
      encryptedData: String
    };
    
    schema.add(schemaUpdate);
  });
  
  // Pre-save hook to encrypt fields
  schema.pre('save', function(next) {
    fields.forEach(field => {
      if (this[field]) {
        // Encrypt the field
        this[`${field}_encrypted`] = fieldEncryption.encrypt(this[field]);
        
        // Clear the original field if hideEncryptedFields is true
        if (options.hideEncryptedFields) {
          this[field] = undefined;
        }
      }
    });
    
    next();
  });
  
  // Method to decrypt fields
  schema.methods.decryptFields = function() {
    const decrypted = {};
    
    fields.forEach(field => {
      const encryptedField = this[`${field}_encrypted`];
      if (encryptedField) {
        decrypted[field] = fieldEncryption.decrypt(encryptedField);
      }
    });
    
    return decrypted;
  };
  
  // Virtual getters for decrypted fields
  fields.forEach(field => {
    if (options.virtualDecryption) {
      schema.virtual(`decrypted_${field}`).get(function() {
        const encryptedField = this[`${field}_encrypted`];
        if (encryptedField) {
          return fieldEncryption.decrypt(encryptedField);
        }
        return this[field];
      });
    }
  });
}

module.exports = {
  FieldEncryption,
  encryptionPlugin
};
