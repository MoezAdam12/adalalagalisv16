const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const errorMiddleware = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const tenantRoutes = require('./routes/tenants.routes');
const adminRoutes = require('./routes/admin.routes');
const rbacRoutes = require('./routes/rbac.routes');
const billingRoutes = require('./routes/billing.routes');
const notificationRoutes = require('./routes/notification.routes');
const uiThemeRoutes = require('./routes/ui-theme.routes');
const securitySettingsRoutes = require('./routes/security-settings.routes');
const externalIntegrationsRoutes = require('./routes/external-integrations.routes');
const auditLogRoutes = require('./routes/audit-log.routes');
const emailTemplateRoutes = require('./routes/email-template.routes');
const languageRoutes = require('./routes/language.routes');

// Initialize database
require('./config/database');

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ui-themes', uiThemeRoutes);
app.use('/api/security-settings', securitySettingsRoutes);
app.use('/api/external-integrations', externalIntegrationsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/languages', languageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    version: config.version
  });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
