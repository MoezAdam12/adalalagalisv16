const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user.model');
const UiTheme = require('../src/models/ui-theme.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/auth.config');

describe('UI Theme Settings API Tests', () => {
  let adminToken;
  let adminUser;
  let testTheme;
  
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
    
    // Clear UI theme test data
    await UiTheme.destroy({ where: {} });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('UI Theme API', () => {
    test('POST /api/ui-themes - Should create a new UI theme', async () => {
      const newTheme = {
        name: 'Corporate Blue',
        description: 'Official corporate theme with blue color scheme',
        tenant_id: null, // Global theme
        primary_color: '#1976d2',
        secondary_color: '#424242',
        accent_color: '#82b1ff',
        background_color: '#ffffff',
        text_color: '#212121',
        logo_url: 'https://example.com/logo.png',
        favicon_url: 'https://example.com/favicon.ico',
        font_family: 'Roboto, sans-serif',
        custom_css: '.custom-header { background-color: #1976d2; }',
        is_active: true,
        is_default: true
      };
      
      const response = await request(app)
        .post('/api/ui-themes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTheme);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newTheme.name);
      expect(response.body.data.primary_color).toBe(newTheme.primary_color);
      expect(response.body.data.is_default).toBe(newTheme.is_default);
      
      testTheme = response.body.data;
    });
    
    test('GET /api/ui-themes - Should return all UI themes', async () => {
      const response = await request(app)
        .get('/api/ui-themes')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
    
    test('GET /api/ui-themes/:id - Should return a specific UI theme', async () => {
      const response = await request(app)
        .get(`/api/ui-themes/${testTheme.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTheme.id);
      expect(response.body.data.name).toBe(testTheme.name);
    });
    
    test('PUT /api/ui-themes/:id - Should update a UI theme', async () => {
      const updatedData = {
        name: 'Updated Corporate Blue',
        primary_color: '#2196f3',
        custom_css: '.custom-header { background-color: #2196f3; }'
      };
      
      const response = await request(app)
        .put(`/api/ui-themes/${testTheme.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
      expect(response.body.data.primary_color).toBe(updatedData.primary_color);
      expect(response.body.data.custom_css).toBe(updatedData.custom_css);
    });
    
    test('POST /api/ui-themes/:id/set-default - Should set a UI theme as default', async () => {
      // First create a non-default theme
      const newTheme = {
        name: 'Dark Theme',
        description: 'Dark mode theme',
        tenant_id: null,
        primary_color: '#303030',
        secondary_color: '#424242',
        accent_color: '#bb86fc',
        background_color: '#121212',
        text_color: '#ffffff',
        is_active: true,
        is_default: false
      };
      
      const createResponse = await request(app)
        .post('/api/ui-themes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTheme);
      
      const darkTheme = createResponse.body.data;
      
      // Now set it as default
      const response = await request(app)
        .post(`/api/ui-themes/${darkTheme.id}/set-default`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_default).toBe(true);
      
      // Verify previous default is no longer default
      const verifyResponse = await request(app)
        .get(`/api/ui-themes/${testTheme.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.body.data.is_default).toBe(false);
    });
    
    test('GET /api/ui-themes/default - Should return the default UI theme', async () => {
      const response = await request(app)
        .get('/api/ui-themes/default')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_default).toBe(true);
    });
    
    test('POST /api/ui-themes/:id/preview - Should generate a preview of the UI theme', async () => {
      const response = await request(app)
        .post(`/api/ui-themes/${testTheme.id}/preview`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('css');
      expect(response.body.data.css).toContain(testTheme.primary_color.substring(1)); // Without #
    });
    
    test('DELETE /api/ui-themes/:id - Should delete a UI theme', async () => {
      // Create a theme to delete
      const newTheme = {
        name: 'Temporary Theme',
        description: 'Theme to be deleted',
        tenant_id: null,
        primary_color: '#ff5722',
        is_active: true,
        is_default: false
      };
      
      const createResponse = await request(app)
        .post('/api/ui-themes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTheme);
      
      const tempTheme = createResponse.body.data;
      
      // Delete the theme
      const response = await request(app)
        .delete(`/api/ui-themes/${tempTheme.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify theme was deleted
      const verifyResponse = await request(app)
        .get(`/api/ui-themes/${tempTheme.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.statusCode).toBe(404);
    });
  });
});
