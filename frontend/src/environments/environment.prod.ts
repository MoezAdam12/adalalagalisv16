/**
 * environment.prod.ts
 * ملف البيئة للإنتاج
 */

export const environment = {
  production: true,
  staging: false,
  apiUrl: 'https://api.adalalegalis.com/api',
  apiVersion: 'v1',
  appName: 'Adalalegalis - نظام إدارة المكاتب القانونية',
  defaultLanguage: 'ar',
  supportedLanguages: ['ar', 'en'],
  
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
    cookieDomain: 'adalalegalis.com'
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
    cacheEnabled: true,
    cacheMaxAge: 300,
    lazyLoadingEnabled: true,
    bundleAnalyzerEnabled: false
  },
  
  // إعدادات التتبع والتحليلات
  analytics: {
    enabled: true,
    trackingId: 'UA-XXXXXXXXX-X',
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
    logApiCalls: false,
    slowAnimations: false,
  },
  
  // إعدادات التصحيح
  debug: {
    enabled: false,
    logLevel: 'error', // debug, info, warn, error
    showErrorDetails: false,
    enableReduxDevTools: false,
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
    apiKey: 'YOUR_PRODUCTION_API_KEY',
    defaultCenter: { lat: 24.7136, lng: 46.6753 }, // الرياض
    defaultZoom: 10,
  },
  
  // إعدادات الدفع
  payment: {
    gateway: 'production',
    testMode: false,
    supportedMethods: ['visa', 'mastercard', 'mada', 'applepay'],
    currency: 'SAR',
  },
  
  // إعدادات الميزات التجريبية
  features: {
    aiAssistant: true,
    documentOcr: true,
    voiceCommands: false,
    contractAnalysis: true,
    twoFactorAuth: true,
    caseAnalytics: true,
    advancedSearch: true,
    calendarIntegration: true
  },
  
  // تكوين التسجيل
  logging: {
    level: 'error',
    apiCalls: false,
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
    enabled: false,
    mockApiEnabled: false
  }
};
