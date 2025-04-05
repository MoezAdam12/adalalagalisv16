const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Data Protection Utility
 * Provides functions for secure data handling, masking, and deletion
 */
class DataProtection {
  /**
   * Mask sensitive data for display
   * @param {string} data - Data to mask
   * @param {Object} options - Masking options
   * @returns {string} - Masked data
   */
  static maskData(data, options = {}) {
    if (!data) return data;
    
    const {
      type = 'default',
      showFirst = 0,
      showLast = 0,
      maskChar = '*'
    } = options;
    
    // Handle different data types
    switch (type) {
      case 'email':
        return this.maskEmail(data, maskChar);
      
      case 'phone':
        return this.maskPhone(data, showLast, maskChar);
      
      case 'creditCard':
        return this.maskCreditCard(data, maskChar);
      
      case 'idNumber':
        return this.maskIdNumber(data, showFirst, showLast, maskChar);
      
      default:
        return this.maskDefault(data, showFirst, showLast, maskChar);
    }
  }
  
  /**
   * Mask email address
   * @param {string} email - Email to mask
   * @param {string} maskChar - Character to use for masking
   * @returns {string} - Masked email
   */
  static maskEmail(email, maskChar = '*') {
    if (!email || !email.includes('@')) return email;
    
    const [localPart, domain] = email.split('@');
    
    // Mask local part (username)
    let maskedLocalPart;
    if (localPart.length <= 2) {
      maskedLocalPart = maskChar.repeat(localPart.length);
    } else {
      maskedLocalPart = localPart[0] + maskChar.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    }
    
    // Mask domain (except TLD)
    const domainParts = domain.split('.');
    const tld = domainParts.pop();
    let maskedDomain;
    
    if (domainParts.join('.').length <= 2) {
      maskedDomain = maskChar.repeat(domainParts.join('.').length);
    } else {
      const domainName = domainParts.join('.');
      maskedDomain = domainName[0] + maskChar.repeat(domainName.length - 2) + domainName[domainName.length - 1];
    }
    
    return `${maskedLocalPart}@${maskedDomain}.${tld}`;
  }
  
  /**
   * Mask phone number
   * @param {string} phone - Phone number to mask
   * @param {number} showLast - Number of digits to show at the end
   * @param {string} maskChar - Character to use for masking
   * @returns {string} - Masked phone number
   */
  static maskPhone(phone, showLast = 4, maskChar = '*') {
    if (!phone) return phone;
    
    // Remove non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length <= showLast) {
      return digits;
    }
    
    const visiblePart = digits.slice(-showLast);
    const maskedPart = maskChar.repeat(digits.length - showLast);
    
    return maskedPart + visiblePart;
  }
  
  /**
   * Mask credit card number
   * @param {string} cardNumber - Credit card number to mask
   * @param {string} maskChar - Character to use for masking
   * @returns {string} - Masked credit card number
   */
  static maskCreditCard(cardNumber, maskChar = '*') {
    if (!cardNumber) return cardNumber;
    
    // Remove non-digit characters
    const digits = cardNumber.replace(/\D/g, '');
    
    if (digits.length <= 4) {
      return digits;
    }
    
    // Show only last 4 digits
    const lastFour = digits.slice(-4);
    const maskedPart = maskChar.repeat(digits.length - 4);
    
    // Format with spaces for readability
    let formatted = maskedPart + lastFour;
    if (formatted.length > 4) {
      formatted = formatted.replace(/(.{4})/g, '$1 ').trim();
    }
    
    return formatted;
  }
  
  /**
   * Mask ID number
   * @param {string} idNumber - ID number to mask
   * @param {number} showFirst - Number of characters to show at the beginning
   * @param {number} showLast - Number of characters to show at the end
   * @param {string} maskChar - Character to use for masking
   * @returns {string} - Masked ID number
   */
  static maskIdNumber(idNumber, showFirst = 2, showLast = 2, maskChar = '*') {
    if (!idNumber) return idNumber;
    
    const idStr = idNumber.toString();
    
    if (idStr.length <= (showFirst + showLast)) {
      return maskChar.repeat(idStr.length);
    }
    
    const firstPart = idStr.slice(0, showFirst);
    const lastPart = idStr.slice(-showLast);
    const maskedPart = maskChar.repeat(idStr.length - showFirst - showLast);
    
    return firstPart + maskedPart + lastPart;
  }
  
  /**
   * Default masking function
   * @param {string} data - Data to mask
   * @param {number} showFirst - Number of characters to show at the beginning
   * @param {number} showLast - Number of characters to show at the end
   * @param {string} maskChar - Character to use for masking
   * @returns {string} - Masked data
   */
  static maskDefault(data, showFirst = 0, showLast = 0, maskChar = '*') {
    if (!data) return data;
    
    const dataStr = data.toString();
    
    if (dataStr.length <= (showFirst + showLast)) {
      return maskChar.repeat(dataStr.length);
    }
    
    const firstPart = showFirst > 0 ? dataStr.slice(0, showFirst) : '';
    const lastPart = showLast > 0 ? dataStr.slice(-showLast) : '';
    const maskedPart = maskChar.repeat(dataStr.length - showFirst - showLast);
    
    return firstPart + maskedPart + lastPart;
  }
  
  /**
   * Securely delete a file by overwriting it before unlinking
   * @param {string} filePath - Path to the file to delete
   * @param {number} passes - Number of overwrite passes
   * @returns {Promise<void>} - Promise that resolves when file is deleted
   */
  static async secureDeleteFile(filePath, passes = 3) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          return reject(err);
        }
        
        const fileSize = stats.size;
        
        // Open file for writing
        fs.open(filePath, 'w', (err, fd) => {
          if (err) {
            return reject(err);
          }
          
          const performPass = (passNumber) => {
            if (passNumber >= passes) {
              // All passes completed, close and unlink the file
              fs.close(fd, (err) => {
                if (err) {
                  return reject(err);
                }
                
                fs.unlink(filePath, (err) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                });
              });
              return;
            }
            
            // Generate random data for overwriting
            const buffer = Buffer.alloc(fileSize);
            
            // Different patterns for different passes
            if (passNumber % 3 === 0) {
              // Random data
              crypto.randomFillSync(buffer);
            } else if (passNumber % 3 === 1) {
              // All zeros
              buffer.fill(0);
            } else {
              // All ones
              buffer.fill(255);
            }
            
            // Write the buffer to the file
            fs.write(fd, buffer, 0, fileSize, 0, (err) => {
              if (err) {
                fs.close(fd, () => {
                  reject(err);
                });
                return;
              }
              
              // Sync to ensure data is written to disk
              fs.fsync(fd, (err) => {
                if (err) {
                  fs.close(fd, () => {
                    reject(err);
                  });
                  return;
                }
                
                // Proceed to next pass
                performPass(passNumber + 1);
              });
            });
          };
          
          // Start with first pass
          performPass(0);
        });
      });
    });
  }
  
  /**
   * Generate a secure random token
   * @param {number} length - Length of the token in bytes
   * @returns {string} - Hex-encoded random token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Hash data for anonymization
   * @param {string} data - Data to hash
   * @param {string} salt - Salt for the hash
   * @returns {string} - Hashed data
   */
  static anonymizeData(data, salt = '') {
    if (!data) return '';
    
    return crypto
      .createHash('sha256')
      .update(data + salt)
      .digest('hex');
  }
}

module.exports = DataProtection;
