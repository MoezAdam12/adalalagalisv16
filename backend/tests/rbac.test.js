const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user.model');
const Role = require('../src/models/role.model');
const Permission = require('../src/models/permission.model');
const RolePermission = require('../src/models/role-permission.model');
const UserRole = require('../src/models/user-role.model');
const jwt = require('jsonwebtoken');
const config = require('../src/config/auth.config');

describe('RBAC API Tests', () => {
  let adminToken;
  let regularUserToken;
  let adminUser;
  let regularUser;
  let adminRole;
  let userRole;
  let testPermission;
  
  beforeAll(async () => {
    // Clear test data
    await sequelize.sync({ force: true });
    
    // Create test roles
    adminRole = await Role.create({
      name: 'Admin',
      description: 'Administrator role with all permissions',
      is_system: true
    });
    
    userRole = await Role.create({
      name: 'User',
      description: 'Regular user role with limited permissions',
      is_system: true
    });
    
    // Create test permissions
    testPermission = await Permission.create({
      name: 'users:read',
      description: 'Can read users',
      category: 'users'
    });
    
    await Permission.create({
      name: 'users:create',
      description: 'Can create users',
      category: 'users'
    });
    
    await Permission.create({
      name: 'users:update',
      description: 'Can update users',
      category: 'users'
    });
    
    await Permission.create({
      name: 'users:delete',
      description: 'Can delete users',
      category: 'users'
    });
    
    // Assign permissions to roles
    await RolePermission.create({
      role_id: adminRole.id,
      permission_id: testPermission.id
    });
    
    // Create test users
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // 'password'
      first_name: 'Admin',
      last_name: 'User',
      is_active: true
    });
    
    regularUser = await User.create({
      username: 'user',
      email: 'user@test.com',
      password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // 'password'
      first_name: 'Regular',
      last_name: 'User',
      is_active: true
    });
    
    // Assign roles to users
    await UserRole.create({
      user_id: adminUser.id,
      role_id: adminRole.id
    });
    
    await UserRole.create({
      user_id: regularUser.id,
      role_id: userRole.id
    });
    
    // Generate tokens
    adminToken = jwt.sign({ id: adminUser.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    });
    
    regularUserToken = jwt.sign({ id: regularUser.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Roles API', () => {
    test('GET /api/rbac/roles - Should return all roles for admin', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
    
    test('GET /api/rbac/roles - Should deny access for regular user', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });
    
    test('POST /api/rbac/roles - Should create a new role', async () => {
      const newRole = {
        name: 'Editor',
        description: 'Can edit content',
        is_system: false
      };
      
      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRole);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newRole.name);
    });
  });
  
  describe('Permissions API', () => {
    test('GET /api/rbac/permissions - Should return all permissions for admin', async () => {
      const response = await request(app)
        .get('/api/rbac/permissions')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });
    
    test('GET /api/rbac/permissions/categories - Should return permission categories', async () => {
      const response = await request(app)
        .get('/api/rbac/permissions/categories')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('users');
    });
  });
  
  describe('Role Permissions API', () => {
    test('GET /api/rbac/roles/:id/permissions - Should return role permissions', async () => {
      const response = await request(app)
        .get(`/api/rbac/roles/${adminRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
    
    test('POST /api/rbac/roles/:id/permissions - Should assign permissions to role', async () => {
      const permissions = [testPermission.id];
      
      const response = await request(app)
        .post(`/api/rbac/roles/${userRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify permissions were assigned
      const verifyResponse = await request(app)
        .get(`/api/rbac/roles/${userRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.body.data.some(p => p.id === testPermission.id)).toBe(true);
    });
  });
  
  describe('User Roles API', () => {
    test('GET /api/rbac/users/:id/roles - Should return user roles', async () => {
      const response = await request(app)
        .get(`/api/rbac/users/${adminUser.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.some(r => r.id === adminRole.id)).toBe(true);
    });
    
    test('POST /api/rbac/users/:id/roles - Should assign roles to user', async () => {
      const roles = [userRole.id];
      
      const response = await request(app)
        .post(`/api/rbac/users/${adminUser.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify roles were assigned
      const verifyResponse = await request(app)
        .get(`/api/rbac/users/${adminUser.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyResponse.body.data.some(r => r.id === userRole.id)).toBe(true);
    });
  });
});
