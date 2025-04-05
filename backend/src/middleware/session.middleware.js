/**
 * session.middleware.js
 * وسيط إدارة الجلسات في التطبيق
 */

const session = require('express-session');
const MongoStore = require('connect-mongo');
const { v4: uuidv4 } = require('uuid');
const { errorFactory } = require('./error.middleware');
const logger = require('../utils/logger');

/**
 * تكوين خيارات الجلسة
 * @param {Object} app - تطبيق Express
 */
const configureSession = (app) => {
  // التحقق من وجود سر الجلسة
  if (!process.env.SESSION_SECRET) {
    logger.warn('لم يتم تعيين SESSION_SECRET في متغيرات البيئة. استخدام قيمة افتراضية غير آمنة.');
  }

  // تكوين خيارات الجلسة
  const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'adalalegalis_session_secret',
    name: 'adalalegalis.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.SESSION_TIMEOUT || 30) * 60 * 1000, // تحويل الدقائق إلى مللي ثانية
    },
    genid: () => uuidv4(),
  };

  // إضافة تخزين الجلسة في MongoDB إذا كانت متاحة
  if (process.env.DB_URI) {
    sessionOptions.store = MongoStore.create({
      mongoUrl: process.env.DB_URI,
      ttl: parseInt(process.env.SESSION_TIMEOUT || 30) * 60, // تحويل الدقائق إلى ثواني
      autoRemove: 'native',
      touchAfter: 60, // تحديث الجلسة كل دقيقة كحد أقصى
      crypto: {
        secret: process.env.SESSION_SECRET || 'adalalegalis_session_secret',
      },
      collectionName: 'sessions',
    });
  } else {
    logger.warn('لم يتم تكوين اتصال MongoDB. سيتم تخزين الجلسات في الذاكرة، وهو غير مناسب للإنتاج.');
  }

  // إضافة وسيط الجلسة
  app.use(session(sessionOptions));

  // تسجيل معلومات عن تكوين الجلسة
  logger.info('تم تكوين وسيط الجلسة', {
    secure: sessionOptions.cookie.secure,
    maxAge: sessionOptions.cookie.maxAge,
    store: sessionOptions.store ? 'MongoDB' : 'MemoryStore',
  });
};

/**
 * وسيط للتحقق من صلاحية الجلسة
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال إلى الوسيط التالي
 */
const sessionValidator = (req, res, next) => {
  // التحقق من وجود الجلسة
  if (!req.session) {
    return next(errorFactory.internal('فشل تهيئة الجلسة'));
  }

  // إضافة طابع زمني للوصول الأخير
  req.session.lastAccess = Date.now();

  // التحقق من انتهاء صلاحية الجلسة
  const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || 30) * 60 * 1000; // تحويل الدقائق إلى مللي ثانية
  const currentTime = Date.now();
  const lastActivity = req.session.lastActivity || currentTime;

  // تحديث وقت النشاط الأخير
  req.session.lastActivity = currentTime;

  // التحقق من تجاوز مهلة الجلسة
  if (currentTime - lastActivity > sessionTimeout) {
    // تسجيل انتهاء صلاحية الجلسة
    logger.info('انتهت صلاحية الجلسة بسبب عدم النشاط', {
      sessionId: req.sessionID,
      userId: req.session.userId,
      lastActivity: new Date(lastActivity).toISOString(),
      currentTime: new Date(currentTime).toISOString(),
      timeout: sessionTimeout,
    });

    // إنهاء الجلسة
    return req.session.destroy((err) => {
      if (err) {
        logger.error('فشل إنهاء الجلسة', { error: err.message });
      }
      return next(errorFactory.unauthorized('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'));
    });
  }

  next();
};

/**
 * وسيط للتحقق من المصادقة
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال إلى الوسيط التالي
 */
const authRequired = (req, res, next) => {
  // التحقق من وجود المستخدم في الجلسة
  if (!req.session || !req.session.userId) {
    return next(errorFactory.unauthorized('يجب تسجيل الدخول للوصول إلى هذا المورد'));
  }

  next();
};

