const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const { User, Tenant } = require('../models');

/**
 * Middleware for authenticating users via JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Verify token
    jwt.verify(token, config.jwtSecret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      
      // Check if user exists
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized: User not found' });
      }
      
      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Forbidden: Account is inactive or suspended' });
      }
      
      // Check if tenant matches
      if (user.tenant_id !== decoded.tenantId) {
        return res.status(403).json({ message: 'Forbidden: Tenant mismatch' });
      }
      
      // Add user and tenant info to request
      req.userId = user.id;
      req.userEmail = user.email;
      req.userRole = user.role;
      req.tenantId = user.tenant_id;
      
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'An error occurred during authentication' });
  }
};

/**
 * Middleware for authorizing users based on roles
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: 'Unauthorized: User role not found' });
    }
    
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Middleware for checking if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (!req.userRole) {
    return res.status(401).json({ message: 'Unauthorized: User role not found' });
  }
  
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  next();
};

/**
 * Middleware for checking if user is super admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.userRole) {
    return res.status(401).json({ message: 'Unauthorized: User role not found' });
  }
  
  if (req.userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: Super admin access required' });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isSuperAdmin
};
