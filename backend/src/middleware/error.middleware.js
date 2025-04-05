/**
 * @file error.middleware.js
 * @description وسيط معالجة الأخطاء المركزي للتطبيق
 * يوفر هذا الملف آلية موحدة لمعالجة الأخطاء وإدارتها في جميع أنحاء التطبيق
 */

const { ValidationError } = require('express-validation');
const { isCelebrateError } = require('celebrate');
const winston = require('winston');
const Sentry = require('@sentry/node');
const { environment } = require('../config/environment');

// تكوين Sentry لتتبع الأخطاء إذا كان مكوناً
if (environment.sentry && environment.sentry.dsn) {
  Sentry.init({
    dsn: environment.sentry.dsn,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: null }),
    ],
    tracesSampleRate: 1.0,
  });
}

// إنشاء مسجل Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'adalalegalis-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// إضافة نقل ملف إذا كان تمكين ملف السجل صحيحًا
if (process.env.LOG_FILE_ENABLED === 'true') {
  logger.add(
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || 'logs/app.log',
      maxsize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || 7,
    })
  );
}

/**
 * أنواع الأخطاء المعرفة في التطبيق
 */
const ErrorTypes = {
  VALIDATION: 'ValidationError',
  AUTHENTICATION: 'AuthenticationError',
  AUTHORIZATION: 'AuthorizationError',
  NOT_FOUND: 'NotFoundError',
  CONFLICT: 'ConflictError',
  INTERNAL: 'InternalError',
  EXTERNAL_SERVICE: 'ExternalServiceError',
  DATABASE: 'DatabaseError',
  BUSINESS_LOGIC: 'BusinessLogicError',
};

/**
 * فئة الخطأ الأساسية للتطبيق
 */
class AppError extends Error {
  constructor(message, type, statusCode, details = null, isOperational = true) {
    super(message);
    this.name = type;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * إنشاء أخطاء محددة للتطبيق
 */
const createAppErrors = () => {
  return {
    ValidationError: (message, details) => 
      new AppError(message, ErrorTypes.VALIDATION, 400, details),
    
    AuthenticationError: (message, details) => 
      new AppError(message, ErrorTypes.AUTHENTICATION, 401, details),
    
    AuthorizationError: (message, details) => 
      new AppError(message, ErrorTypes.AUTHORIZATION, 403, details),
    
    NotFoundError: (message, details) => 
      new AppError(message, ErrorTypes.NOT_FOUND, 404, details),
    
    ConflictError: (message, details) => 
      new AppError(message, ErrorTypes.CONFLICT, 409, details),
    
    InternalError: (message, details, isOperational = true) => 
      new AppError(message, ErrorTypes.INTERNAL, 500, details, isOperational),
    
    ExternalServiceError: (message, details) => 
      new AppError(message, ErrorTypes.EXTERNAL_SERVICE, 502, details),
    
    DatabaseError: (message, details) => 
      new AppError(message, ErrorTypes.DATABASE, 500, details),
    
    BusinessLogicError: (message, details) => 
      new AppError(message, ErrorTypes.BUSINESS_LOGIC, 422, details),
  };
};

// إنشاء أخطاء التطبيق
const AppErrors = createAppErrors();

/**
 * تحويل أخطاء المكتبات الخارجية إلى أخطاء التطبيق
 * @param {Error} error الخطأ الأصلي
 * @returns {AppError} خطأ التطبيق
 */
const convertError = (error) => {
  // تحويل أخطاء التحقق من الصحة
  if (error instanceof ValidationError || isCelebrateError(error)) {
    return AppErrors.ValidationError(
      'خطأ في التحقق من صحة البيانات',
      error.details || error.message
    );
  }
  
  // تحويل أخطاء Mongoose
  if (error.name === 'MongooseError' || error.name === 'MongoError') {
    return AppErrors.DatabaseError(
      'خطأ في قاعدة البيانات',
      error.message
    );
  }
  
  // تحويل أخطاء JsonWebToken
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return AppErrors.AuthenticationError(
      'خطأ في المصادقة',
      error.message
    );
  }
  
  // إذا كان الخطأ غير معروف، إرجاع خطأ داخلي
  return AppErrors.InternalError(
    'حدث خطأ داخلي',
    error.message,
    false
  );
};

/**
 * تسجيل الخطأ في السجلات وخدمات التتبع
 * @param {Error} error الخطأ المراد تسجيله
 * @param {Request} req طلب Express
 */
const logError = (error, req) => {
  // تسجيل الخطأ في Winston
  logger.error({
    message: error.message,
    type: error.name,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : null,
  });
  
  // تسجيل الخطأ في Sentry إذا كان مكوناً وكان الخطأ غير تشغيلي
  if (environment.sentry && environment.sentry.dsn && !error.isOperational) {
    Sentry.withScope((scope) => {
      scope.setUser({ id: req.user ? req.user.id : 'anonymous' });
      scope.setTag('path', req.path);
      scope.setTag('method', req.method);
      scope.setExtra('details', error.details);
      Sentry.captureException(error);
    });
  }
};

/**
 * إرسال استجابة الخطأ إلى العميل
 * @param {Error} error الخطأ المراد إرساله
 * @param {Request} req طلب Express
 * @param {Response} res استجابة Express
 */
const sendErrorResponse = (error, req, res) => {
  // تحديد ما إذا كان يجب إرسال تفاصيل الخطأ
  const shouldSendDetails = process.env.NODE_ENV !== 'production' || error.isOperational;
  
  // إنشاء استجابة الخطأ
  const errorResponse = {
    status: 'error',
    message: error.message,
    code: error.name,
    requestId: req.id,
  };
  
  // إضافة تفاصيل الخطأ إذا كان مسموحًا
  if (shouldSendDetails && error.details) {
    errorResponse.details = error.details;
  }
  
  // إضافة تتبع المكدس في بيئة التطوير
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }
  
