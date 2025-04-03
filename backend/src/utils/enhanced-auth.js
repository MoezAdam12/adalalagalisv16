const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Enhanced Authentication Utility
 * Provides improved authentication mechanisms including JWT with enhanced security,
 * secure password handling, and multi-factor authentication support
 */
class EnhancedAuth {
  constructor(config) {
    this.jwtSecret = config.jwtSecret;
    this.jwtExpiresIn = config.jwtExpiresIn || '1d';
    this.jwtRefreshExpiresIn = config.jwtRefreshExpiresIn || '7d';
    this.bcryptSaltRounds = config.bcryptSaltRounds || 12;
    this.mfaEnabled = config.mfaEnabled || false;
    this.mfaSecretLength = config.mfaSecretLength || 20;
  }

  /**
   * Generate JWT token with enhanced security
   * @param {Object} payload - Token payload
   * @returns {Object} - Object containing token, refresh token and expiration
   */
  generateTokens(payload) {
    // Add security-related claims
    const enhancedPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomBytes(16).toString('hex') // Unique token ID to prevent replay attacks
    };

    // Generate access token
    const token = jwt.sign(enhancedPayload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      algorithm: 'HS256'
    });

    // Generate refresh token with different expiration
    const refreshToken = jwt.sign(
      { 
        userId: payload.userId,
        jti: crypto.randomBytes(16).toString('hex'),
        type: 'refresh'
      }, 
      this.jwtSecret, 
      {
        expiresIn: this.jwtRefreshExpiresIn,
        algorithm: 'HS256'
      }
    );

    // Calculate expiration time
    const decoded = jwt.decode(token);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds

    return {
      token,
      refreshToken,
      expiresAt
    };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} - Decoded token payload
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'] // Restrict to specific algorithm
      });
      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} userData - User data to include in new token
   * @returns {Object} - New tokens
   */
  refreshAccessToken(refreshToken, userData) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtSecret, {
        algorithms: ['HS256']
      });

      // Check if it's a refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Generate new tokens
      return this.generateTokens({
        userId: decoded.userId,
        ...userData
      });
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Hash password securely
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    return bcrypt.hash(password, this.bcryptSaltRounds);
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} - Whether password matches
   */
  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate MFA secret
   * @returns {string} - MFA secret
   */
  generateMfaSecret() {
    return crypto.randomBytes(this.mfaSecretLength).toString('hex');
  }

  /**
   * Verify MFA token
   * @param {string} token - MFA token
   * @param {string} secret - MFA secret
   * @returns {boolean} - Whether token is valid
   */
  verifyMfaToken(token, secret) {
    // This is a placeholder for actual TOTP verification
    // In a real implementation, you would use a library like speakeasy
    // to verify the time-based one-time password
    
    // Example implementation with speakeasy would be:
    // return speakeasy.totp.verify({
    //   secret: secret,
    //   encoding: 'hex',
    //   token: token,
    //   window: 1
    // });
    
    // For now, we'll return true for testing purposes
    console.warn('MFA token verification is a placeholder. Implement actual verification in production.');
    return true;
  }
}

module.exports = EnhancedAuth;
