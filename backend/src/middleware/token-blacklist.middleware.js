/**
 * وسيط قائمة رفض الرموز المميزة
 * يوفر هذا الوسيط آلية لإلغاء الرموز المميزة JWT وإدارة قائمة الرفض
 */

const redis = require('redis');
const { promisify } = require('util');
const envConfig = require('../config/env.config');
const authConfig = require('../config/auth.config');

// إنشاء عميل Redis إذا كان متاحًا
let redisClient;
let setAsync;
let getAsync;
let delAsync;
let expireAsync;

// محاولة الاتصال بـ Redis إذا كان متاحًا
if (envConfig.REDIS_URL && authConfig.tokenBlacklistEnabled) {
  try {
    redisClient = redis.createClient({
      url: envConfig.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.warn('فشل الاتصال بـ Redis، سيتم استخدام التخزين في الذاكرة لقائمة الرفض');
          return new Error('فشل الاتصال بـ Redis');
        }
        // إعادة المحاولة بعد 1 ثانية
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // تحويل وظائف Redis إلى وعود
    setAsync = promisify(redisClient.set).bind(redisClient);
    getAsync = promisify(redisClient.get).bind(redisClient);
    delAsync = promisify(redisClient.del).bind(redisClient);
    expireAsync = promisify(redisClient.expire).bind(redisClient);

    redisClient.on('error', (error) => {
      console.error('خطأ في اتصال Redis:', error);
    });
  } catch (error) {
    console.error('فشل تهيئة عميل Redis:', error);
  }
}

// تخزين في الذاكرة كبديل لـ Redis
const memoryBlacklist = new Map();

/**
 * إضافة رمز مميز إلى قائمة الرفض
 * @param {string} token - الرمز المميز المراد إضافته إلى قائمة الرفض
 * @param {number} expiry - وقت انتهاء الصلاحية بالثواني
 */
const addToBlacklist = async (token, expiry) => {
  if (!authConfig.tokenBlacklistEnabled) {
    return;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = now + expiry;

    if (redisClient && redisClient.connected) {
      // استخدام Redis لتخزين الرمز المميز في قائمة الرفض
      await setAsync(`blacklist:${token}`, expiryTime);
      await expireAsync(`blacklist:${token}`, expiry);
    } else {
      // استخدام التخزين في الذاكرة كبديل
      memoryBlacklist.set(token, expiryTime);
      
      // إزالة الرمز المميز من قائمة الرفض بعد انتهاء صلاحيته
      setTimeout(() => {
        memoryBlacklist.delete(token);
      }, expiry * 1000);
    }
  } catch (error) {
    console.error('خطأ في إضافة الرمز المميز إلى قائمة الرفض:', error);
  }
};

/**
 * التحقق مما إذا كان الرمز المميز في قائمة الرفض
 * @param {string} token - الرمز المميز المراد التحقق منه
 * @returns {boolean} - ما إذا كان الرمز المميز في قائمة الرفض
 */
const isBlacklisted = async (token) => {
  if (!authConfig.tokenBlacklistEnabled) {
    return false;
  }

  try {
    const now = Math.floor(Date.now() / 1000);

    if (redisClient && redisClient.connected) {
      // استخدام Redis للتحقق من الرمز المميز
      const expiry = await getAsync(`blacklist:${token}`);
      return expiry !== null && parseInt(expiry, 10) > now;
    } else {
      // استخدام التخزين في الذاكرة كبديل
      const expiry = memoryBlacklist.get(token);
      return expiry !== undefined && expiry > now;
    }
  } catch (error) {
    console.error('خطأ في التحقق من قائمة الرفض:', error);
    return false;
  }
};

/**
 * إزالة رمز مميز من قائمة الرفض
 * @param {string} token - الرمز المميز المراد إزالته
 */
const removeFromBlacklist = async (token) => {
  if (!authConfig.tokenBlacklistEnabled) {
    return;
  }

  try {
    if (redisClient && redisClient.connected) {
      // استخدام Redis لإزالة الرمز المميز
      await delAsync(`blacklist:${token}`);
    } else {
      // استخدام التخزين في الذاكرة كبديل
      memoryBlacklist.delete(token);
    }
  } catch (error) {
    console.error('خطأ في إزالة الرمز المميز من قائمة الرفض:', error);
  }
};

/**
 * وسيط التحقق من قائمة الرفض
 * يتحقق مما إذا كان الرمز المميز في قائمة الرفض
 */
const tokenBlacklistMiddleware = async (req, res, next) => {
  if (!authConfig.tokenBlacklistEnabled) {
    return next();
  }

  try {
    // الحصول على الرمز المميز من رأس الطلب
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // التحقق مما إذا كان الرمز المميز في قائمة الرفض
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        status: 'error',
        message: 'الرمز المميز غير صالح أو تم إلغاؤه',
        code: 'TOKEN_BLACKLISTED'
      });
    }

    next();
  } catch (error) {
    console.error('خطأ في وسيط قائمة الرفض:', error);
    next();
  }
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
  removeFromBlacklist,
  tokenBlacklistMiddleware
};
