/**
 * @file environment.staging.ts
 * @description متغيرات البيئة للتجريب
 */

export const environment = {
  production: false,
  staging: true,
  apiUrl: 'https://staging-api.adalalegalis.com/api',
  apiVersion: 'v1',
  apiTimeout: 30000,
  
  // تكوين المصادقة
  auth: {
    enabled: true,
    tokenExpiry: 86400,
    refreshTokenExpiry: 604800,
    cookieSecure: true,
    cookieDomain: 'staging.adalalegalis.com'
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
    bundleAnalyzerEnabled: true
  },
  
  // تكوين التسجيل
  logging: {
    level: 'debug',
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
    googleAnalyticsId: 'UA-XXXXXXXXX-X',
    sentryDsn: 'https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@sentry.io/XXXXXX',
    hotjarId: 'XXXXXXX'
  },
  
  // أدوات التطوير
  devTools: {
    enabled: true,
    mockApiEnabled: false
  }
};
