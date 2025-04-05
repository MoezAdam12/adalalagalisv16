/**
 * تكوين المصادقة
 * يستخدم هذا الملف تكوين البيئة من env.config.js
 */

const envConfig = require('./env.config');

module.exports = {
  // تكوين JWT
  jwtSecret: envConfig.JWT_SECRET,
  jwtExpiration: envConfig.JWT_EXPIRATION,
  
  // تكوين رمز التحديث
  refreshTokenSecret: envConfig.REFRESH_TOKEN_SECRET,
  refreshTokenExpiration: envConfig.REFRESH_TOKEN_EXPIRATION,
  
  // تكوين رمز إعادة تعيين كلمة المرور
  resetTokenSecret: envConfig.RESET_TOKEN_SECRET,
  resetTokenExpiration: envConfig.RESET_TOKEN_EXPIRATION,
  
  // تكوين رمز التحقق من البريد الإلكتروني
  emailVerificationSecret: envConfig.EMAIL_VERIFICATION_SECRET,
  emailVerificationExpiration: envConfig.EMAIL_VERIFICATION_EXPIRATION,
  
  // سياسة كلمة المرور
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: true,
  
  // سياسة قفل الحساب
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 دقيقة بالميلي ثانية
  
  // تكوين الجلسة
  sessionSecret: envConfig.SESSION_SECRET,
  sessionExpiration: envConfig.SESSION_EXPIRATION,
  
  // تكوين CORS
  corsOrigin: envConfig.CORS_ORIGIN,
  
  // تقييد معدل الطلبات
  rateLimit: {
    windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
    max: envConfig.RATE_LIMIT_MAX
  },
  
  // تكوين قائمة الرفض للرموز المميزة
  tokenBlacklistEnabled: envConfig.TOKEN_BLACKLIST_ENABLED,
  
  // تكوين المصادقة الثنائية
  enable2FA: envConfig.ENABLE_2FA,
  
  // تكوين إدارة الجلسة
  sessionInvalidationEnabled: envConfig.SESSION_INVALIDATION_ENABLED,
  
  // تكوين حماية CSRF
  csrfProtectionEnabled: envConfig.ENABLE_CSRF_PROTECTION,
  
  // تكوين رؤوس HTTP الأمنية
  securityHeadersEnabled: envConfig.SECURITY_HEADERS_ENABLED,
  
  // تكوين سياسة أمان المحتوى
  contentSecurityPolicyEnabled: envConfig.CONTENT_SECURITY_POLICY,
  
  // تكوين HSTS
  hstsEnabled: envConfig.HSTS_ENABLED,
  hstsMaxAge: envConfig.HSTS_MAX_AGE,
  
  // تكوين كشف التسلل
  intrusionDetectionEnabled: envConfig.INTRUSION_DETECTION_ENABLED,
  
  // تكوين الحماية من هجمات DDoS
  ddosProtectionEnabled: envConfig.DDOS_PROTECTION_ENABLED
};
