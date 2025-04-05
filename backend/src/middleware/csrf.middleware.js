/**
 * وسيط حماية CSRF
 * يوفر هذا الوسيط حماية ضد هجمات تزوير الطلبات عبر المواقع (CSRF)
 */

const csrf = require('csurf');
const authConfig = require('../config/auth.config');

// إنشاء وسيط CSRF مع خيارات مخصصة
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // ساعة واحدة بالثواني
  }
});

/**
 * وسيط حماية CSRF
 * يتم تطبيقه على الطرق التي تتطلب حماية CSRF
 */
const csrfMiddleware = (req, res, next) => {
  // تخطي حماية CSRF إذا كانت معطلة في التكوين
  if (!authConfig.csrfProtectionEnabled) {
    return next();
  }

  // تخطي حماية CSRF لطلبات OPTIONS (للتعامل مع طلبات CORS المسبقة)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // تطبيق حماية CSRF
  csrfProtection(req, res, (err) => {
    if (err) {
      // تسجيل محاولة CSRF محتملة
      console.error('خطأ CSRF محتمل:', err.message);
      
      // إرسال استجابة خطأ
      return res.status(403).json({
        status: 'error',
        message: 'فشل التحقق من رمز CSRF. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
        code: 'CSRF_ERROR'
      });
    }
    
    next();
  });
};

/**
 * وسيط توليد رمز CSRF
 * يستخدم لتوليد رمز CSRF وإرساله في الاستجابة
 */
const generateCsrfToken = (req, res, next) => {
  // تخطي توليد رمز CSRF إذا كانت حماية CSRF معطلة
  if (!authConfig.csrfProtectionEnabled) {
    return next();
  }

  // تطبيق حماية CSRF لتوليد الرمز
  csrfProtection(req, res, (err) => {
    if (err) {
      console.error('خطأ في توليد رمز CSRF:', err.message);
      return next();
    }
    
    // إضافة رمز CSRF إلى الاستجابة
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      path: '/',
      httpOnly: false, // يجب أن يكون false ليتمكن JavaScript من قراءته
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 * 1000 // ساعة واحدة بالميلي ثانية
    });
    
    next();
  });
};

module.exports = {
  csrfProtection: csrfMiddleware,
  generateCsrfToken
};
