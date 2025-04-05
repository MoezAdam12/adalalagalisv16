/**
 * @file environment.ts
 * @description متغيرات البيئة للتطوير
 */

export const environment = {
  production: false,
  staging: false,
  apiUrl: 'http://localhost:3000/api',
  apiVersion: 'v1',
  apiTimeout: 30000,
  
  // تكوين المصادقة
  auth: {
    enabled: true,
    tokenExpiry: 86400,
    refreshTokenExpiry: 604800,
    cookieSecure: false,
    cookieDomain: 'localhost'
  },
  
  // ميزات التطبيق
  features: {
    twoFactorAuth: true,
    documentOcr: true,
    caseAnalytics: true,
    advancedSearch: true,
    calendarIntegration: true
  },
  
  // تكوين الأداء
  performance: {
    cacheEnabled: true,
    cacheMaxAge: 300,
    lazyLoadingEnabled: true,
    bundleAnalyzerEnabled: false
  },
  
  // تكوين التسجيل
  logging: {
    level: 'info',
    apiCalls: true,
    errors: true,
    performance: true
  },
  
  // تكوين واجهة المستخدم
  ui: {
    theme: 'default',
    language: 'ar',
    rtlEnabled: true,
    animationsEnabled: true
  },
  
  // تكاملات الطرف الثالث
  integrations: {
    googleAnalyticsId: '',
    sentryDsn: '',
    hotjarId: ''
  },
  
  // أدوات التطوير
  devTools: {
    enabled: true,
    mockApiEnabled: false
  }
};
