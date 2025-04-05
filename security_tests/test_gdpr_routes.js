const express = require('express');
const request = require('supertest');
const gdprRoutes = require('../backend/src/routes/gdpr.routes');

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    _id: '12345',
    username: 'testuser',
    role: 'admin',
    tenantId: 'tenant123'
  };
  next();
};

// Create a test app
const app = express();
app.use(express.json());

// Mock middleware
app.use((req, res, next) => {
  req.id = 'test-request-id';
  next();
});

// Apply routes with mock authentication
app.use('/api/gdpr', mockAuth, (req, res, next) => {
  // Mock CSRF protection
  req.headers['x-csrf-token'] = 'valid-token';
  req.session = { csrfToken: 'valid-token' };
  next();
}, gdprRoutes);

// Test data access request
async function testDataAccessRequest() {
  console.log('Testing data access request...');
  
  const response = await request(app).get('/api/gdpr/data-access');
  
  console.log('Response:', response.body);
  
  if (response.status === 200 && response.body.requestId) {
    console.log('✅ Data access request test passed');
    return true;
  } else {
    console.error('❌ Data access request test failed');
    return false;
  }
}

// Test data deletion request
async function testDataDeletionRequest() {
  console.log('\nTesting data deletion request...');
  
  const response = await request(app).post('/api/gdpr/data-deletion');
  
  console.log('Response:', response.body);
  
  if (response.status === 200 && response.body.requestId) {
    console.log('✅ Data deletion request test passed');
    return true;
  } else {
    console.error('❌ Data deletion request test failed');
    return false;
  }
}

// Test consent update
async function testConsentUpdate() {
  console.log('\nTesting consent update...');
  
  const response = await request(app)
    .put('/api/gdpr/consent')
    .send({
      marketingConsent: true,
      dataProcessingConsent: true,
      thirdPartyConsent: false
    });
  
  console.log('Response:', response.body);
  
  if (response.status === 200 && response.body.consentUpdated) {
    console.log('✅ Consent update test passed');
    return true;
  } else {
    console.error('❌ Consent update test failed');
    return false;
  }
}

// Test data retention policies
async function testDataRetentionPolicies() {
  console.log('\nTesting data retention policies...');
  
  const response = await request(app).get('/api/gdpr/data-retention-policies');
  
  console.log('Response:', response.body);
  
  if (response.status === 200 && response.body.policies && response.body.policies.length > 0) {
    console.log('✅ Data retention policies test passed');
    return true;
  } else {
    console.error('❌ Data retention policies test failed');
    return false;
  }
}

// Run all tests
async function runTests() {
  let allPassed = true;
  
  allPassed = await testDataAccessRequest() && allPassed;
  allPassed = await testDataDeletionRequest() && allPassed;
  allPassed = await testConsentUpdate() && allPassed;
  allPassed = await testDataRetentionPolicies() && allPassed;
  
  if (allPassed) {
    console.log('\n✅ All GDPR compliance tests passed');
  } else {
    console.error('\n❌ Some GDPR compliance tests failed');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
