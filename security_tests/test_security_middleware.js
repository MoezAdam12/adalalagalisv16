const express = require('express');
const request = require('supertest');
const {
  securityHeaders,
  apiLimiter,
  mongoSanitization,
  xssProtection,
  parameterPollutionProtection,
  requestId
} = require('../backend/src/middleware/security');

// Create a test app
const app = express();

// Apply security middleware
app.use(securityHeaders);
app.use(mongoSanitization);
app.use(xssProtection);
app.use(parameterPollutionProtection);
app.use(requestId);

// Test route
app.get('/test', (req, res) => {
  res.json({ success: true, requestId: req.id });
});

// Test XSS protection
app.post('/test-xss', express.json(), (req, res) => {
  res.json({ input: req.body.input });
});

// Test MongoDB sanitization
app.post('/test-mongo', express.json(), (req, res) => {
  res.json({ query: req.body.query });
});

// Test security headers
async function testSecurityHeaders() {
  console.log('Testing security headers...');
  
  const response = await request(app).get('/test');
  
  console.log('Response headers:', response.headers);
  
  // Check for security headers
  const hasXssProtection = response.headers['x-xss-protection'] === '1; mode=block';
  const hasNoSniff = response.headers['x-content-type-options'] === 'nosniff';
  const hasRequestId = response.headers['x-request-id'] !== undefined;
  
  if (hasXssProtection && hasNoSniff && hasRequestId) {
    console.log('✅ Security headers test passed');
    return true;
  } else {
    console.error('❌ Security headers test failed');
    return false;
  }
}

// Test XSS protection
async function testXssProtection() {
  console.log('\nTesting XSS protection...');
  
  const xssPayload = '<script>alert("XSS")</script>';
  
  const response = await request(app)
    .post('/test-xss')
    .send({ input: xssPayload })
    .set('Content-Type', 'application/json');
  
  console.log('Response with XSS payload:', response.body);
  
  // Check if script tags were sanitized
  // Note: This is a simplified test, actual behavior depends on xss-clean implementation
  if (!response.body.input.includes('<script>')) {
    console.log('✅ XSS protection test passed');
    return true;
  } else {
    console.error('❌ XSS protection test failed');
    return false;
  }
}

// Test MongoDB sanitization
async function testMongoSanitization() {
  console.log('\nTesting MongoDB sanitization...');
  
  const mongoPayload = { '$gt': '' };
  
  const response = await request(app)
    .post('/test-mongo')
    .send({ query: mongoPayload })
    .set('Content-Type', 'application/json');
  
  console.log('Response with MongoDB operator:', response.body);
  
  // Check if MongoDB operators were sanitized
  // Note: This is a simplified test, actual behavior depends on express-mongo-sanitize implementation
  if (JSON.stringify(response.body.query).indexOf('$') === -1) {
    console.log('✅ MongoDB sanitization test passed');
    return true;
  } else {
    console.error('❌ MongoDB sanitization test failed');
    return false;
  }
}

// Test request ID middleware
async function testRequestId() {
  console.log('\nTesting request ID middleware...');
  
  const response = await request(app).get('/test');
  
  console.log('Request ID:', response.body.requestId);
  
  if (response.body.requestId && response.headers['x-request-id']) {
    console.log('✅ Request ID test passed');
    return true;
  } else {
    console.error('❌ Request ID test failed');
    return false;
  }
}

// Run all tests
async function runTests() {
  let allPassed = true;
  
  allPassed = await testSecurityHeaders() && allPassed;
  allPassed = await testXssProtection() && allPassed;
  allPassed = await testMongoSanitization() && allPassed;
  allPassed = await testRequestId() && allPassed;
  
  if (allPassed) {
    console.log('\n✅ All security middleware tests passed');
  } else {
    console.error('\n❌ Some security middleware tests failed');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
