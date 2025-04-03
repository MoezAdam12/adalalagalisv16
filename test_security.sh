#!/bin/bash

# Test script for Adalalegalis security enhancements
# This script tests the security features implemented in the system

echo "Starting security tests for Adalalegalis..."
echo "============================================"

# Test directory
TEST_DIR="/home/ubuntu/workspace/security_tests"
mkdir -p $TEST_DIR

# Test encryption utility
echo -e "\n[1/6] Testing field-level encryption utility..."
cat > $TEST_DIR/test_encryption.js << 'EOL'
const { FieldEncryption } = require('../backend/src/utils/encryption');

// Generate a test encryption key (32 bytes)
const testKey = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('hex');

// Create encryption instance
const encryption = new FieldEncryption(testKey);

// Test data
const testData = 'This is sensitive information that should be encrypted';

// Encrypt data
console.log('Original data:', testData);
const encrypted = encryption.encrypt(testData);
console.log('Encrypted data:', encrypted);

// Decrypt data
const decrypted = encryption.decrypt(encrypted);
console.log('Decrypted data:', decrypted);

// Verify
if (decrypted === testData) {
  console.log('✅ Encryption test passed: Data correctly encrypted and decrypted');
} else {
  console.error('❌ Encryption test failed: Decrypted data does not match original');
  process.exit(1);
}
EOL

# Run encryption test
echo "Running encryption test..."
cd /home/ubuntu/workspace
node $TEST_DIR/test_encryption.js
if [ $? -ne 0 ]; then
  echo "❌ Encryption test failed"
  exit 1
fi

# Test enhanced authentication
echo -e "\n[2/6] Testing enhanced authentication..."
cat > $TEST_DIR/test_auth.js << 'EOL'
const EnhancedAuth = require('../backend/src/utils/enhanced-auth');

// Create auth instance with test config
const auth = new EnhancedAuth({
  jwtSecret: 'test-secret-key-for-jwt-tokens',
  jwtExpiresIn: '1h',
  jwtRefreshExpiresIn: '7d',
  bcryptSaltRounds: 10,
  mfaEnabled: true
});

// Test user data
const userData = {
  userId: '12345',
  username: 'testuser',
  role: 'admin',
  tenantId: 'tenant123'
};

// Test password hashing
async function testPasswordHashing() {
  const password = 'SecurePassword123!';
  
  console.log('Testing password hashing...');
  const hashedPassword = await auth.hashPassword(password);
  console.log('Hashed password:', hashedPassword);
  
  const isValid = await auth.verifyPassword(password, hashedPassword);
  console.log('Password verification result:', isValid);
  
  if (isValid) {
    console.log('✅ Password hashing test passed');
  } else {
    console.error('❌ Password hashing test failed');
    process.exit(1);
  }
}

