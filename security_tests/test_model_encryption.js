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
