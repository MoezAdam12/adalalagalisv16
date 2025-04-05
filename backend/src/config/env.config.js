/**
 * تكوين متغيرات البيئة
 * يقوم هذا الملف بتحميل متغيرات البيئة من ملف .env والتحقق من وجود المتغيرات الضرورية
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// تحديد مسار ملف .env بناءً على بيئة التشغيل
const envPath = path.resolve(process.cwd(), `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`);

// التحقق من وجود ملف .env وتحميله
if (fs.existsSync(envPath)) {
  console.log(`تم تحميل متغيرات البيئة من ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('لم يتم العثور على ملف .env، سيتم استخدام متغيرات البيئة الحالية');
  dotenv.config();
}

// قائمة بالمتغيرات الضرورية
const requiredEnvVars = [
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'RESET_TOKEN_SECRET',
  'EMAIL_VERIFICATION_SECRET',
  'SESSION_SECRET',
  'DATABASE_URL',
  'NODE_ENV'
];

// التحقق من وجود المتغيرات الضرورية
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// إذا كانت هناك متغيرات مفقودة، قم بإظهار تحذير
if (missingEnvVars.length > 0) {
  console.warn(`تحذير: المتغيرات البيئية التالية مفقودة: ${missingEnvVars.join(', ')}`);
  
  // في بيئة الإنتاج، يجب إيقاف التطبيق إذا كانت هناك متغيرات ضرورية مفقودة
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`متغيرات البيئة الضرورية مفقودة: ${missingEnvVars.join(', ')}`);
  }
}

// تصدير متغيرات البيئة مع قيم افتراضية آمنة للتطوير فقط
module.exports = {
  // معلومات التطبيق
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  API_URL: process.env.API_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
  
  // تكوين قاعدة البيانات
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL: process.env.DATABASE_SSL === 'true',
  
  // تكوين JWT والمصادقة
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  RESET_TOKEN_SECRET: process.env.RESET_TOKEN_SECRET,
  RESET_TOKEN_EXPIRATION: process.env.RESET_TOKEN_EXPIRATION || '1h',
  EMAIL_VERIFICATION_SECRET: process.env.EMAIL_VERIFICATION_SECRET,
  EMAIL_VERIFICATION_EXPIRATION: process.env.EMAIL_VERIFICATION_EXPIRATION || '24h',
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_EXPIRATION: process.env.SESSION_EXPIRATION || '24h',
  
  // تكوين CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:4200',
  
  // تكوين البريد الإلكتروني
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@adalalegalis.com',
  
  // تكوين خدمة ML
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:5000',
  
  // تكوين التخزين
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local', // local, s3, azure, gcs
  STORAGE_BUCKET: process.env.STORAGE_BUCKET,
  
  // تكوين الأمان
  ENABLE_RATE_LIMIT: process.env.ENABLE_RATE_LIMIT !== 'false',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 دقيقة
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  ENABLE_HELMET: process.env.ENABLE_HELMET !== 'false',
  ENABLE_XSS_PROTECTION: process.env.ENABLE_XSS_PROTECTION !== 'false',
  ENABLE_CSRF_PROTECTION: process.env.ENABLE_CSRF_PROTECTION !== 'false',
  
  // تكوين التسجيل
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // تكوين المراقبة
  ENABLE_MONITORING: process.env.ENABLE_MONITORING === 'true',
  
  // تكوين التشفير
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  
  // تكوين المصادقة الثنائية
  ENABLE_2FA: process.env.ENABLE_2FA === 'true',
  
  // تكوين الاشتراكات
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // تكوين التكاملات الخارجية
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // تكوين الذاكرة المؤقتة
  REDIS_URL: process.env.REDIS_URL,
  ENABLE_CACHE: process.env.ENABLE_CACHE === 'true',
  
  // تكوين الأداء
  CLUSTER_MODE: process.env.CLUSTER_MODE === 'true',
  
  // تكوين الأمان الإضافي
  CONTENT_SECURITY_POLICY: process.env.CONTENT_SECURITY_POLICY === 'true',
  HSTS_ENABLED: process.env.HSTS_ENABLED === 'true',
  HSTS_MAX_AGE: parseInt(process.env.HSTS_MAX_AGE, 10) || 15552000, // 180 يوم
  
  // تكوين قائمة الرفض للرموز المميزة
  TOKEN_BLACKLIST_ENABLED: process.env.TOKEN_BLACKLIST_ENABLED !== 'false',
  
  // تكوين تشفير البيانات
  DATA_ENCRYPTION_ENABLED: process.env.DATA_ENCRYPTION_ENABLED === 'true',
  
  // تكوين كشف التسلل
  INTRUSION_DETECTION_ENABLED: process.env.INTRUSION_DETECTION_ENABLED === 'true',
  
  // تكوين الحماية من هجمات DDoS
  DDOS_PROTECTION_ENABLED: process.env.DDOS_PROTECTION_ENABLED === 'true',
  
  // تكوين إدارة الجلسة
  SESSION_INVALIDATION_ENABLED: process.env.SESSION_INVALIDATION_ENABLED !== 'false',
  
  // تكوين رؤوس HTTP الأمنية
  SECURITY_HEADERS_ENABLED: process.env.SECURITY_HEADERS_ENABLED !== 'false'
};
