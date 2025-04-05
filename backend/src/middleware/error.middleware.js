/**
 * وحدة معالجة الأخطاء المركزية
 * 
 * هذا الملف يوفر آليات موحدة لمعالجة الأخطاء في التطبيق، بما في ذلك:
 * - معالجة أخطاء HTTP
 * - معالجة أخطاء التحقق من الصحة
 * - معالجة أخطاء قاعدة البيانات
 * - تسجيل الأخطاء وتتبعها
 * - إرسال إشعارات الأخطاء
 */

const { logger } = require('../utils/logger');
const { ValidationError } = require('sequelize');
const config = require('../config/app.config');

/**
 * تصنيفات الأخطاء المختلفة
 */
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED_ERROR',
  FORBIDDEN: 'FORBIDDEN_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST_ERROR',
  CONFLICT: 'CONFLICT_ERROR'
};

/**
 * رموز حالة HTTP المقابلة لأنواع الأخطاء
 */
const ErrorStatusCodes = {
  [ErrorTypes.VALIDATION]: 400,
  [ErrorTypes.NOT_FOUND]: 404,
  [ErrorTypes.UNAUTHORIZED]: 401,
  [ErrorTypes.FORBIDDEN]: 403,
  [ErrorTypes.DATABASE]: 500,
  [ErrorTypes.EXTERNAL_SERVICE]: 503,
  [ErrorTypes.RATE_LIMIT]: 429,
  [ErrorTypes.INTERNAL]: 500,
  [ErrorTypes.BAD_REQUEST]: 400,
  [ErrorTypes.CONFLICT]: 409
};

/**
 * فئة الخطأ المخصصة للتطبيق
 */
class AppError extends Error {
  constructor(message, type = ErrorTypes.INTERNAL, details = null, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.statusCode = ErrorStatusCodes[type] || 500;
    
    // تسجيل معلومات إضافية للتصحيح
    if (originalError) {
      this.stack = originalError.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * تحويل الخطأ إلى كائن JSON للاستجابة
   */
  toJSON() {
    const response = {
      status: 'error',
      type: this.type,
      message: this.message,
      timestamp: this.timestamp
    };
    
    // إضافة التفاصيل إذا كانت موجودة
    if (this.details) {
      response.details = this.details;
    }
    
    // إضافة معلومات التصحيح في بيئة التطوير
    if (config.nodeEnv === 'development' && this.originalError) {
      response.debug = {
        originalMessage: this.originalError.message,
        stack: this.originalError.stack
      };
    }
    
    return response;
  }
  
  /**
   * إنشاء خطأ تحقق من الصحة
   */
  static validation(message, details) {
    return new AppError(
      message || 'بيانات غير صالحة',
      ErrorTypes.VALIDATION,
      details
    );
  }
  
  /**
   * إنشاء خطأ غير موجود
   */
  static notFound(message, details) {
    return new AppError(
      message || 'المورد غير موجود',
      ErrorTypes.NOT_FOUND,
      details
    );
  }
  
  /**
   * إنشاء خطأ غير مصرح به
   */
  static unauthorized(message, details) {
    return new AppError(
      message || 'غير مصرح به',
      ErrorTypes.UNAUTHORIZED,
      details
    );
  }
  
  /**
   * إنشاء خطأ ممنوع
   */
  static forbidden(message, details) {
    return new AppError(
      message || 'الوصول ممنوع',
      ErrorTypes.FORBIDDEN,
      details
    );
  }
  
  /**
   * إنشاء خطأ قاعدة بيانات
   */
  static database(message, originalError) {
    return new AppError(
      message || 'حدث خطأ في قاعدة البيانات',
      ErrorTypes.DATABASE,
      null,
      originalError
    );
  }
  
  /**
   * إنشاء خطأ خدمة خارجية
   */
  static externalService(message, details, originalError) {
    return new AppError(
      message || 'فشل الاتصال بالخدمة الخارجية',
      ErrorTypes.EXTERNAL_SERVICE,
      details,
      originalError
    );
  }
  
  /**
   * إنشاء خطأ تجاوز الحد
   */
  static rateLimit(message, details) {
    return new AppError(
      message || 'تم تجاوز حد معدل الطلبات',
      ErrorTypes.RATE_LIMIT,
      details
    );
  }
  
  /**
   * إنشاء خطأ طلب غير صالح
   */
  static badRequest(message, details) {
    return new AppError(
      message || 'طلب غير صالح',
      ErrorTypes.BAD_REQUEST,
      details
    );
  }
  
  /**
   * إنشاء خطأ تعارض
   */
  static conflict(message, details) {
    return new AppError(
      message || 'حدث تعارض مع الحالة الحالية للمورد',
      ErrorTypes.CONFLICT,
      details
    );
  }
}

/**
 * وسيط معالجة الأخطاء المركزي
 * يتعامل مع جميع الأخطاء ويعيد استجابة منسقة
 */
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // تسجيل الخطأ
  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous'
  });
  
  // تحويل أخطاء Sequelize إلى أخطاء تطبيق
  if (err instanceof ValidationError) {
    const validationErrors = {};
    
    err.errors.forEach(error => {
      validationErrors[error.path] = error.message;
    });
    
    error = AppError.validation('خطأ في التحقق من صحة البيانات', validationErrors);
  }
  
  // تحويل أخطاء JWT إلى أخطاء غير مصرح بها
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('رمز المصادقة غير صالح أو منتهي الصلاحية');
  }
  
  // تحويل أخطاء Mongoose إلى أخطاء تطبيق
  if (err.name === 'CastError') {
    error = AppError.badRequest(`قيمة غير صالحة: ${err.value}`);
  }
  
  // تحويل أخطاء Mongoose الفريدة إلى أخطاء تعارض
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = AppError.conflict(`القيمة ${err.keyValue[field]} مستخدمة بالفعل للحقل ${field}`);
  }
  
  // إذا لم يكن الخطأ من نوع AppError، قم بتحويله
  if (!(error instanceof AppError)) {
    error = new AppError(
      config.nodeEnv === 'production' ? 'حدث خطأ في الخادم' : error.message,
      ErrorTypes.INTERNAL,
      null,
      error
    );
  }
  
  // إرسال الاستجابة
  res.status(error.statusCode).json(error.toJSON());
  
  // إرسال إشعار للمسؤولين في حالة الأخطاء الخطيرة
  if (error.statusCode >= 500) {
    notifyAdminsAboutError(error, req);
  }
};

