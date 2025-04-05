/**
 * Unit tests for tenant controller
 */
const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

// Import models and controller
const { Tenant, User, TenantSettings, SubscriptionPlan } = require('../src/models');
const tenantsController = require('../src/controllers/tenants.controller');

describe('Tenants Controller', () => {
  // Setup stubs and mocks
  let tenantFindAllStub;
  let tenantFindOneStub;
  let tenantCreateStub;
  let tenantUpdateStub;
  let tenantDestroyStub;
  let tenantSettingsFindOneStub;
  let tenantSettingsCreateStub;
  let subscriptionPlanFindOneStub;
  let req;
  let res;
  
  beforeEach(() => {
    // Create stubs for database operations
    tenantFindAllStub = sinon.stub(Tenant, 'findAll');
    tenantFindOneStub = sinon.stub(Tenant, 'findOne');
    tenantCreateStub = sinon.stub(Tenant, 'create');
    tenantUpdateStub = sinon.stub(Tenant.prototype, 'update').resolves();
    tenantDestroyStub = sinon.stub(Tenant.prototype, 'destroy').resolves();
    tenantSettingsFindOneStub = sinon.stub(TenantSettings, 'findOne');
    tenantSettingsCreateStub = sinon.stub(TenantSettings, 'create');
    subscriptionPlanFindOneStub = sinon.stub(SubscriptionPlan, 'findOne');
    
    // Mock request and response objects
    req = {
      body: {},
      params: {},
      query: {},
      userId: 'admin-user-id'
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
  
  describe('getAllTenants', () => {
    it('should return all tenants with pagination', async () => {
      // Arrange
      req.query = { page: 1, limit: 10 };
      const tenants = [
        { id: 'tenant-1', name: 'Tenant 1', account_number: '123456' },
        { id: 'tenant-2', name: 'Tenant 2', account_number: '234567' }
      ];
      tenantFindAllStub.resolves(tenants);
      
      // Act
      await tenantsController.getAllTenants(req, res);
      
      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].tenants).to.have.lengthOf(2);
      expect(tenantFindAllStub.calledOnce).to.be.true;
    });
    
    it('should handle errors and return 500', async () => {
      // Arrange
      tenantFindAllStub.rejects(new Error('Database error'));
      
      // Act
      await tenantsController.getAllTenants(req, res);
      
      // Assert
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('Error');
    });
  });
  
  describe('getTenantById', () => {
    it('should return 404 if tenant is not found', async () => {
      // Arrange
      req.params.id = 'non-existent-id';
      tenantFindOneStub.resolves(null);
      
      // Act
      await tenantsController.getTenantById(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('not found');
    });
    
    it('should return tenant data if found', async () => {
      // Arrange
      req.params.id = 'tenant-id';
      const tenant = { 
        id: 'tenant-id', 
        name: 'Test Tenant', 
        account_number: '123456',
        status: 'active'
      };
      tenantFindOneStub.resolves(tenant);
      
      // Act
      await tenantsController.getTenantById(req, res);
      
      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].tenant).to.have.property('id', 'tenant-id');
    });
  });
  
  describe('createTenant', () => {
    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = { name: 'New Tenant' }; // Missing other required fields
      
      // Act
      await tenantsController.createTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('required');
    });
    
    it('should return 400 if account number already exists', async () => {
      // Arrange
      req.body = { 
        name: 'New Tenant', 
        accountNumber: '123456',
        contactEmail: 'contact@example.com',
        contactPhone: '1234567890',
        subscriptionPlanId: 'plan-id'
      };
      tenantFindOneStub.resolves({ id: 'existing-tenant-id' });
      
      // Act
      await tenantsController.createTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('already exists');
    });
    
    it('should return 404 if subscription plan is not found', async () => {
      // Arrange
      req.body = { 
        name: 'New Tenant', 
        accountNumber: '123456',
        contactEmail: 'contact@example.com',
        contactPhone: '1234567890',
        subscriptionPlanId: 'non-existent-plan-id'
      };
      tenantFindOneStub.resolves(null);
      subscriptionPlanFindOneStub.resolves(null);
      
      // Act
      await tenantsController.createTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('Subscription plan not found');
    });
    
    it('should return 201 with tenant data if creation is successful', async () => {
      // Arrange
      req.body = { 
        name: 'New Tenant', 
        accountNumber: '123456',
        contactEmail: 'contact@example.com',
        contactPhone: '1234567890',
        subscriptionPlanId: 'plan-id'
      };
      tenantFindOneStub.resolves(null);
      subscriptionPlanFindOneStub.resolves({ 
        id: 'plan-id', 
        name: 'Basic Plan',
        features: ['feature1', 'feature2']
      });
      const createdTenant = {
        id: 'new-tenant-id',
        name: 'New Tenant',
        account_number: '123456',
        contact_email: 'contact@example.com',
        contact_phone: '1234567890',
        subscription_plan_id: 'plan-id',
        status: 'active'
      };
      tenantCreateStub.resolves(createdTenant);
      tenantSettingsCreateStub.resolves({ id: 'settings-id', tenant_id: 'new-tenant-id' });
      
      // Act
      await tenantsController.createTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].tenant).to.have.property('id', 'new-tenant-id');
      expect(tenantCreateStub.calledOnce).to.be.true;
      expect(tenantSettingsCreateStub.calledOnce).to.be.true;
    });
  });
  
  describe('updateTenant', () => {
    it('should return 404 if tenant is not found', async () => {
      // Arrange
      req.params.id = 'non-existent-id';
      req.body = { name: 'Updated Name' };
      tenantFindOneStub.resolves(null);
      
      // Act
      await tenantsController.updateTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('not found');
    });
    
    it('should return 200 with updated tenant data if update is successful', async () => {
      // Arrange
      req.params.id = 'tenant-id';
      req.body = { 
        name: 'Updated Name',
        status: 'inactive'
      };
      const tenant = { 
        id: 'tenant-id', 
        name: 'Old Name', 
        status: 'active',
        update: sinon.stub().resolves()
      };
      tenantFindOneStub.resolves(tenant);
      
      // Act
      await tenantsController.updateTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('updated successfully');
      expect(tenant.update.calledOnce).to.be.true;
    });
  });
  
  describe('deleteTenant', () => {
    it('should return 404 if tenant is not found', async () => {
      // Arrange
      req.params.id = 'non-existent-id';
      tenantFindOneStub.resolves(null);
      
      // Act
      await tenantsController.deleteTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('not found');
    });
    
    it('should return 200 if deletion is successful', async () => {
      // Arrange
      req.params.id = 'tenant-id';
      const tenant = { 
        id: 'tenant-id', 
        name: 'Test Tenant',
        destroy: sinon.stub().resolves()
      };
      tenantFindOneStub.resolves(tenant);
      
      // Act
      await tenantsController.deleteTenant(req, res);
      
      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0].message).to.include('deleted successfully');
      expect(tenant.destroy.calledOnce).to.be.true;
    });
  });
  
  // Additional test cases for other methods can be added here
});
