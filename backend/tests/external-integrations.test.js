const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user.model');
const ExternalIntegration = require('../src/models/external-integration.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/auth.config');

describe('External Integrations API Tests', () => {
  let adminToken;
  let adminUser;
  let testIntegration;
  
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
    
    // Clear external integration test data
    await ExternalIntegration.destroy({ where: {} });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('External Integrations API', () => {
    test('POST /api/external-integrations - Should create a new integration', async () => {
      const newIntegration = {
        name: 'Google Drive',
        provider: 'google',
        type: 'storage',
        description: 'Integration with Google Drive for file storage',
        tenant_id: null, // Global integration
        config: {
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          redirect_uri: 'https://example.com/callback'
        },
        is_active: true
      };
      
      const response = await request(app)
        .post('/api/external-integrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newIntegration);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newIntegration.name);
      expect(response.body.data.provider).toBe(newIntegration.provider);
      expect(response.body.data.type).toBe(newIntegration.type);
      
      testIntegration = response.body.data;
    });
    
    test('GET /api/external-integrations - Should return all integrations', async () => {
      const response = await request(app)
        .get('/api/external-integrations')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
    
    test('GET /api/external-integrations/:id - Should return a specific integration', async () => {
      const response = await request(app)
        .get(`/api/external-integrations/${testIntegration.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testIntegration.id);
      expect(response.body.data.name).toBe(testIntegration.name);
    });
    
    test('PUT /api/external-integrations/:id - Should update an integration', async () => {
      const updatedData = {
        name: 'Updated Google Drive',
        description: 'Updated integration with Google Drive',
        config: {
          client_id: 'updated-client-id',
          client_secret: 'updated-client-secret',
          redirect_uri: 'https://example.com/updated-callback'
        }
      };
      
      const response = await request(app)
        .put(`/api/external-integrations/${testIntegration.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
      expect(response.body.data.description).toBe(updatedData.description);
      expect(response.body.data.config.client_id).toBe(updatedData.config.client_id);
    });
    
    test('GET /api/external-integrations/types - Should return integration types', async () => {
      const response = await request(app)
        .get('/api/external-integrations/types')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data).toContain('storage');
    });
    
    test('GET /api/external-integrations/providers - Should return integration providers', async () => {
      const response = await request(app)
        .get('/api/external-integrations/providers')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some(provider => provider.value === 'google')).toBe(true);
    });
    
    test('POST /api/external-integrations/:id/toggle - Should toggle integration status', async () => {
      const response = await request(app)
        .post(`/api/external-integrations/${testIntegration.id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(!testIntegration.is_active);
    });
    
    test('POST /api/external-integrations/:id/test - Should test integration connection', async () => {
      const response = await request(app)
        .post(`/api/external-integrations/${testIntegration.id}/test`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
    });
    
    test('DELETE /api/external-integrations/:id - Should delete an integration', async () => {
      // Create an integration to delete
      const newIntegration = {
        name: 'Dropbox',
        provider: 'dropbox',
        type: 'storage',
        description: 'Integration with Dropbox',
        is_active: true
      };
      
      const createResponse = await request(app)
        .post('/api/external-integrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newIntegration);
      
      const dropboxIntegration = createResponse.body.data;
      
      // Delete the integration
      const response = await request(app)
        .delete(`/api/external-integrations/${dropboxIntegration.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify integration was deleted
      const verifyResponse = await request(app)
        .get(`/api/external-integrations/${dropboxIntegration.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.statusCode).toBe(404);
    });
  });
});
