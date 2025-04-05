const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user.model');
const Language = require('../src/models/language.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/auth.config');

describe('Language Management API Tests', () => {
  let adminToken;
  let adminUser;
  let testLanguage;
  
  beforeAll(async () => {
    // Create admin user
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
    
    // Clear language test data
    await Language.destroy({ where: {} });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Language API', () => {
    test('POST /api/languages - Should create a new language', async () => {
      const newLanguage = {
        code: 'ar',
        name: 'Arabic',
        native_name: 'العربية',
        flag_icon: 'sa',
        text_direction: 'rtl',
        is_active: true,
        is_default: true
      };
      
      const response = await request(app)
        .post('/api/languages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newLanguage);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe(newLanguage.code);
      expect(response.body.data.name).toBe(newLanguage.name);
      expect(response.body.data.native_name).toBe(newLanguage.native_name);
      expect(response.body.data.text_direction).toBe(newLanguage.text_direction);
      
      testLanguage = response.body.data;
    });
    
    test('GET /api/languages - Should return all languages', async () => {
      const response = await request(app)
        .get('/api/languages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
    
    test('GET /api/languages/:id - Should return a specific language', async () => {
      const response = await request(app)
        .get(`/api/languages/${testLanguage.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLanguage.id);
      expect(response.body.data.code).toBe(testLanguage.code);
    });
    
    test('PUT /api/languages/:id - Should update a language', async () => {
      const updatedData = {
        name: 'Arabic Updated',
        native_name: 'العربية المحدثة',
        is_active: false
      };
      
      const response = await request(app)
        .put(`/api/languages/${testLanguage.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
      expect(response.body.data.native_name).toBe(updatedData.native_name);
      expect(response.body.data.is_active).toBe(updatedData.is_active);
    });
    
    test('POST /api/languages/common/import - Should import a common language', async () => {
      const response = await request(app)
        .post('/api/languages/common/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'en' });
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('en');
      expect(response.body.data.name).toBe('English');
    });
    
    test('GET /api/languages/common/languages - Should return common languages', async () => {
      const response = await request(app)
        .get('/api/languages/common/languages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some(lang => lang.code === 'en')).toBe(true);
    });
    
    test('POST /api/languages/:id/set-default - Should set a language as default', async () => {
      // First create a non-default language
      const newLanguage = {
        code: 'fr',
        name: 'French',
        native_name: 'Français',
        flag_icon: 'fr',
        text_direction: 'ltr',
        is_active: true,
        is_default: false
      };
      
      const createResponse = await request(app)
        .post('/api/languages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newLanguage);
      
      const frenchLanguage = createResponse.body.data;
      
      // Now set it as default
      const response = await request(app)
        .post(`/api/languages/${frenchLanguage.id}/set-default`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_default).toBe(true);
      
      // Verify previous default is no longer default
      const verifyResponse = await request(app)
        .get(`/api/languages/${testLanguage.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.body.data.is_default).toBe(false);
    });
    
    test('POST /api/languages/sort-order - Should update language sort order', async () => {
      // Get all languages
      const getResponse = await request(app)
        .get('/api/languages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const languages = getResponse.body.data;
      
      // Update sort order
      const sortedLanguages = languages.map((lang, index) => ({
        id: lang.id,
        sort_order: languages.length - index // Reverse the order
      }));
      
      const response = await request(app)
        .post('/api/languages/sort-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ languages: sortedLanguages });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify sort order was updated
      const verifyResponse = await request(app)
        .get('/api/languages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const updatedLanguages = verifyResponse.body.data;
      
      // Check if the first language has the highest sort_order
      expect(updatedLanguages[0].sort_order).toBe(languages.length);
    });
    
    test('DELETE /api/languages/:id - Should delete a language', async () => {
      // Create a language to delete
      const newLanguage = {
        code: 'de',
        name: 'German',
        native_name: 'Deutsch',
        flag_icon: 'de',
        text_direction: 'ltr',
        is_active: true,
        is_default: false
      };
      
      const createResponse = await request(app)
        .post('/api/languages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newLanguage);
      
      const germanLanguage = createResponse.body.data;
      
      // Delete the language
      const response = await request(app)
        .delete(`/api/languages/${germanLanguage.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify language was deleted
      const verifyResponse = await request(app)
        .get(`/api/languages/${germanLanguage.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.statusCode).toBe(404);
    });
  });
});
