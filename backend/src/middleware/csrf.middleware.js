/**
 * @file csrf.middleware.js
 * @description وسيط حماية CSRF للتطبيق
 * يوفر هذا الملف آلية لمنع هجمات تزوير الطلبات عبر المواقع
 */

const crypto = require('crypto');
const { AppErrors } = require('./error.middleware');

// مفتاح سري لتوقيع رموز CSRF
const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

// مدة صلاحية رمز CSRF (24 ساعة افتراضيًا)
const CSRF_TOKEN_EXPIRY = parseInt(process.env.CSRF_TOKEN_EXPIRY_SECONDS, 10) || 86400;

// اسم ملف تعريف الارتباط لرمز CSRF
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

// اسم الرأس لرمز CSRF
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * إنشاء رمز CSRF
 * @returns {string} رمز CSRF
 */
const generateCsrfToken = () => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}:${randomString}`;
  
  // توقيع الرمز باستخدام HMAC
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');
  
  return `${payload}:${signature}`;
};

/**
 * التحقق من صحة رمز CSRF
 * @param {string} token رمز CSRF
 * @returns {boolean} ما إذا كان الرمز صالحًا
 */
const validateCsrfToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split(':');
  
  if (parts.length !== 3) {
    return false;
  }
  
  const [timestamp, randomString, signature] = parts;
  const payload = `${timestamp}:${randomString}`;
  
  // التحقق من التوقيع
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return false;
  }
  
  // التحقق من انتهاء الصلاحية
  const tokenTimestamp = parseInt(timestamp, 10);
  const currentTimestamp = Date.now();
  const expiryTimestamp = tokenTimestamp + (CSRF_TOKEN_EXPIRY * 1000);
  
  return currentTimestamp <= expiryTimestamp;
};

/**
 * وسيط لإنشاء رمز CSRF وإرساله في ملف تعريف الارتباط
 * @param {Request} req طلب Express
 * @param {Response} res استجابة Express
 * @param {Function} next دالة التالي
 */
const csrfTokenMiddleware = (req, res, next) => {
  // إنشاء رمز CSRF جديد
  const csrfToken = generateCsrfToken();
  
  // تعيين ملف تعريف الارتباط
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // يجب أن يكون false للسماح لـ JavaScript بالوصول إليه
    secure: process.env.NODE_ENV === 'production', // استخدام HTTPS في الإنتاج
    sameSite: 'strict', // منع إرسال ملف تعريف الارتباط في طلبات عبر المواقع
    maxAge: CSRF_TOKEN_EXPIRY * 1000, // مدة الصلاحية بالمللي ثانية
    path: '/', // متاح لجميع المسارات
  });
  
  // تخزين الرمز في الطلب للاستخدام اللاحق
  req.csrfToken = csrfToken;
  
  // إضافة دالة مساعدة للحصول على رمز CSRF
  req.getCsrfToken = () => csrfToken;
  
  next();
};

/**
 * وسيط للتحقق من صحة رمز CSRF
 * @param {Request} req طلب Express
 * @param {Response} res استجابة Express
 * @param {Function} next دالة التالي
 */
const csrfProtectionMiddleware = (req, res, next) => {
  // تخطي التحقق لطلبات GET و HEAD و OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // الحصول على رمز CSRF من الرأس أو الجسم
  const csrfToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] || 
                    req.body._csrf || 
                    req.query._csrf;
  
  // الحصول على رمز CSRF من ملف تعريف الارتباط
  const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
  
  // التحقق من وجود الرمز
  if (!csrfToken || !csrfCookie) {
    return next(AppErrors.AuthorizationError(
      'رمز CSRF مفقود',
      { token: !!csrfToken, cookie: !!csrfCookie }
    ));
  }
  
  // التحقق من تطابق الرمز مع ملف تعريف الارتباط
  if (csrfToken !== csrfCookie) {
    return next(AppErrors.AuthorizationError(
      'رمز CSRF غير صالح',
      { tokenMismatch: true }
    ));
  }
  
  // التحقق من صحة الرمز
  if (!validateCsrfToken(csrfToken)) {
    return next(AppErrors.AuthorizationError(
      'رمز CSRF منتهي الصلاحية أو غير صالح',
      { tokenInvalid: true }
    ));
  }
  
  next();
};

/**
 * وسيط للتحقق من مرجع HTTP أو رؤوس الأصل
 * @param {Request} req طلب Express
 * @param {Response} res استجابة Express
 * @param {Function} next دالة التالي
 */
const referrerPolicyMiddleware = (req, res, next) => {
  // تخطي التحقق لطلبات GET و HEAD و OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // الحصول على مرجع HTTP
  const referer = req.headers.referer || req.headers.referrer;
  
  // الحصول على أصل الطلب
  const origin = req.headers.origin;
  
  // الحصول على المضيف
  const host = req.headers.host;
  
  // التحقق من وجود مرجع أو أصل
  if (!referer && !origin) {
    // السماح بالطلبات بدون مرجع أو أصل (مثل طلبات API)
    return next();
  }
  
  // التحقق من أن المرجع أو الأصل من نفس الموقع
  const refererUrl = referer ? new URL(referer) : null;
  const refererHost = refererUrl ? refererUrl.host : null;
  
  if (refererHost && refererHost !== host) {
    return next(AppErrors.AuthorizationError(
      'مرجع HTTP غير صالح',
      { referer, host }
    ));
  }
  
  if (origin && origin !== `${req.protocol}://${host}`) {
    return next(AppErrors.AuthorizationError(
      'أصل غير صالح',
      { origin, expected: `${req.protocol}://${host}` }
    ));
  }
  
  next();
};

// تصدير الوسطاء
module.exports = {
  csrfTokenMiddleware,
  csrfProtectionMiddleware,
  referrerPolicyMiddleware,
  generateCsrfToken,
  validateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
};
