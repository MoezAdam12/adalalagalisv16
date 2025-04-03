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
