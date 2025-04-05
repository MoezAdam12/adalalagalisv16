/**
 * @file security-headers.middleware.js
 * @description وسيط رؤوس الأمان للتطبيق
 * يوفر هذا الملف آلية لتكوين وتنفيذ رؤوس HTTP الأمنية
 */

/**
 * وسيط رؤوس الأمان
 * يضيف رؤوس HTTP الأمنية إلى الاستجابات
 * @param {Request} req طلب Express
 * @param {Response} res استجابة Express
 * @param {Function} next دالة التالي
 */
const securityHeadersMiddleware = (req, res, next) => {
  // Content-Security-Policy
  // تحديد مصادر المحتوى المسموح بها
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net https://ajax.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://secure.gravatar.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.adalalegalis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  // تعيين رأس Content-Security-Policy إذا كان مفعلاً
  if (process.env.CONTENT_SECURITY_POLICY_ENABLED === 'true') {
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  }
  
  // X-Content-Type-Options
  // منع المتصفح من تخمين نوع المحتوى
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  // منع تضمين الصفحة في إطارات
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  // تفعيل حماية XSS في المتصفحات القديمة
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict-Transport-Security
  // إجبار استخدام HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Referrer-Policy
  // التحكم في معلومات المرجع المرسلة
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (formerly Feature-Policy)
  // تقييد ميزات المتصفح
  const permissionsPolicy = [
    'accelerometer=())',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()'
  ];
  res.setHeader('Permissions-Policy', permissionsPolicy.join(', '));
  
  // Cache-Control
  // التحكم في تخزين الصفحات مؤقتًا
  if (req.method === 'GET') {
    // السماح بتخزين الأصول الثابتة مؤقتًا
    if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|ttf|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 ساعة
    } else {
      // منع تخزين الصفحات الديناميكية مؤقتًا
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  } else {
    // منع تخزين استجابات الطلبات غير GET مؤقتًا
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * وسيط CORS
 * يضيف رؤوس CORS إلى الاستجابات
 * @param {Object} options خيارات CORS
 * @returns {Function} وسيط Express
 */
const corsMiddleware = (options = {}) => {
  const defaultOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    maxAge: 86400 // 24 ساعة
  };
  
  // دمج الخيارات المقدمة مع الخيارات الافتراضية
  const corsOptions = { ...defaultOptions, ...options };
  
  return (req, res, next) => {
    // تعيين رأس Access-Control-Allow-Origin
    const requestOrigin = req.headers.origin;
    
    if (corsOptions.origin === '*') {
      // السماح لجميع الأصول
      res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
    } else if (typeof corsOptions.origin === 'string') {
      // السماح لأصل محدد
      res.setHeader('Access-Control-Allow-Origin', corsOptions.origin);
    } else if (Array.isArray(corsOptions.origin)) {
      // السماح لقائمة من الأصول
      if (requestOrigin && corsOptions.origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', corsOptions.origin[0]);
      }
    } else if (typeof corsOptions.origin === 'function') {
      // استخدام دالة لتحديد الأصل
      const origin = corsOptions.origin(requestOrigin, (err, origin) => {
        if (err || !origin) {
          res.setHeader('Access-Control-Allow-Origin', '');
        } else {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      });
    }
    
    // تعيين رؤوس CORS الأخرى
    res.setHeader('Access-Control-Allow-Methods', corsOptions.methods);
    
    if (corsOptions.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    if (corsOptions.maxAge) {
      res.setHeader('Access-Control-Max-Age', corsOptions.maxAge);
    }
    
    // تعيين رأس Access-Control-Allow-Headers
    const requestHeaders = req.headers['access-control-request-headers'];
    if (requestHeaders) {
      res.setHeader('Access-Control-Allow-Headers', requestHeaders);
    } else if (corsOptions.allowedHeaders) {
      res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders);
    } else {
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN');
    }
    
    // تعيين رأس Access-Control-Expose-Headers
    if (corsOptions.exposedHeaders) {
      res.setHeader('Access-Control-Expose-Headers', corsOptions.exposedHeaders);
    }
    
    // معالجة طلبات OPTIONS
    if (req.method === 'OPTIONS') {
      if (corsOptions.preflightContinue) {
        next();
      } else {
        res.statusCode = corsOptions.optionsSuccessStatus;
        res.setHeader('Content-Length', '0');
        res.end();
      }
    } else {
      next();
    }
  };
};

// تصدير الوسطاء
module.exports = {
  securityHeadersMiddleware,
  corsMiddleware
};