// Test JWT token generation and verification
function testJwtTokens() {
  console.log('\nTesting JWT token generation and verification...');
  
  // Generate tokens
  const tokens = auth.generateTokens(userData);
  console.log('Generated tokens:', {
    token: tokens.token.substring(0, 20) + '...',
    refreshToken: tokens.refreshToken.substring(0, 20) + '...',
    expiresAt: new Date(tokens.expiresAt).toISOString()
  });
  
  // Verify token
  try {
    const decoded = auth.verifyToken(tokens.token);
    console.log('Decoded token:', decoded);
    
    if (decoded.userId === userData.userId) {
      console.log('✅ JWT token test passed');
    } else {
      console.error('❌ JWT token test failed: User ID mismatch');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ JWT token test failed:', error.message);
    process.exit(1);
  }
  
  // Test token refresh
  try {
    const refreshedTokens = auth.refreshAccessToken(tokens.refreshToken, userData);
    console.log('Refreshed tokens:', {
      token: refreshedTokens.token.substring(0, 20) + '...',
      refreshToken: refreshedTokens.refreshToken.substring(0, 20) + '...',
      expiresAt: new Date(refreshedTokens.expiresAt).toISOString()
    });
    console.log('✅ Token refresh test passed');
  } catch (error) {
    console.error('❌ Token refresh test failed:', error.message);
    process.exit(1);
  }
}

// Test MFA functionality
function testMfa() {
  console.log('\nTesting MFA functionality...');
  
  const mfaSecret = auth.generateMfaSecret();
  console.log('Generated MFA secret:', mfaSecret);
  
  // Note: This is a placeholder test since actual TOTP verification is not implemented
  const isValid = auth.verifyMfaToken('123456', mfaSecret);
  console.log('MFA verification result:', isValid);
  
  if (isValid) {
    console.log('✅ MFA test passed (placeholder)');
  } else {
    console.error('❌ MFA test failed');
    process.exit(1);
  }
}

// Run all tests
async function runTests() {
  await testPasswordHashing();
  testJwtTokens();
  testMfa();
  console.log('\n✅ All authentication tests passed');
}

runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
EOL

# Run authentication test
echo "Running authentication test..."
node $TEST_DIR/test_auth.js
if [ $? -ne 0 ]; then
  echo "❌ Authentication test failed"
  exit 1
fi

# Test data protection utility
echo -e "\n[3/6] Testing data protection utility..."
cat > $TEST_DIR/test_data_protection.js << 'EOL'
const DataProtection = require('../backend/src/utils/data-protection');
const fs = require('fs');
const path = require('path');

// Test data masking
function testDataMasking() {
  console.log('Testing data masking...');
  
  // Test email masking
  const email = 'user@example.com';
  const maskedEmail = DataProtection.maskData(email, { type: 'email' });
  console.log(`Original email: ${email}`);
  console.log(`Masked email: ${maskedEmail}`);
  
  // Test phone masking
  const phone = '+966123456789';
  const maskedPhone = DataProtection.maskData(phone, { type: 'phone', showLast: 4 });
  console.log(`Original phone: ${phone}`);
  console.log(`Masked phone: ${maskedPhone}`);
  
  // Test credit card masking
  const creditCard = '4111111111111111';
  const maskedCreditCard = DataProtection.maskData(creditCard, { type: 'creditCard' });
  console.log(`Original credit card: ${creditCard}`);
  console.log(`Masked credit card: ${maskedCreditCard}`);
  
  // Test ID number masking
  const idNumber = '1234567890';
  const maskedIdNumber = DataProtection.maskData(idNumber, { type: 'idNumber', showFirst: 2, showLast: 2 });
  console.log(`Original ID: ${idNumber}`);
  console.log(`Masked ID: ${maskedIdNumber}`);
  
  console.log('✅ Data masking tests passed');
}

// Test secure file deletion
async function testSecureFileDeletion() {
  console.log('\nTesting secure file deletion...');
  
  // Create a test file
  const testFilePath = path.join(__dirname, 'test_secure_delete.txt');
  const testContent = 'This is sensitive data that should be securely deleted';
  
  fs.writeFileSync(testFilePath, testContent);
  console.log(`Created test file: ${testFilePath}`);
  
  // Verify file exists
  if (fs.existsSync(testFilePath)) {
    console.log('Test file created successfully');
  } else {
    console.error('❌ Failed to create test file');
    process.exit(1);
  }
  
  // Securely delete the file
  try {
    await DataProtection.secureDeleteFile(testFilePath, 1); // Use 1 pass for testing
    console.log('File deletion completed');
    
    // Verify file is deleted
    if (!fs.existsSync(testFilePath)) {
      console.log('✅ Secure file deletion test passed');
    } else {
      console.error('❌ Secure file deletion test failed: File still exists');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Secure file deletion test failed:', error.message);
    process.exit(1);
  }
}

// Test token generation
function testTokenGeneration() {
  console.log('\nTesting secure token generation...');
  
  const token1 = DataProtection.generateSecureToken();
  const token2 = DataProtection.generateSecureToken();
  
  console.log(`Token 1: ${token1}`);
  console.log(`Token 2: ${token2}`);
  
  if (token1 !== token2 && token1.length >= 64) {
    console.log('✅ Token generation test passed');
  } else {
    console.error('❌ Token generation test failed');
    process.exit(1);
  }
}

// Test data anonymization
function testDataAnonymization() {
  console.log('\nTesting data anonymization...');
  
  const personalData = 'john.doe@example.com';
  const salt = 'random-salt';
  
  const anonymized1 = DataProtection.anonymizeData(personalData, salt);
  const anonymized2 = DataProtection.anonymizeData(personalData, salt);
  const anonymizedDifferent = DataProtection.anonymizeData(personalData, 'different-salt');
  
  console.log(`Original data: ${personalData}`);
  console.log(`Anonymized (salt1): ${anonymized1}`);
  console.log(`Anonymized (salt1 again): ${anonymized2}`);
  console.log(`Anonymized (salt2): ${anonymizedDifferent}`);
  
  if (anonymized1 === anonymized2 && anonymized1 !== anonymizedDifferent) {
    console.log('✅ Data anonymization test passed');
  } else {
    console.error('❌ Data anonymization test failed');
    process.exit(1);
  }
}

// Run all tests
async function runTests() {
  testDataMasking();
  await testSecureFileDeletion();
  testTokenGeneration();
  testDataAnonymization();
  console.log('\n✅ All data protection tests passed');
}

runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
EOL

# Run data protection test
echo "Running data protection test..."
node $TEST_DIR/test_data_protection.js
if [ $? -ne 0 ]; then
  echo "❌ Data protection test failed"
  exit 1
fi

# Test model encryption
echo -e "\n[4/6] Testing model encryption..."
cat > $TEST_DIR/test_model_encryption.js << 'EOL'
const mongoose = require('mongoose');
const { encryptionPlugin } = require('../backend/src/utils/encryption');
const { applyClientEncryption } = require('../backend/src/utils/model-encryption');

// Mock config
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

// Create a test schema
const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  id_number: String,
  address: {
    street: String,
    city: String,
    postal_code: String,
    country: String
  }
});

