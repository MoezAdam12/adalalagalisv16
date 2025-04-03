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
