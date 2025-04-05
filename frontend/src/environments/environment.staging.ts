/**
 * @file environment.staging.ts
 * @description متغيرات البيئة للتجريب
 */
/**
 * environment.staging.ts
 * ملف البيئة للاختبار قبل الإنتاج
 */

export const environment = {
  production: false,
  staging: true,
  apiUrl: 'https://staging-api.adalalegalis.com/api',
  apiVersion: 'v1',
  appName: 'Adalalegalis - نظام إدارة المكاتب القانونية (اختبار)',
  defaultLanguage: 'ar',
  supportedLanguages: ['ar', 'en'],
  apiTimeout: 30000,

  // إعدادات المصادقة
  auth: {
    tokenExpirationTime: 3600, // بالثواني (ساعة واحدة)
    refreshTokenExpirationTime: 604800, // بالثواني (7 أيام)
    enableAutoRefresh: true,
    enable2FA: true,
    csrfProtection: true,
    sessionTimeout: 30, // بالدقائق
    enabled: true,
    tokenExpiry: 86400,
    refreshTokenExpiry: 604800,
    cookieSecure: true,
    cookieDomain: 'staging.adalalegalis.com'
  },
  
  // إعدادات الأداء
  performance: {
    enableServiceWorker: true,
    cacheApiResponses: true,
    apiCacheLifetime: 300000, // 5 دقائق بالمللي ثانية
    lazyLoadModules: true,
    preloadPrimaryRoutes: true,
    imageOptimization: true,
    minifyAssets: true,
    enableCompression: true,
  },
  
  // إعدادات التتبع والتحليلات
  analytics: {
    enabled: true,
    trackingId: 'UA-XXXXXXXXX-Y',
    anonymizeIp: true,
    logErrors: true,
    logPerformance: true,
  },
  
  // إعدادات الأمان
  security: {
    contentSecurityPolicy: true,
    strictTransportSecurity: true,
    xssProtection: true,
    clickjackingProtection: true,
  },
  
  // إعدادات الاختبار
  testing: {
    mockApi: false,
    logApiCalls: true,
    slowAnimations: false,
  },
  
  // إعدادات التصحيح
  debug: {
    enabled: true,
    logLevel: 'info', // debug, info, warn, error
    showErrorDetails: true,
    enableReduxDevTools: true,
  },
  
  // إعدادات الملفات
  files: {
    maxUploadSize: 10, // بالميجابايت
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    enableCompression: true,
    storageType: 's3', // local, s3, azure
  },
  
  // إعدادات الإشعارات
  notifications: {
    enablePush: true,
    enableEmail: true,
    enableSMS: true,
    notificationCheckInterval: 60000, // بالمللي ثانية (دقيقة واحدة)
  },
  
  // إعدادات الواجهة
  ui: {
    enableAnimations: true,
    enableRtl: true,
    defaultPageSize: 10,
    maxPageSize: 100,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    currency: 'SAR',
    theme: 'default',
    language: 'ar',
    rtlEnabled: true,
    animationsEnabled: true
  },
  
  // إعدادات الخرائط
  maps: {
    provider: 'google',
    apiKey: 'YOUR_STAGING_API_KEY',
    defaultCenter: { lat: 24.7136, lng: 46.6753 }, // الرياض
    defaultZoom: 10,
  },
  
  // إعدادات الدفع
  payment: {
    gateway: 'staging',
    testMode: true,
    supportedMethods: ['visa', 'mastercard', 'mada', 'applepay'],
    currency: 'SAR',
  },
  
  // إعدادات الميزات التجريبية
  features: {
    aiAssistant: true,
    documentOcr: true,
    voiceCommands: true,
    contractAnalysis: true,
    twoFactorAuth: true,
    caseAnalytics: true,
    advancedSearch: true,
    calendarIntegration: true
  },

  // تكوين التسجيل
  logging: {
    level: 'debug',
    apiCalls: true,
    errors: true,
    performance: true
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