/**
 * وسيط معالجة المسارات غير الموجودة
 */
const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`المسار غير موجود: ${req.originalUrl}`));
};

/**
 * وسيط معالجة أخطاء التحقق من الصحة
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err && err.error && err.error.isJoi) {
    const validationErrors = {};
    
    err.error.details.forEach(detail => {
      validationErrors[detail.context.key] = detail.message;
    });
    
    return next(AppError.validation('خطأ في التحقق من صحة البيانات', validationErrors));
  }
  
  next(err);
};

/**
 * إشعار المسؤولين بالأخطاء الخطيرة
 * يمكن تنفيذ هذه الوظيفة لإرسال بريد إلكتروني أو إشعار Slack أو غيرها
 */
const notifyAdminsAboutError = (error, req) => {
  // في بيئة الإنتاج، يمكن تنفيذ إرسال إشعارات عبر البريد الإلكتروني أو Slack
  if (config.nodeEnv === 'production') {
    // مثال: إرسال بريد إلكتروني للمسؤولين
    // emailService.sendErrorNotification({
    //   subject: `خطأ خطير في التطبيق: ${error.type}`,
    //   error: error,
    //   request: {
    //     url: req.originalUrl,
    //     method: req.method,
    //     ip: req.ip,
    //     userId: req.user ? req.user.id : 'anonymous',
    //     timestamp: new Date().toISOString()
    //   }
    // });
    
    logger.warn('تم تسجيل خطأ خطير، يجب تنفيذ آلية إشعار المسؤولين');
  }
};

/**
 * وسيط تسجيل الطلبات
 * يسجل معلومات عن كل طلب قبل معالجته
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // تسجيل بداية الطلب
  logger.info({
    message: 'طلب وارد',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id,
    userId: req.user ? req.user.id : 'anonymous'
  });
  
  // تسجيل نهاية الطلب ووقت الاستجابة
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level]({
      message: 'انتهاء الطلب',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id,
      userId: req.user ? req.user.id : 'anonymous'
    });
  });
  
  next();
};

/**
 * وسيط التعامل مع الأخطاء غير المتوقعة
 * يتعامل مع الأخطاء غير المتوقعة مثل الاستثناءات غير المعالجة
 */
const unexpectedErrorHandler = (error) => {
  logger.error({
    message: 'خطأ غير متوقع',
    error: error.message,
    stack: error.stack
  });
  
  // في بيئة الإنتاج، يمكن إعادة تشغيل التطبيق أو اتخاذ إجراء آخر
  if (config.nodeEnv === 'production') {
    // يمكن تنفيذ آلية إعادة تشغيل هنا
    logger.warn('حدث خطأ غير متوقع في بيئة الإنتاج، يجب تنفيذ آلية التعافي');
  }
};

// تسجيل معالجي الأخطاء غير المتوقعة على مستوى العملية
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

module.exports = {
  AppError,
  ErrorTypes,
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  requestLogger,
  unexpectedErrorHandler
};
