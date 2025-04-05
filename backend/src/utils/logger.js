/**
 * logger.js
 * نظام تسجيل مركزي للتطبيق
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد السجلات
const logDir = process.env.LOG_FILE_PATH || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// تكوين مستويات التسجيل
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// تحديد مستوى التسجيل بناءً على بيئة التشغيل
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// تكوين ألوان المستويات
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// إضافة الألوان إلى winston
winston.addColors(colors);

// تنسيق السجلات
const format = winston.format.combine(
  // إضافة الطابع الزمني
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // إضافة معلومات عن الملف والسطر
  winston.format.errors({ stack: true }),
  // تنسيق JSON للسجلات
  winston.format.json(),
  // إضافة الألوان في بيئة التطوير
  process.env.NODE_ENV !== 'production'
    ? winston.format.colorize({ all: true })
    : winston.format.uncolorize()
);

// تكوين وسائط التسجيل
const transports = [
  // سجل الأخطاء
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  // سجل جميع المستويات
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// إضافة وسيط التسجيل في وحدة التحكم في بيئة التطوير
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    })
  );
}

// إنشاء مثيل المسجل
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// إضافة دالة لتسجيل طلبات HTTP
logger.http = (message, meta = {}) => {
  logger.log('http', message, meta);
};

// إضافة دالة لتسجيل أداء العمليات
logger.performance = (operation, durationMs, meta = {}) => {
  logger.info(`أداء: ${operation} استغرق ${durationMs}ms`, {
    ...meta,
    performance: true,
    operation,
    durationMs,
  });
};

// إضافة دالة لتسجيل أحداث الأمان
logger.security = (message, meta = {}) => {
  logger.warn(`أمان: ${message}`, {
    ...meta,
    security: true,
  });
};

// إضافة دالة لتسجيل أحداث الأعمال
logger.business = (message, meta = {}) => {
  logger.info(`عمل: ${message}`, {
    ...meta,
    business: true,
  });
};

// إضافة دالة لتسجيل أحداث المستخدم
logger.user = (userId, action, meta = {}) => {
  logger.info(`مستخدم: ${action}`, {
    ...meta,
    user: true,
    userId,
    action,
  });
};

// إضافة دالة لتسجيل أحداث النظام
logger.system = (message, meta = {}) => {
  logger.info(`نظام: ${message}`, {
    ...meta,
    system: true,
  });
};

// إضافة دالة لتسجيل أحداث قاعدة البيانات
logger.database = (operation, collection, meta = {}) => {
  logger.debug(`قاعدة بيانات: ${operation} على ${collection}`, {
    ...meta,
    database: true,
    operation,
    collection,
  });
};

// إضافة دالة لتسجيل أحداث الخدمات الخارجية
logger.externalService = (service, operation, meta = {}) => {
  logger.info(`خدمة خارجية: ${operation} على ${service}`, {
    ...meta,
    externalService: true,
    service,
    operation,
  });
};

// إضافة دالة لتسجيل أحداث التتبع
logger.trace = (message, meta = {}) => {
  if (process.env.TRACE_ENABLED === 'true') {
    logger.debug(`تتبع: ${message}`, {
      ...meta,
      trace: true,
    });
  }
};

// إضافة وسيط Express لتسجيل الطلبات
logger.expressMiddleware = (req, res, next) => {
  // تعيين معرف فريد للطلب
  req.id = req.id || Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // تسجيل بداية الطلب
  const start = Date.now();
  
  // تسجيل نهاية الطلب عند الانتهاء
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : undefined,
      duration,
      contentLength: res.get('content-length'),
    });
  });
  
  next();
};

module.exports = logger;
