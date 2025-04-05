const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user.model');
const AuditLog = require('../src/models/audit-log.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/auth.config');

describe('Audit Logs API Tests', () => {
  let adminToken;
  let adminUser;
  let testLog;
  
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
    
    // Clear audit log test data
    await AuditLog.destroy({ where: {} });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Audit Logs API', () => {
    test('POST /api/audit-logs - Should create a new audit log entry', async () => {
      const newLog = {
        user_id: adminUser.id,
        action: 'create',
        entity_type: 'user',
        entity_id: '123',
        description: 'Created a new user',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test',
        old_values: null,
        new_values: { username: 'newuser', email: 'newuser@example.com' },
        status: 'success',
        severity: 'info'
      };
      
      const response = await request(app)
        .post('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newLog);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe(newLog.action);
      expect(response.body.data.entity_type).toBe(newLog.entity_type);
      expect(response.body.data.description).toBe(newLog.description);
      
      testLog = response.body.data;
    });
    
    test('GET /api/audit-logs - Should return all audit logs', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(1);
    });
    
    test('GET /api/audit-logs/:id - Should return a specific audit log', async () => {
      const response = await request(app)
        .get(`/api/audit-logs/${testLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLog.id);
      expect(response.body.data.action).toBe(testLog.action);
    });
    
    test('GET /api/audit-logs/filter - Should filter audit logs', async () => {
      // Create another log with different action
      const updateLog = {
        user_id: adminUser.id,
        action: 'update',
        entity_type: 'user',
        entity_id: '123',
        description: 'Updated user information',
        status: 'success',
        severity: 'info'
      };
      
      await request(app)
        .post('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateLog);
      
      // Filter by action
      const response = await request(app)
        .get('/api/audit-logs/filter?action=update')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.logs.every(log => log.action === 'update')).toBe(true);
    });
    
    test('GET /api/audit-logs/actions - Should return available audit log actions', async () => {
      const response = await request(app)
        .get('/api/audit-logs/actions')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data).toContain('create');
      expect(response.body.data).toContain('update');
    });
    
    test('GET /api/audit-logs/entity-types - Should return available entity types', async () => {
      const response = await request(app)
        .get('/api/audit-logs/entity-types')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data).toContain('user');
    });
    
    test('GET /api/audit-logs/severities - Should return available severities', async () => {
      const response = await request(app)
        .get('/api/audit-logs/severities')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data).toContain('info');
      expect(response.body.data).toContain('warning');
      expect(response.body.data).toContain('error');
    });
    
    test('POST /api/audit-logs/export - Should export audit logs', async () => {
      const response = await request(app)
        .post('/api/audit-logs/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ format: 'csv' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('url');
    });
    
    test('GET /api/audit-logs/statistics - Should return audit log statistics', async () => {
      const response = await request(app)
        .get('/api/audit-logs/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_logs');
      expect(response.body.data).toHaveProperty('logs_by_action');
      expect(response.body.data).toHaveProperty('logs_by_entity_type');
      expect(response.body.data).toHaveProperty('logs_by_severity');
    });
  });
});
