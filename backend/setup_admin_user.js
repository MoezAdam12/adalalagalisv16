/**
 * Script to create an admin user for Adalalegalis
 * 
 * This script creates a default tenant and admin user for the Adalalegalis system.
 * Run this script after setting up the database to create the initial admin account.
 */

const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres:5432/adalalegalis',
  {
    dialect: 'postgres',
    logging: console.log
  }
);

async function createAdminUser() {
  try {
    // Import models
    const Tenant = require('./src/models/tenant.model');
    const User = require('./src/models/user.model');

    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Generate a random 6-digit account number
    const accountNumber = Math.floor(100000 + Math.random() * 900000).toString();

    console.log('Creating default tenant...');
    // Create default tenant
    const tenant = await Tenant.create({
      account_number: accountNumber,
      name: 'Adalalegalis Admin',
      subdomain: 'admin',
      status: 'active',
      subscription_plan: 'enterprise',
      subscription_start_date: new Date(),
      subscription_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      contact_email: 'ezoo.91.91@gmail.com',
      contact_phone: '+966000000000',
      address: 'Admin Address',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      settings: {
        defaultLanguage: 'ar',
        allowUserRegistration: true,
        enableTwoFactorAuth: false
      }
    });

    console.log(`Tenant created with ID: ${tenant.id} and Account Number: ${accountNumber}`);

    // Hash password
    const passwordHash = bcrypt.hashSync('admin123', 10);

    console.log('Creating admin user...');
    // Create admin user
    const user = await User.create({
      email: 'ezoo.91.91@gmail.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      tenant_id: tenant.id,
      language: 'ar',
      status: 'active',
      email_verified: true
    });

    console.log(`Admin user created with ID: ${user.id} and Email: ${user.email}`);
    console.log('Setup completed successfully!');

    // Close database connection
    await sequelize.close();
    console.log('Database connection closed.');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser();
