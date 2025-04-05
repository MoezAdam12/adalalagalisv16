module.exports = {
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'adalalegalis-jwt-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h', // 24 hours
  
  // Refresh token configuration
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'adalalegalis-refresh-token-secret-key-change-in-production',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d', // 7 days
  
  // Password reset token configuration
  resetTokenSecret: process.env.RESET_TOKEN_SECRET || 'adalalegalis-reset-token-secret-key-change-in-production',
  resetTokenExpiration: process.env.RESET_TOKEN_EXPIRATION || '1h', // 1 hour
  
  // Email verification token configuration
  emailVerificationSecret: process.env.EMAIL_VERIFICATION_SECRET || 'adalalegalis-email-verification-secret-key-change-in-production',
  emailVerificationExpiration: process.env.EMAIL_VERIFICATION_EXPIRATION || '24h', // 24 hours
  
  // Password policy
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: true,
  
  // Account lockout policy
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || 'adalalegalis-session-secret-key-change-in-production',
  sessionExpiration: process.env.SESSION_EXPIRATION || '24h', // 24 hours
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};
