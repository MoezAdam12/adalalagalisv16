// Main entry point for the backend application
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging

// Database connection
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres:5432/adalalegalis',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

// Test database connection
async function testDbConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testDbConnection();

// Tenant middleware - extracts tenant information from request
app.use((req, res, next) => {
  // Extract tenant from subdomain or header
  const host = req.get('host');
  const tenantHeader = req.get('X-Tenant-ID');
  
  if (tenantHeader) {
    req.tenantId = tenantHeader;
  } else if (host) {
    // Extract subdomain from host
    const subdomain = host.split('.')[0];
    if (subdomain !== 'api' && subdomain !== 'www' && subdomain !== 'localhost') {
      req.subdomain = subdomain;
    }
  }
  
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tenants', require('./routes/tenants.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/contracts', require('./routes/contracts.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/clients', require('./routes/clients.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