  // إرسال الاستجابة
  res.status(error.statusCode || 500).json(errorResponse);
};

/**
 * وسيط معالجة الأخطاء
 * @param {Error} err الخطأ المراد معالجته
 * @param {Request} req طلب Express
 * @param {Response} res استجابة Express
 * @param {Function} next دالة التالي
 */
const errorMiddleware = (err, req, res, next) => {
  // تحويل الخطأ إلى خطأ التطبيق إذا لم يكن كذلك بالفعل
  const error = err instanceof AppError ? err : convertError(err);
  
  // تسجيل الخطأ
  logError(error, req);
  
  // إرسال استجابة الخطأ
  sendErrorResponse(error, req, res);
};

/**
 * وسيط معالجة الطرق غير الموجودة
 * @param {Request} req طلب Express
 * @param {Response} res استجابة Express
 * @param {Function} next دالة التالي
 */
const notFoundMiddleware = (req, res, next) => {
  const error = AppErrors.NotFoundError(
    `لم يتم العثور على المسار: ${req.originalUrl}`,
    { path: req.originalUrl }
  );
  
  next(error);
};

/**
 * وسيط معالجة الأخطاء غير المتوقعة
 * @param {Error} error الخطأ غير المتوقع
 */
const handleUncaughtException = (error) => {
  logger.error({
    message: 'خطأ غير متوقع',
    error: error.message,
    stack: error.stack,
  });
  
  // تسجيل الخطأ في Sentry إذا كان مكوناً
  if (environment.sentry && environment.sentry.dsn) {
    Sentry.captureException(error);
  }
  
  // إنهاء العملية بأمان بعد تسجيل الخطأ
  process.exit(1);
};

/**
 * وسيط معالجة الوعود المرفوضة غير المعالجة
 * @param {Error} error الخطأ غير المعالج
 */
const handleUnhandledRejection = (error) => {
  logger.error({
    message: 'وعد مرفوض غير معالج',
    error: error.message,
    stack: error.stack,
  });
  
  // تسجيل الخطأ في Sentry إذا كان مكوناً
  if (environment.sentry && environment.sentry.dsn) {
    Sentry.captureException(error);
  }
  
  // لا ننهي العملية هنا لأن الوعود المرفوضة غير المعالجة لا تترك التطبيق في حالة غير متسقة
};

// تسجيل معالجات الأخطاء العالمية
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

// تصدير الوسطاء والأخطاء
module.exports = {
  errorMiddleware,
  notFoundMiddleware,
  AppErrors,
  ErrorTypes,
  AppError,
  logger,
};
