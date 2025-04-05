/**
 * auth.validator.js
 * مكتبة للتحقق من صحة بيانات المصادقة وتأمين طلبات API
 */

const jwt = require('jsonwebtoken');
const { body, validationResult, param, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * وحدة التحقق من صحة بيانات المصادقة
 * توفر مجموعة من الدوال للتحقق من صحة بيانات المستخدم وتأمين الطلبات
 */
const authValidator = {
  /**
   * التحقق من صحة بيانات تسجيل الدخول
   * @returns مصفوفة من قواعد التحقق
   */
  validateLogin: () => {
    return [
      body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('يرجى إدخال بريد إلكتروني صالح')
        .normalizeEmail(),
      body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 }).withMessage('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل')
    ];
  },

  /**
   * التحقق من صحة بيانات إنشاء حساب جديد
   * @returns مصفوفة من قواعد التحقق
   */
  validateRegistration: () => {
    return [
      body('firstName')
        .notEmpty().withMessage('الاسم الأول مطلوب')
        .isLength({ min: 2, max: 50 }).withMessage('يجب أن يتراوح طول الاسم الأول بين 2 و 50 حرفًا')
        .trim(),
      body('lastName')
        .notEmpty().withMessage('الاسم الأخير مطلوب')
        .isLength({ min: 2, max: 50 }).withMessage('يجب أن يتراوح طول الاسم الأخير بين 2 و 50 حرفًا')
        .trim(),
      body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('يرجى إدخال بريد إلكتروني صالح')
        .normalizeEmail(),
      body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 }).withMessage('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز خاص على الأقل'),
      body('confirmPassword')
        .notEmpty().withMessage('تأكيد كلمة المرور مطلوب')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('كلمات المرور غير متطابقة');
          }
          return true;
        }),
      body('phoneNumber')
        .optional()
        .isMobilePhone(['ar-SA', 'ar-AE', 'ar-EG', 'ar-JO']).withMessage('يرجى إدخال رقم هاتف صالح'),
      body('role')
        .optional()
        .isIn(['admin', 'lawyer', 'client', 'staff']).withMessage('دور المستخدم غير صالح')
    ];
  },

  /**
   * التحقق من صحة بيانات تغيير كلمة المرور
   * @returns مصفوفة من قواعد التحقق
   */
  validatePasswordChange: () => {
    return [
      body('currentPassword')
        .notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
      body('newPassword')
        .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
        .isLength({ min: 8 }).withMessage('يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز خاص على الأقل')
        .custom((value, { req }) => {
          if (value === req.body.currentPassword) {
            throw new Error('يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية');
          }
          return true;
        }),
      body('confirmNewPassword')
        .notEmpty().withMessage('تأكيد كلمة المرور الجديدة مطلوب')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('كلمات المرور غير متطابقة');
          }
          return true;
        })
    ];
  },

  /**
   * التحقق من صحة بيانات إعادة تعيين كلمة المرور
   * @returns مصفوفة من قواعد التحقق
   */
  validatePasswordReset: () => {
    return [
      body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('يرجى إدخال بريد إلكتروني صالح')
        .normalizeEmail()
    ];
  },

  /**
   * التحقق من صحة رمز إعادة تعيين كلمة المرور
   * @returns مصفوفة من قواعد التحقق
   */
  validateResetToken: () => {
    return [
      body('token')
        .notEmpty().withMessage('الرمز مطلوب')
        .isLength({ min: 32, max: 128 }).withMessage('الرمز غير صالح'),
      body('newPassword')
        .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
        .isLength({ min: 8 }).withMessage('يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز خاص على الأقل'),
      body('confirmNewPassword')
        .notEmpty().withMessage('تأكيد كلمة المرور الجديدة مطلوب')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('كلمات المرور غير متطابقة');
          }
          return true;
        })
    ];
  },

  /**
   * التحقق من صحة بيانات تحديث الملف الشخصي
   * @returns مصفوفة من قواعد التحقق
   */
  validateProfileUpdate: () => {
    return [
      body('firstName')
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage('يجب أن يتراوح طول الاسم الأول بين 2 و 50 حرفًا')
        .trim(),
      body('lastName')
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage('يجب أن يتراوح طول الاسم الأخير بين 2 و 50 حرفًا')
        .trim(),
      body('phoneNumber')
        .optional()
        .isMobilePhone(['ar-SA', 'ar-AE', 'ar-EG', 'ar-JO']).withMessage('يرجى إدخال رقم هاتف صالح'),
      body('address')
        .optional()
        .isLength({ max: 200 }).withMessage('يجب ألا يتجاوز طول العنوان 200 حرف'),
      body('email')
        .optional()
        .isEmail().withMessage('يرجى إدخال بريد إلكتروني صالح')
        .normalizeEmail()
    ];
  },

  /**
   * التحقق من صحة معرف المستخدم
   * @returns مصفوفة من قواعد التحقق
   */
  validateUserId: () => {
    return [
      param('id')
        .notEmpty().withMessage('معرف المستخدم مطلوب')
        .isMongoId().withMessage('معرف المستخدم غير صالح')
    ];
  },

  /**
   * التحقق من صحة معلمات البحث عن المستخدمين
   * @returns مصفوفة من قواعد التحقق
   */
  validateUserSearch: () => {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('رقم الصفحة يجب أن يكون رقمًا صحيحًا أكبر من 0')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('حد النتائج يجب أن يكون رقمًا صحيحًا بين 1 و 100')
        .toInt(),
      query('role')
        .optional()
        .isIn(['admin', 'lawyer', 'client', 'staff']).withMessage('دور المستخدم غير صالح'),
      query('sortBy')
        .optional()
        .isIn(['firstName', 'lastName', 'email', 'createdAt']).withMessage('حقل الترتيب غير صالح'),
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc']).withMessage('اتجاه الترتيب غير صالح')
    ];
  },

  /**
   * التحقق من صحة بيانات المصادقة الثنائية
   * @returns مصفوفة من قواعد التحقق
   */
  validate2FASetup: () => {
    return [
      body('enable')
        .notEmpty().withMessage('حالة المصادقة الثنائية مطلوبة')
        .isBoolean().withMessage('حالة المصادقة الثنائية يجب أن تكون قيمة منطقية')
        .toBoolean()
    ];
  },

  /**
   * التحقق من صحة رمز المصادقة الثنائية
   * @returns مصفوفة من قواعد التحقق
   */
  validate2FAVerify: () => {
    return [
      body('code')
        .notEmpty().withMessage('رمز المصادقة مطلوب')
        .isLength({ min: 6, max: 6 }).withMessage('رمز المصادقة يجب أن يتكون من 6 أرقام')
        .isNumeric().withMessage('رمز المصادقة يجب أن يتكون من أرقام فقط')
    ];
  },

  /**
   * التحقق من نتائج التحقق من الصحة
   * @param {Object} req - كائن الطلب
   * @param {Object} res - كائن الاستجابة
   * @param {Function} next - دالة الانتقال إلى الوسيط التالي
   * @returns {Object} استجابة الخطأ أو الانتقال إلى الوسيط التالي
   */
  validate: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      });
    }
    next();
  },

  /**
   * التحقق من صحة رمز JWT
   * @param {Object} req - كائن الطلب
   * @param {Object} res - كائن الاستجابة
   * @param {Function} next - دالة الانتقال إلى الوسيط التالي
   * @returns {Object} استجابة الخطأ أو الانتقال إلى الوسيط التالي
   */
  verifyToken: (req, res, next) => {
    try {
      // الحصول على الرمز المميز من رأس الطلب
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'غير مصرح به - الرمز المميز مفقود'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // التحقق من صحة الرمز المميز
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // إضافة معلومات المستخدم إلى الطلب
      req.user = decoded;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'انتهت صلاحية الرمز المميز'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'غير مصرح به - الرمز المميز غير صالح'
      });
    }
  },

  /**
   * التحقق من صلاحيات المستخدم
   * @param {Array} roles - مصفوفة من الأدوار المسموح بها
   * @returns {Function} وسيط للتحقق من الصلاحيات
   */
  checkRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'غير مصرح به - يرجى تسجيل الدخول'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'محظور - ليس لديك صلاحية للوصول إلى هذا المورد'
        });
      }

      next();
    };
  },

  /**
   * التحقق من صحة رمز CSRF
   * @param {Object} req - كائن الطلب
   * @param {Object} res - كائن الاستجابة
   * @param {Function} next - دالة الانتقال إلى الوسيط التالي
   * @returns {Object} استجابة الخطأ أو الانتقال إلى الوسيط التالي
   */
  verifyCsrfToken: (req, res, next) => {
    // الحصول على رمز CSRF من رأس الطلب
    const csrfToken = req.headers['x-csrf-token'];
    
    // الحصول على رمز CSRF المخزن في الجلسة
    const sessionCsrfToken = req.session?.csrfToken;
    
    // التحقق من وجود الرمز وصحته
    if (!csrfToken || !sessionCsrfToken || csrfToken !== sessionCsrfToken) {
      return res.status(403).json({
        success: false,
        message: 'رمز CSRF غير صالح أو مفقود'
      });
    }
    
    next();
  },

  /**
   * إنشاء رمز CSRF جديد
   * @param {Object} req - كائن الطلب
   * @param {Object} res - كائن الاستجابة
   * @returns {Object} استجابة تحتوي على رمز CSRF
   */
  generateCsrfToken: (req, res) => {
    // إنشاء رمز CSRF جديد
    const csrfToken = crypto.randomBytes(32).toString('hex');
    
    // تخزين الرمز في الجلسة
    req.session.csrfToken = csrfToken;
    
    return res.status(200).json({
      success: true,
      csrfToken
    });
  },

  /**
   * التحقق من حدود معدل الطلبات
   * @param {Object} req - كائن الطلب
   * @param {Object} res - كائن الاستجابة
   * @param {Function} next - دالة الانتقال إلى الوسيط التالي
   * @returns {Object} استجابة الخطأ أو الانتقال إلى الوسيط التالي
   */
  checkRateLimit: (req, res, next) => {
    // يمكن تنفيذ هذه الوظيفة باستخدام مكتبة express-rate-limit
    // هذا مجرد مثال بسيط
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 دقيقة
    const maxRequests = 100; // الحد الأقصى للطلبات
    
    // التحقق من وجود سجل للعنوان IP
    if (!global.rateLimit) {
      global.rateLimit = {};
    }
    
    if (!global.rateLimit[ip]) {
      global.rateLimit[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }
    
    // إعادة تعيين العداد إذا انتهت فترة النافذة
    if (now > global.rateLimit[ip].resetTime) {
      global.rateLimit[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }
    
    // التحقق من تجاوز الحد الأقصى
    if (global.rateLimit[ip].count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة مرة أخرى لاحقًا'
      });
    }
    
    // زيادة عداد الطلبات
    global.rateLimit[ip].count++;
    next();
  },

  /**
   * تشفير كلمة المرور
   * @param {string} password - كلمة المرور المراد تشفيرها
   * @returns {Promise<string>} كلمة المرور المشفرة
   */
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  /**
   * مقارنة كلمة المرور بالنسخة المشفرة
   * @param {string} password - كلمة المرور المدخلة
   * @param {string} hashedPassword - كلمة المرور المشفرة المخزنة
   * @returns {Promise<boolean>} نتيجة المقارنة
   */
  comparePassword: async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
  },

  /**
   * إنشاء رمز JWT
   * @param {Object} payload - البيانات المراد تضمينها في الرمز
   * @param {string} expiresIn - مدة صلاحية الرمز
   * @returns {string} الرمز المميز
   */
  generateToken: (payload, expiresIn = '1d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  },

  /**
   * إنشاء رمز تحديث
   * @param {Object} payload - البيانات المراد تضمينها في الرمز
   * @returns {string} رمز التحديث
   */
  generateRefreshToken: (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  },

  /**
   * التحقق من صحة رمز التحديث
   * @param {string} token - رمز التحديث
   * @returns {Object} البيانات المستخرجة من الرمز
   */
  verifyRefreshToken: (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  },

  /**
   * إنشاء رمز إعادة تعيين كلمة المرور
   * @returns {string} رمز إعادة التعيين
   */
  generateResetToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * التحقق من تكامل البيانات باستخدام HMAC
   * @param {Object} data - البيانات المراد التحقق منها
   * @param {string} signature - التوقيع المستلم
   * @returns {boolean} نتيجة التحقق
   */
  verifyDataIntegrity: (data, signature) => {
    const hmac = crypto.createHmac('sha256', process.env.HMAC_SECRET);
    hmac.update(JSON.stringify(data));
    const computedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  }
};

module.exports = authValidator;