/**
 * وسيط للتحقق من الأدوار
 * @param {Array<string>} roles - الأدوار المسموح بها
 * @returns {Function} وسيط التحقق من الأدوار
 */
const roleRequired = (roles) => {
  return (req, res, next) => {
    // التحقق من وجود المستخدم في الجلسة
    if (!req.session || !req.session.userId) {
      return next(errorFactory.unauthorized('يجب تسجيل الدخول للوصول إلى هذا المورد'));
    }

    // التحقق من وجود دور المستخدم
    if (!req.session.userRole) {
      return next(errorFactory.forbidden('غير مصرح بالوصول إلى هذا المورد'));
    }

    // التحقق من أن دور المستخدم مسموح به
    if (!roles.includes(req.session.userRole)) {
      return next(errorFactory.forbidden('غير مصرح بالوصول إلى هذا المورد'));
    }

    next();
  };
};

/**
 * وسيط للتحقق من الصلاحيات
 * @param {Array<string>} permissions - الصلاحيات المطلوبة
 * @returns {Function} وسيط التحقق من الصلاحيات
 */
const permissionRequired = (permissions) => {
  return (req, res, next) => {
    // التحقق من وجود المستخدم في الجلسة
    if (!req.session || !req.session.userId) {
      return next(errorFactory.unauthorized('يجب تسجيل الدخول للوصول إلى هذا المورد'));
    }

    // التحقق من وجود صلاحيات المستخدم
    if (!req.session.userPermissions || !Array.isArray(req.session.userPermissions)) {
      return next(errorFactory.forbidden('غير مصرح بالوصول إلى هذا المورد'));
    }

    // التحقق من أن المستخدم لديه جميع الصلاحيات المطلوبة
    const hasAllPermissions = permissions.every(permission => 
      req.session.userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(errorFactory.forbidden('غير مصرح بالوصول إلى هذا المورد'));
    }

    next();
  };
};

/**
 * وسيط لإدارة إلغاء الرموز المميزة
 */
class TokenBlacklist {
  constructor() {
    this.blacklist = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 3600000); // تنظيف كل ساعة
  }

  /**
   * إضافة رمز مميز إلى القائمة السوداء
   * @param {string} token - الرمز المميز
   * @param {number} expiry - وقت انتهاء الصلاحية بالثواني منذ الآن
   */
  add(token, expiry) {
    const expiryTime = Date.now() + expiry * 1000;
    this.blacklist.set(token, expiryTime);
    logger.debug('تمت إضافة رمز مميز إلى القائمة السوداء', { expiryTime: new Date(expiryTime).toISOString() });
  }

  /**
   * التحقق مما إذا كان الرمز المميز في القائمة السوداء
   * @param {string} token - الرمز المميز
   * @returns {boolean} ما إذا كان الرمز المميز في القائمة السوداء
   */
  isBlacklisted(token) {
    return this.blacklist.has(token);
  }

  /**
   * تنظيف الرموز المميزة منتهية الصلاحية
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [token, expiry] of this.blacklist.entries()) {
      if (expiry <= now) {
        this.blacklist.delete(token);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(`تم تنظيف ${count} رمز مميز منتهي الصلاحية من القائمة السوداء`);
    }
  }

  /**
   * الحصول على حجم القائمة السوداء
   * @returns {number} عدد الرموز المميزة في القائمة السوداء
   */
  size() {
    return this.blacklist.size;
  }

  /**
   * إيقاف تنظيف القائمة السوداء
   */
  stopCleanup() {
    clearInterval(this.cleanupInterval);
  }
}

// إنشاء نسخة واحدة من القائمة السوداء
const tokenBlacklist = new TokenBlacklist();

module.exports = {
  configureSession,
  sessionValidator,
  authRequired,
  roleRequired,
  permissionRequired,
  tokenBlacklist,
};
