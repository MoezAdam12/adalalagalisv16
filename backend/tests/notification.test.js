const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user.model');
const Notification = require('../src/models/notification.model');
const NotificationTemplate = require('../src/models/notification-template.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/auth.config');

describe('Notification System API Tests', () => {
  let adminToken;
  let adminUser;
  let regularUserToken;
  let regularUser;
  let testTemplate;
  let testNotification;
  
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
    
    // Create regular user if not exists
    regularUser = await User.findOne({ where: { email: 'user@test.com' } });
    
    if (!regularUser) {
      regularUser = await User.create({
        username: 'user',
        email: 'user@test.com',
        password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // 'password'
        first_name: 'Regular',
        last_name: 'User',
        is_active: true
      });
    }
    
    // Generate tokens
    adminToken = jwt.sign({ id: adminUser.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    });
    
    regularUserToken = jwt.sign({ id: regularUser.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    });
    
    // Clear notification test data
    await NotificationTemplate.destroy({ where: {} });
    await Notification.destroy({ where: {} });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Notification Templates API', () => {
    test('POST /api/notifications/templates - Should create a new notification template', async () => {
      const newTemplate = {
        name: 'Welcome Email',
        code: 'welcome_email',
        description: 'Template for welcome emails',
        category: 'user',
        subject: 'Welcome to our platform',
        body_html: '<p>Hello {{name}},</p><p>Welcome to our platform!</p>',
        body_text: 'Hello {{name}}, Welcome to our platform!',
        variables: ['name'],
        is_active: true
      };
      
      const response = await request(app)
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTemplate);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newTemplate.name);
      expect(response.body.data.code).toBe(newTemplate.code);
      
      testTemplate = response.body.data;
    });
    
    test('GET /api/notifications/templates - Should return all notification templates', async () => {
      const response = await request(app)
        .get('/api/notifications/templates')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
    
    test('GET /api/notifications/templates/:id - Should return a specific template', async () => {
      const response = await request(app)
        .get(`/api/notifications/templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTemplate.id);
      expect(response.body.data.name).toBe(testTemplate.name);
    });
    
    test('PUT /api/notifications/templates/:id - Should update a template', async () => {
      const updatedData = {
        name: 'Updated Welcome Email',
        subject: 'Welcome to our amazing platform',
        body_html: '<p>Hello {{name}},</p><p>Welcome to our amazing platform!</p>'
      };
      
      const response = await request(app)
        .put(`/api/notifications/templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
      expect(response.body.data.subject).toBe(updatedData.subject);
    });
    
    test('POST /api/notifications/templates/:id/preview - Should preview a template', async () => {
      const previewData = {
        variables: {
          name: 'John Doe'
        }
      };
      
      const response = await request(app)
        .post(`/api/notifications/templates/${testTemplate.id}/preview`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(previewData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subject).toContain('Welcome');
      expect(response.body.data.body_html).toContain('John Doe');
      expect(response.body.data.body_text).toContain('John Doe');
    });
  });
  
  describe('Notifications API', () => {
    test('POST /api/notifications - Should create a new notification', async () => {
      const newNotification = {
        user_id: regularUser.id,
        title: 'New Feature',
        message: 'We have added a new feature to the platform',
        type: 'system',
        is_read: false,
        data: { feature_id: '123' }
      };
      
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newNotification);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newNotification.title);
      expect(response.body.data.message).toBe(newNotification.message);
      expect(response.body.data.user_id).toBe(newNotification.user_id);
      
      testNotification = response.body.data;
    });
    
    test('GET /api/notifications/user - Should return user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications/user')
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.some(n => n.id === testNotification.id)).toBe(true);
    });
    
    test('PUT /api/notifications/:id/read - Should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
    });
    
    test('PUT /api/notifications/read-all - Should mark all notifications as read', async () => {
      // Create another unread notification
      const newNotification = {
        user_id: regularUser.id,
        title: 'Another Notification',
        message: 'This is another notification',
        type: 'system',
        is_read: false
      };
      
      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newNotification);
      
      // Mark all as read
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify all are read
      const verifyResponse = await request(app)
        .get('/api/notifications/user')
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(verifyResponse.body.data.every(n => n.is_read)).toBe(true);
    });
    
    test('GET /api/notifications/count - Should return unread notification count', async () => {
      // Create an unread notification
      const newNotification = {
        user_id: regularUser.id,
        title: 'Unread Notification',
        message: 'This is an unread notification',
        type: 'system',
        is_read: false
      };
      
      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newNotification);
      
      const response = await request(app)
        .get('/api/notifications/count')
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unread_count).toBe(1);
    });
    
    test('DELETE /api/notifications/:id - Should delete a notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify notification was deleted
      const verifyResponse = await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(verifyResponse.statusCode).toBe(404);
    });
  });
  
  describe('Email Sending API', () => {
    test('POST /api/notifications/send-email - Should send an email', async () => {
      const emailData = {
        template_code: testTemplate.code,
        to: 'test@example.com',
        variables: {
          name: 'Test User'
        }
      };
      
      const response = await request(app)
        .post('/api/notifications/send-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(emailData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
