const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// تكوين قاعدة البيانات
const config = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'adalalegalis',
    username: process.env.DB_USER || 'adalalegalis',
    password: process.env.DB_PASSWORD || 'admin@123',
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  },
  test: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'adalalegalis_test',
    username: process.env.DB_USER || 'adalalegalis',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

// تحديد البيئة
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// إنشاء اتصال Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions
  }
);

// التحقق من الاتصال
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('تم الاتصال بقاعدة البيانات بنجاح.');
  } catch (error) {
    console.error('فشل الاتصال بقاعدة البيانات:', error);
  }
}

// إنشاء المخططات إذا لم تكن موجودة
async function createSchemas() {
  try {
    // إنشاء مخطط إدارة المستأجرين
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS tenant_management;');
    console.log('تم إنشاء مخطط tenant_management بنجاح أو كان موجوداً بالفعل.');
  } catch (error) {
    console.error('فشل إنشاء المخططات:', error);
  }
}

// تصدير الاتصال والوظائف المساعدة
module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.createSchemas = createSchemas;
