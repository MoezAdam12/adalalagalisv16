const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced API Security Middleware
 * Provides middleware functions to secure the API against common attacks
 */

// Security headers middleware using helmet
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true
  }
});

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if available, otherwise use IP
    return req.headers['x-forwarded-for'] || req.ip;
  }
});

// More strict rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP, please try again after an hour',
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip;
  }
});

// Data sanitization against NoSQL query injection
const mongoSanitization = mongoSanitize({
  replaceWith: '_'
});

// Data sanitization against XSS
const xssProtection = xss();

// Protection against HTTP Parameter Pollution
const parameterPollutionProtection = hpp({
  whitelist: [
    'sort', 'page', 'limit', 'fields', // Common query parameters
    'start_date', 'end_date', 'status' // Business-specific parameters
  ]
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:4200',
      'https://adalalegalis.com',
      'https://admin.adalalegalis.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Request ID middleware
const requestId = (req, res, next) => {
  const uuid = uuidv4();
  req.id = uuid;
  res.setHeader('X-Request-ID', uuid);
  next();
};

// CSRF protection middleware
// Note: This is a simplified version. In production, use a proper CSRF library
const csrfProtection = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests as they should be idempotent
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'];
  const storedToken = req.session && req.session.csrfToken;
  
  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or missing CSRF token'
    });
  }
  
  next();
};

// Audit logging middleware
const auditLogger = (req, res, next) => {
  // Log security-relevant events
  const logData = {
    timestamp: new Date().toISOString(),
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.headers['x-forwarded-for'] || req.ip,
    userId: req.user ? req.user._id : 'unauthenticated',
    userAgent: req.headers['user-agent']
  };
  
  // In a real implementation, you would log to a secure audit log system
  console.log('AUDIT LOG:', JSON.stringify(logData));
  
  next();
};

module.exports = {
  securityHeaders,
  apiLimiter,
  authLimiter,
  mongoSanitization,
  xssProtection,
  parameterPollutionProtection,
  corsWithOptions: cors(corsOptions),
  requestId,
  csrfProtection,
  auditLogger
};
