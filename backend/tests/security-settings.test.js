const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user.model');
const SecuritySettings = require('../src/models/security-settings.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/auth.config');

describe('Security Settings API Tests', () => {
  let adminToken;
  let adminUser;
  let testSettings;
  
  beforeAll(async () => {
    // Create admin user if not exists
    adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
    
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // 'password'
        first_name: 'Admin',
        last_name: 'User',
        is_active: true
      });
    }
    
    // Generate token
    adminToken = jwt.sign({ id: adminUser.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    });
    
    // Clear security settings test data
    await SecuritySettings.destroy({ where: {} });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Security Settings API', () => {
    test('POST /api/security-settings - Should create security settings', async () => {
      const newSettings = {
        tenant_id: null, // Global settings
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: true,
        password_expiry_days: 90,
        password_history_count: 5,
        mfa_enabled: true,
        mfa_methods: ['email', 'app'],
        session_timeout_minutes: 30,
        max_login_attempts: 5,
        lockout_duration_minutes: 15,
        jwt_expiry_minutes: 60,
        allowed_ip_ranges: ['0.0.0.0/0'],
        cors_allowed_origins: ['*'],
        api_rate_limit_requests: 100,
        api_rate_limit_window_minutes: 15
      };
      
      const response = await request(app)
        .post('/api/security-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSettings);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.password_min_length).toBe(newSettings.password_min_length);
      expect(response.body.data.password_require_uppercase).toBe(newSettings.password_require_uppercase);
      expect(response.body.data.mfa_enabled).toBe(newSettings.mfa_enabled);
      
      testSettings = response.body.data;
    });
    
    test('GET /api/security-settings - Should return security settings', async () => {
      const response = await request(app)
        .get('/api/security-settings')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testSettings.id);
      expect(response.body.data.password_min_length).toBe(testSettings.password_min_length);
    });
    
    test('PUT /api/security-settings/:id - Should update security settings', async () => {
      const updatedSettings = {
        password_min_length: 10,
        password_require_symbols: false,
        mfa_enabled: true,
        mfa_methods: ['email', 'app', 'sms'],
        session_timeout_minutes: 60
      };
      
      const response = await request(app)
        .put(`/api/security-settings/${testSettings.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedSettings);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.password_min_length).toBe(updatedSettings.password_min_length);
      expect(response.body.data.password_require_symbols).toBe(updatedSettings.password_require_symbols);
      expect(response.body.data.session_timeout_minutes).toBe(updatedSettings.session_timeout_minutes);
      expect(response.body.data.mfa_methods).toEqual(expect.arrayContaining(updatedSettings.mfa_methods));
    });
    
    test('GET /api/security-settings/password-policy - Should return password policy', async () => {
      const response = await request(app)
        .get('/api/security-settings/password-policy')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('min_length');
      expect(response.body.data).toHaveProperty('require_uppercase');
      expect(response.body.data).toHaveProperty('require_lowercase');
      expect(response.body.data).toHaveProperty('require_numbers');
      expect(response.body.data).toHaveProperty('require_symbols');
    });
    
    test('POST /api/security-settings/validate-password - Should validate password', async () => {
      // Valid password
      const validResponse = await request(app)
        .post('/api/security-settings/validate-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'StrongP@ssw0rd' });
      
      expect(validResponse.statusCode).toBe(200);
      expect(validResponse.body.success).toBe(true);
      expect(validResponse.body.data.valid).toBe(true);
      
      // Invalid password
      const invalidResponse = await request(app)
        .post('/api/security-settings/validate-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'weak' });
      
      expect(invalidResponse.statusCode).toBe(200);
      expect(invalidResponse.body.success).toBe(true);
      expect(invalidResponse.body.data.valid).toBe(false);
      expect(invalidResponse.body.data.errors).toBeInstanceOf(Array);
      expect(invalidResponse.body.data.errors.length).toBeGreaterThan(0);
    });
    
    test('GET /api/security-settings/mfa-methods - Should return available MFA methods', async () => {
      const response = await request(app)
        .get('/api/security-settings/mfa-methods')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ value: 'email' }),
        expect.objectContaining({ value: 'app' })
      ]));
    });
    
    test('POST /api/security-settings/reset - Should reset security settings to defaults', async () => {
      const response = await request(app)
        .post('/api/security-settings/reset')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify settings were reset
      const verifyResponse = await request(app)
        .get('/api/security-settings')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.body.data.password_min_length).toBe(8); // Default value
    });
  });
});
