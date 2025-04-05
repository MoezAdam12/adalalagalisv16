/**
 * ملف التكوين الرئيسي للتطبيق
 * يقوم بتجميع وتصدير جميع ملفات التكوين
 */

const env = require('./env.config');
const auth = require('./auth.config');
const app = require('./app.config');
const db = require('./db.config');

module.exports = {
  env,
  auth,
  app,
  db,
  // تكوين عام للتطبيق
  appName: 'Adalalegalis',
  version: '1.0.0',
  apiPrefix: '/api/v1',
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test'
};
