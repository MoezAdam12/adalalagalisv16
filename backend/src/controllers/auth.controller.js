const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Tenant } = require('../models');
const config = require('../config/auth.config');

/**
 * Authentication controller for handling user authentication
 */
class AuthController {
  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Get tenant from request middleware
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant information is required' });
      }
      
      // Find user by email within the tenant
      const user = await User.findOne({
        where: { email, tenant_id: tenantId }
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Account is inactive or suspended' });
      }
      
      // Verify password
      const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
      if (!passwordIsValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, tenantId: user.tenant_id, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
      );
      
      // Generate refresh token
      const refreshToken = jwt.sign(
        { id: user.id, email: user.email, tenantId: user.tenant_id },
        config.refreshTokenSecret,
        { expiresIn: config.refreshTokenExpiration }
      );
      
      // Update last login timestamp
      await user.update({ last_login: new Date() });
      
      // Return user information and tokens
      res.status(200).json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        language: user.language,
        token,
        refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
    }
  }
  
  /**
   * Register new user within a tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      // Get tenant from request middleware
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant information is required' });
      }
      
      // Check if user already exists in this tenant
      const existingUser = await User.findOne({
        where: { email, tenant_id: tenantId }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists in this tenant' });
      }
      
      // Hash password
      const passwordHash = bcrypt.hashSync(password, 10);
      
      // Create new user
      const user = await User.create({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: role || 'user',
        tenant_id: tenantId,
        language: 'ar', // Default language is Arabic
        status: 'active'
      });
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'An error occurred during registration' });
    }
  }
  
  /**
   * Refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }
      
      // Verify refresh token
      jwt.verify(refreshToken, config.refreshTokenSecret, async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }
        
        // Find user
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate new JWT token
        const newToken = jwt.sign(
          { id: user.id, email: user.email, tenantId: user.tenant_id, role: user.role },
          config.jwtSecret,
          { expiresIn: config.jwtExpiration }
        );
        
        // Generate new refresh token
        const newRefreshToken = jwt.sign(
          { id: user.id, email: user.email, tenantId: user.tenant_id },
          config.refreshTokenSecret,
          { expiresIn: config.refreshTokenExpiration }
        );
        
        res.status(200).json({
          token: newToken,
          refreshToken: newRefreshToken
        });
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ message: 'An error occurred during token refresh' });
    }
  }
  
  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    // In a stateless JWT authentication system, the client is responsible for
    // discarding the token. The server doesn't need to do anything.
    res.status(200).json({ message: 'Logout successful' });
  }
  
  /**
   * Forgot password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Get tenant from request middleware
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant information is required' });
      }
      
      // Find user by email within the tenant
      const user = await User.findOne({
        where: { email, tenant_id: tenantId }
      });
      
      if (!user) {
        // For security reasons, don't reveal that the user doesn't exist
        return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
      }
      
      // Generate password reset token
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, tenantId: user.tenant_id },
        config.resetTokenSecret,
        { expiresIn: config.resetTokenExpiration }
      );
      
      // In a real application, send an email with the reset link
      // For this example, we'll just return the token
      res.status(200).json({
        message: 'If your email is registered, you will receive a password reset link',
        resetToken // In production, this would be sent via email, not in the response
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'An error occurred during password reset request' });
    }
  }
  
  /**
   * Reset password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }
      
      // Verify reset token
      jwt.verify(token, config.resetTokenSecret, async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Invalid or expired reset token' });
        }
        
        // Find user
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Hash new password
        const passwordHash = bcrypt.hashSync(password, 10);
        
        // Update user password
        await user.update({ password_hash: passwordHash });
        
        res.status(200).json({ message: 'Password reset successful' });
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'An error occurred during password reset' });
    }
  }
  
  /**
   * Verify email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }
      
      // Verify email verification token
      jwt.verify(token, config.emailVerificationSecret, async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Invalid or expired verification token' });
        }
        
        // Find user
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Update user email verification status
        await user.update({ email_verified: true });
        
        res.status(200).json({ message: 'Email verified successfully' });
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'An error occurred during email verification' });
    }
  }
  
  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCurrentUser(req, res) {
    try {
      // User ID should be available from the JWT token verification middleware
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Find user
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'tenant_id', 'language', 'status', 'last_login', 'profile_image_url']
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        language: user.language,
        status: user.status,
        lastLogin: user.last_login,
        profileImageUrl: user.profile_image_url
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'An error occurred while fetching user profile' });
    }
  }
}

module.exports = new AuthController();
