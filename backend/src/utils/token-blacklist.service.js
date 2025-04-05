/**
 * @file token-blacklist.service.js
 * @description خدمة القائمة السوداء للرموز المميزة
 * توفر هذه الخدمة آلية لإلغاء الرموز المميزة JWT وإدارة القائمة السوداء
 */

const redis = require('redis');
const { promisify } = require('util');

/**
 * خدمة القائمة السوداء للرموز المميزة
 * توفر آلية لإلغاء الرموز المميزة JWT وإدارة القائمة السوداء
 */
class TokenBlacklistService {
  constructor() {
    // إنشاء عميل Redis
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
    });
    
    // تحويل دوال Redis إلى وعود
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);
    this.scanAsync = promisify(this.client.scan).bind(this.client);
    
    // بادئة مفاتيح Redis
    this.keyPrefix = 'blacklist:token:';
    
    // معالجة أخطاء الاتصال
    this.client.on('error', (error) => {
      console.error('خطأ في الاتصال بـ Redis:', error);
    });
  }
  
  /**
   * إضافة رمز مميز إلى القائمة السوداء
   * @param {string} token الرمز المميز
   * @param {number} expiryTime وقت انتهاء صلاحية الرمز بالثواني
   * @returns {Promise<boolean>} وعد يتم حله بنجاح العملية
   */
  async addToBlacklist(token, expiryTime) {
    try {
      // إنشاء مفتاح Redis
      const key = `${this.keyPrefix}${token}`;
      
      // إضافة الرمز إلى القائمة السوداء
      await this.setAsync(key, 'revoked');
      
      // تعيين وقت انتهاء الصلاحية
      await this.expireAsync(key, expiryTime);
      
      return true;
    } catch (error) {
      console.error('خطأ في إضافة الرمز إلى القائمة السوداء:', error);
      return false;
    }
  }
  
  /**
   * التحقق مما إذا كان الرمز المميز في القائمة السوداء
   * @param {string} token الرمز المميز
   * @returns {Promise<boolean>} وعد يتم حله بما إذا كان الرمز في القائمة السوداء
   */
  async isBlacklisted(token) {
    try {
      // إنشاء مفتاح Redis
      const key = `${this.keyPrefix}${token}`;
      
      // التحقق من وجود الرمز في القائمة السوداء
      const result = await this.getAsync(key);
      
      return result === 'revoked';
    } catch (error) {
      console.error('خطأ في التحقق من القائمة السوداء:', error);
      return false;
    }
  }
  
  /**
   * إزالة رمز مميز من القائمة السوداء
   * @param {string} token الرمز المميز
   * @returns {Promise<boolean>} وعد يتم حله بنجاح العملية
   */
  async removeFromBlacklist(token) {
    try {
      // إنشاء مفتاح Redis
      const key = `${this.keyPrefix}${token}`;
      
      // إزالة الرمز من القائمة السوداء
      await this.delAsync(key);
      
      return true;
    } catch (error) {
      console.error('خطأ في إزالة الرمز من القائمة السوداء:', error);
      return false;
    }
  }
  
  /**
   * إلغاء جميع الرموز المميزة للمستخدم
   * @param {string} userId معرف المستخدم
   * @param {Array<string>} tokens مصفوفة من الرموز المميزة
   * @param {number} expiryTime وقت انتهاء صلاحية الرموز بالثواني
   * @returns {Promise<boolean>} وعد يتم حله بنجاح العملية
   */
  async revokeAllUserTokens(userId, tokens, expiryTime) {
    try {
      // إضافة كل رمز إلى القائمة السوداء
      const promises = tokens.map(token => this.addToBlacklist(token, expiryTime));
      
      // انتظار اكتمال جميع العمليات
      await Promise.all(promises);
      
      return true;
    } catch (error) {
      console.error('خطأ في إلغاء جميع رموز المستخدم:', error);
      return false;
    }
  }
  
  /**
   * تنظيف القائمة السوداء من الرموز منتهية الصلاحية
   * @returns {Promise<number>} وعد يتم حله بعدد الرموز التي تمت إزالتها
   */
  async cleanupBlacklist() {
    // لا حاجة لتنظيف يدوي لأن Redis يزيل المفاتيح منتهية الصلاحية تلقائيًا
    return 0;
  }
  
  /**
   * الحصول على عدد الرموز في القائمة السوداء
   * @returns {Promise<number>} وعد يتم حله بعدد الرموز في القائمة السوداء
   */
  async getBlacklistSize() {
    try {
      let cursor = '0';
      let count = 0;
      
      // استخدام SCAN للحصول على جميع المفاتيح
      do {
        const [nextCursor, keys] = await this.scanAsync(cursor, 'MATCH', `${this.keyPrefix}*`, 'COUNT', '100');
        cursor = nextCursor;
        count += keys.length;
      } while (cursor !== '0');
      
      return count;
    } catch (error) {
      console.error('خطأ في الحصول على حجم القائمة السوداء:', error);
      return 0;
    }
  }
  
  /**
   * إغلاق اتصال Redis
   * @returns {Promise<void>} وعد يتم حله عند إغلاق الاتصال
   */
  async close() {
    return new Promise((resolve, reject) => {
      this.client.quit((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// إنشاء نسخة واحدة من الخدمة
const tokenBlacklistService = new TokenBlacklistService();

// تصدير الخدمة
module.exports = tokenBlacklistService;