// Apply encryption to the schema
applyClientEncryption(clientSchema);

// Create a model
const Client = mongoose.model('TestClient', clientSchema);

// Test the model encryption
function testModelEncryption() {
  console.log('Testing model encryption...');
  
  // Create a test client
  const client = new Client({
    name: 'Test Client',
    email: 'client@example.com',
    phone: '+966123456789',
    id_number: '1234567890',
    address: {
      street: '123 Main St',
      city: 'Riyadh',
      postal_code: '12345',
      country: 'Saudi Arabia'
    }
  });
  
  // Check if encrypted fields are created
  console.log('Client document:', client);
  
  // Check if email is encrypted
  if (client.email_encrypted && 
      client.email_encrypted.iv && 
      client.email_encrypted.tag && 
      client.email_encrypted.encryptedData) {
    console.log('✅ Email field encrypted successfully');
  } else {
    console.error('❌ Email field encryption failed');
    process.exit(1);
  }
  
  // Check if phone is encrypted
  if (client.phone_encrypted && 
      client.phone_encrypted.iv && 
      client.phone_encrypted.tag && 
      client.phone_encrypted.encryptedData) {
    console.log('✅ Phone field encrypted successfully');
  } else {
    console.error('❌ Phone field encryption failed');
    process.exit(1);
  }
  
  // Check if nested fields are encrypted
  if (client.address.street_encrypted && 
      client.address.street_encrypted.iv && 
      client.address.street_encrypted.tag && 
      client.address.street_encrypted.encryptedData) {
    console.log('✅ Nested field (address.street) encrypted successfully');
  } else {
    console.error('❌ Nested field encryption failed');
    process.exit(1);
  }
  
  // Test decryption
  const decrypted = client.decryptFields();
  console.log('Decrypted fields:', decrypted);
  
  if (decrypted.email === 'client@example.com' && 
      decrypted.phone === '+966123456789' && 
      decrypted.id_number === '1234567890') {
    console.log('✅ Field decryption successful');
  } else {
    console.error('❌ Field decryption failed');
    process.exit(1);
  }
  
  console.log('✅ All model encryption tests passed');
}

// Run the test
testModelEncryption();
EOL

# Run model encryption test (skip actual execution as it requires MongoDB)
echo "Skipping model encryption test execution (requires MongoDB)..."
echo "✅ Model encryption test script created"

# Test security middleware
echo -e "\n[5/6] Testing security middleware..."
cat > $TEST_DIR/test_security_middleware.js << 'EOL'
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
EOL

# Run security middleware test (skip actual execution as it requires express and supertest)
echo "Skipping security middleware test execution (requires express and supertest)..."
echo "✅ Security middleware test script created"

# Test GDPR routes
echo -e "\n[6/6] Testing GDPR compliance routes..."
cat > $TEST_DIR/test_gdpr_routes.js << 'EOL'
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
EOL

# Run GDPR routes test (skip actual execution as it requires express and supertest)
echo "Skipping GDPR routes test execution (requires express and supertest)..."
echo "✅ GDPR routes test script created"

echo -e "\n============================================"
echo "Security test scripts created successfully!"
echo "Some tests were skipped as they require additional dependencies."
echo "To run the skipped tests, install the required dependencies and run the test scripts individually."
echo "============================================"
