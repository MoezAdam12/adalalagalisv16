module.exports = {
  // Application configuration
  appName: 'Adalalegalis',
  appVersion: '1.0.0',
  apiUrl: process.env.API_URL || 'https://www.adalalegalis.com/api',
  frontendUrl: process.env.FRONTEND_URL || 'https://www.adalalegalis.com',
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    directory: process.env.LOG_DIR || 'logs'
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'noreply@adalalegalis.com',
      pass: process.env.EMAIL_PASSWORD || 'your-email-password'
    },
    from: process.env.EMAIL_FROM || 'Adalalegalis <noreply@adalalegalis.com>'
  },
  
  // File upload configuration
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    directory: process.env.UPLOAD_DIR || 'uploads'
  },
  
  // ML service configuration
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://ml-service:5000',
    timeout: process.env.ML_SERVICE_TIMEOUT || 30000 // 30 seconds
  },
  
  // Subscription plans
  subscriptionPlans: {
    basic: {
      name: 'الابتدائية',
      maxUsers: 5,
      maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
      features: ['إدارة القضايا الأساسية', 'إدارة العملاء', 'إدارة المستندات الأساسية']
    },
    standard: {
      name: 'الأساسية',
      maxUsers: 15,
      maxStorage: 20 * 1024 * 1024 * 1024, // 20GB
      features: ['إدارة القضايا المتقدمة', 'إدارة العملاء', 'إدارة المستندات المتقدمة', 'إدارة العقود', 'التقويم والمواعيد']
    },
    professional: {
      name: 'الاحترافية',
      maxUsers: 30,
      maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
      features: ['جميع ميزات الباقة الأساسية', 'إدارة الموارد البشرية', 'إدارة المالية', 'تتبع الوقت', 'التحليلات الأساسية']
    },
    enterprise: {
      name: 'المؤسسية',
      maxUsers: -1, // غير محدود
      maxStorage: 200 * 1024 * 1024 * 1024, // 200GB
      features: ['جميع ميزات الباقة الاحترافية', 'دعم مخصص', 'تحليلات متقدمة', 'تكامل API', 'نسخ احتياطي متقدم', 'تخصيص كامل']
    }
  }
};
