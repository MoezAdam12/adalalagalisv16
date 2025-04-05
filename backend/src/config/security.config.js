/**
 * security.config.js
 * تكوين إعدادات الأمان للتطبيق
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const { securityHeaders } = require('../middleware/csrf.middleware');
const logger = require('../utils/logger');

/**
 * تكوين إعدادات الأمان للتطبيق
 * @param {Object} app - تطبيق Express
 */
const configureSecurity = (app) => {
  // استخدام Helmet لتكوين رؤوس HTTP الأمنية
  app.use(helmet());

  // تكوين CORS
  const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    exposedHeaders: ['X-CSRF-Token'],
    credentials: true,
    maxAge: 86400, // 24 ساعة
  };
  app.use(cors(corsOptions));

  // تكوين حد معدل الطلبات
  const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // تحويل الدقائق إلى مللي ثانية
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        type: 'RateLimitError',
        message: 'تم تجاوز الحد الأقصى لعدد الطلبات. يرجى المحاولة مرة أخرى لاحقًا.',
        statusCode: 429,
      },
    },
    skip: (req) => {
      // تجاهل طلبات API الداخلية
      return req.ip === '127.0.0.1' || req.ip === '::1';
    },
  });
  app.use('/api', limiter);

  // حماية من هجمات NoSQL Injection
  app.use(mongoSanitize());

  // حماية من هجمات XSS
  app.use(xss());

  // حماية من تلوث المعلمات
  app.use(hpp({
    whitelist: [
      'sort', 'page', 'limit', 'fields', 'filter', 'search',
      'startDate', 'endDate', 'status', 'type', 'category',
    ],
  }));

  // إضافة رؤوس أمان إضافية
  app.use(securityHeaders);

  // تسجيل معلومات عن تكوين الأمان
  logger.info('تم تكوين إعدادات الأمان', {
    cors: corsOptions.origin === '*' ? 'all' : corsOptions.origin,
    rateLimit: {
      windowMs: limiter.windowMs,
      max: limiter.max,
    },
  });
};

module.exports = {
  configureSecurity,
};
