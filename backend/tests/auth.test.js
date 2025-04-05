/**
 * Unit tests for authentication controller
 */
const chai = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { expect } = chai;

// Import models and controller
const { User, Tenant } = require('../src/models');
const authController = require('../src/controllers/auth.controller');
const config = require('../src/config/auth.config');

describe('Authentication Controller', () => {
  // Setup stubs and mocks
  let userFindOneStub;
  let tenantFindOneStub;
  let userUpdateStub;
  let userCreateStub;
  let bcryptCompareStub;
  let bcryptHashStub;
  let jwtSignStub;
  let req;
  let res;
  
  beforeEach(() => {
    // Create stubs for database operations
    userFindOneStub = sinon.stub(User, 'findOne');
    tenantFindOneStub = sinon.stub(Tenant, 'findOne');
    userUpdateStub = sinon.stub(User.prototype, 'update').resolves();
    userCreateStub = sinon.stub(User, 'create');
    
    // Create stubs for bcrypt and jwt
    bcryptCompareStub = sinon.stub(bcrypt, 'compareSync');
    bcryptHashStub = sinon.stub(bcrypt, 'hashSync').returns('hashed_password');
    jwtSignStub = sinon.stub(jwt, 'sign').returns('test_token');
    
    // Mock request and response objects
    req = {
      body: {},
      params: {},
      userId: null
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('login', () => {
    it('should return 400 if email, password, or account number is missing', async () => {
      // Arrange
      req.body = { email: 'test@example.com', password: 'password' }; // Missing account number
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('required');
    });
    
    it('should return 404 if tenant is not found', async () => {
      // Arrange
      req.body = { 
        email: 'test@example.com', 
        password: 'password', 
        accountNumber: '123456' 
      };
      tenantFindOneStub.resolves(null);
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('Business not found');
    });
    
    it('should return 404 if user is not found', async () => {
      // Arrange
      req.body = { 
        email: 'test@example.com', 
        password: 'password', 
        accountNumber: '123456' 
      };
      tenantFindOneStub.resolves({ 
        id: 'tenant-id', 
        account_number: '123456',
        status: 'active'
      });
      userFindOneStub.resolves(null);
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('User not found');
    });
    
    it('should return 403 if user account is inactive', async () => {
      // Arrange
      req.body = { 
        email: 'test@example.com', 
        password: 'password', 
        accountNumber: '123456' 
      };
      tenantFindOneStub.resolves({ 
        id: 'tenant-id', 
        account_number: '123456',
        status: 'active'
      });
      userFindOneStub.resolves({ 
        id: 'user-id', 
        email: 'test@example.com',
        status: 'inactive',
        isLocked: () => false
      });
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('inactive');
    });
    
    it('should return 403 if account is locked', async () => {
      // Arrange
      req.body = { 
        email: 'test@example.com', 
        password: 'password', 
        accountNumber: '123456' 
      };
      tenantFindOneStub.resolves({ 
        id: 'tenant-id', 
        account_number: '123456',
        status: 'active'
      });
      userFindOneStub.resolves({ 
        id: 'user-id', 
        email: 'test@example.com',
        status: 'active',
        isLocked: () => true,
        lockout_until: new Date(Date.now() + 3600000)
      });
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('locked');
    });
    
    it('should return 401 if password is invalid', async () => {
      // Arrange
      req.body = { 
        email: 'test@example.com', 
        password: 'wrong_password', 
        accountNumber: '123456' 
      };
      tenantFindOneStub.resolves({ 
        id: 'tenant-id', 
        account_number: '123456',
        status: 'active'
      });
      const userMock = { 
        id: 'user-id', 
        email: 'test@example.com',
        status: 'active',
        isLocked: () => false,
        incrementLoginAttempts: sinon.stub().resolves(),
        login_attempts: 1
      };
      userFindOneStub.resolves(userMock);
      bcryptCompareStub.returns(false);
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('Invalid password');
      expect(userMock.incrementLoginAttempts.calledOnce).to.be.true;
    });
    
    it('should return 200 with user data and tokens if login is successful', async () => {
      // Arrange
      req.body = { 
        email: 'test@example.com', 
        password: 'correct_password', 
        accountNumber: '123456' 
      };
      const tenantMock = { 
        id: 'tenant-id', 
        account_number: '123456',
        name: 'Test Business',
        status: 'active'
      };
      const userMock = { 
        id: 'user-id', 
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        tenant_id: 'tenant-id',
        language: 'ar',
        status: 'active',
        password_hash: 'hashed_password',
        isLocked: () => false,
        resetLoginAttempts: sinon.stub().resolves(),
        update: sinon.stub().resolves()
      };
      tenantFindOneStub.resolves(tenantMock);
      userFindOneStub.resolves(userMock);
      bcryptCompareStub.returns(true);
      
      // Act
      await authController.login(req, res);
      
      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0]).to.have.property('token', 'test_token');
      expect(res.json.args[0][0]).to.have.property('refreshToken', 'test_token');
      expect(userMock.resetLoginAttempts.calledOnce).to.be.true;
      expect(userMock.update.calledOnce).to.be.true;
    });
  });
  
  describe('register', () => {
    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = { email: 'test@example.com' }; // Missing other required fields
      
      // Act
      await authController.register(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('Required fields');
    });
    
    it('should return 404 if tenant is not found', async () => {
      // Arrange
      req.body = { 
        email: 'test@example.com', 
        password: 'Password123!', 
        firstName: 'Test',
        lastName: 'User',
        accountNumber: '123456'
      };
      tenantFindOneStub.resolves(null);
      
      // Act
      await authController.register(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('Business not found');
    });
    
    it('should return 400 if user already exists', async () => {
      // Arrange
      req.body = { 
        email: 'existing@example.com', 
        password: 'Password123!', 
        firstName: 'Test',
        lastName: 'User',
        accountNumber: '123456'
      };
      tenantFindOneStub.resolves({ 
        id: 'tenant-id', 
        account_number: '123456',
        status: 'active'
      });
      userFindOneStub.resolves({ id: 'existing-user-id' });
      
      // Act
      await authController.register(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('already exists');
    });
    
    it('should return 201 with user data if registration is successful', async () => {
      // Arrange
      req.body = { 
        email: 'new@example.com', 
        password: 'Password123!', 
        firstName: 'New',
        lastName: 'User',
        accountNumber: '123456',
        role: 'user'
      };
      tenantFindOneStub.resolves({ 
        id: 'tenant-id', 
        account_number: '123456',
        name: 'Test Business',
        status: 'active'
      });
      userFindOneStub.resolves(null);
      const createdUser = {
        id: 'new-user-id',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'user'
      };
      userCreateStub.resolves(createdUser);
      
      // Act
      await authController.register(req, res);
      
      // Assert
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('registered successfully');
      expect(res.json.args[0][0].user).to.have.property('id', 'new-user-id');
      expect(userCreateStub.calledOnce).to.be.true;
    });
  });
  
  // Additional test cases for other methods can be added here
});
