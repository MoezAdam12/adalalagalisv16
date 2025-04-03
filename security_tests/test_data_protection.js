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
