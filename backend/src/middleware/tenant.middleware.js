const { Tenant } = require('../models');

/**
 * Middleware for extracting tenant information from request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const extractTenant = async (req, res, next) => {
  try {
    // Try to get tenant from subdomain
    const host = req.get('host');
    const tenantHeader = req.get('X-Tenant-ID');
    
    // Priority 1: Explicit tenant header
    if (tenantHeader) {
      const tenant = await Tenant.findByPk(tenantHeader);
      if (tenant && tenant.status === 'active') {
        req.tenantId = tenant.id;
        req.tenantSubdomain = tenant.subdomain;
        return next();
      }
    }
    
    // Priority 2: Subdomain in host
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'api' && subdomain !== 'www' && !subdomain.includes('localhost')) {
        const tenant = await Tenant.findOne({ where: { subdomain } });
        if (tenant && tenant.status === 'active') {
          req.tenantId = tenant.id;
          req.tenantSubdomain = tenant.subdomain;
          return next();
        }
      }
    }
    
    // For public routes that don't require tenant context
    const publicPaths = [
      '/health',
      '/api/tenants/by-subdomain'
    ];
    
    // Check if the current path is a public path
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    if (isPublicPath) {
      return next();
    }
    
    // If we reach here and no tenant was found, return error
    res.status(400).json({ message: 'Tenant information is required' });
  } catch (error) {
    console.error('Extract tenant error:', error);
    res.status(500).json({ message: 'An error occurred while extracting tenant information' });
  }
};

/**
 * Middleware for ensuring tenant data isolation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureTenantIsolation = (req, res, next) => {
  // This middleware should be used after authentication
  // It ensures that users can only access data from their own tenant
  
  // If no tenant ID in request, deny access
  if (!req.tenantId) {
    return res.status(400).json({ message: 'Tenant information is required' });
  }
  
  // If user's tenant ID doesn't match the request tenant ID, deny access
  if (req.userId && req.tenantId !== req.userTenantId) {
    return res.status(403).json({ message: 'Forbidden: Tenant mismatch' });
  }
  
  next();
};

/**
 * Middleware for validating tenant status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateTenantStatus = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ message: 'Tenant information is required' });
    }
    
    const tenant = await Tenant.findByPk(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    if (tenant.status !== 'active') {
      return res.status(403).json({ message: 'Tenant is inactive or suspended' });
    }
    
    // Check subscription status
    const now = new Date();
    if (tenant.subscription_end_date && tenant.subscription_end_date < now) {
      return res.status(403).json({ message: 'Tenant subscription has expired' });
    }
    
    next();
  } catch (error) {
    console.error('Validate tenant status error:', error);
    res.status(500).json({ message: 'An error occurred while validating tenant status' });
  }
};

module.exports = {
  extractTenant,
  ensureTenantIsolation,
  validateTenantStatus
};
