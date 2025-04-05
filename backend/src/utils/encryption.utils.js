/**
 * encryption.utils.js
 * أدوات مساعدة لتشفير البيانات في التطبيق
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

/**
 * فئة لإدارة تشفير البيانات
 */
class EncryptionService {
  constructor() {
    // التحقق من وجود مفاتيح التشفير في متغيرات البيئة
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'adalalegalis_encryption_key_32_bytes';
    this.hmacSecret = process.env.HMAC_SECRET || 'adalalegalis_hmac_secret_key';
    
    // التحقق من طول مفتاح التشفير (يجب أن يكون 32 بايت لـ AES-256)
    if (Buffer.from(this.encryptionKey).length !== 32) {
      logger.warn('مفتاح التشفير ليس بطول 32 بايت. سيتم استخدام اشتقاق المفتاح.');
      this.encryptionKey = this.deriveKey(this.encryptionKey, 'encryption', 32);
    }
  }

  /**
   * اشتقاق مفتاح من كلمة مرور
   * @param {string} password - كلمة المرور المستخدمة لاشتقاق المفتاح
   * @param {string} salt - قيمة الملح المستخدمة في الاشتقاق
   * @param {number} keyLength - طول المفتاح المطلوب بالبايت
   * @returns {Buffer} المفتاح المشتق
   */
  deriveKey(password, salt, keyLength) {
    return crypto.pbkdf2Sync(password, salt, 100000, keyLength, 'sha512');
  }

  /**
   * تشفير بيانات باستخدام AES-256-GCM
   * @param {string|object} data - البيانات المراد تشفيرها
   * @param {string} [additionalData] - بيانات إضافية للتحقق من سلامة التشفير
   * @returns {string} البيانات المشفرة بتنسيق Base64
   */
  encrypt(data, additionalData = '') {
    try {
      // تحويل البيانات إلى سلسلة نصية إذا كانت كائنًا
      const plaintext = typeof data === 'object' ? JSON.stringify(data) : data;
      
      // إنشاء متجه التهيئة (IV) عشوائي
      const iv = crypto.randomBytes(16);
      
      // إنشاء مشفر باستخدام AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey), iv);
      
      // إضافة البيانات الإضافية للتحقق من سلامة التشفير
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData));
      }
      
      // تشفير البيانات
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // الحصول على علامة المصادقة
      const authTag = cipher.getAuthTag();
      
      // دمج IV وعلامة المصادقة والبيانات المشفرة
      const result = {
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        encryptedData: encrypted,
        version: 1 // إصدار خوارزمية التشفير
      };
      
      // تحويل النتيجة إلى سلسلة نصية بتنسيق Base64
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      logger.error('خطأ أثناء تشفير البيانات', { error: error.message });
      throw new Error('فشل تشفير البيانات');
    }
  }

  /**
   * فك تشفير بيانات مشفرة باستخدام AES-256-GCM
   * @param {string} encryptedData - البيانات المشفرة بتنسيق Base64
   * @param {string} [additionalData] - البيانات الإضافية المستخدمة في التشفير
   * @param {boolean} [parseJson=false] - ما إذا كان يجب تحليل النتيجة كـ JSON
   * @returns {string|object} البيانات الأصلية
   */
  decrypt(encryptedData, additionalData = '', parseJson = false) {
    try {
      // تحليل البيانات المشفرة
      const encryptedObj = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
      
      // التحقق من إصدار خوارزمية التشفير
      if (encryptedObj.version !== 1) {
        throw new Error('إصدار التشفير غير مدعوم');
      }
      
      // استخراج IV وعلامة المصادقة والبيانات المشفرة
      const iv = Buffer.from(encryptedObj.iv, 'base64');
      const authTag = Buffer.from(encryptedObj.authTag, 'base64');
      const encrypted = encryptedObj.encryptedData;
      
      // إنشاء مفكك تشفير باستخدام AES-256-GCM
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.encryptionKey), iv);
      
      // تعيين علامة المصادقة
      decipher.setAuthTag(authTag);
      
      // إضافة البيانات الإضافية للتحقق من سلامة التشفير
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData));
      }
      
      // فك تشفير البيانات
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      // تحليل النتيجة كـ JSON إذا كان مطلوبًا
      return parseJson ? JSON.parse(decrypted) : decrypted;
    } catch (error) {
      logger.error('خطأ أثناء فك تشفير البيانات', { error: error.message });
      throw new Error('فشل فك تشفير البيانات');
    }
  }

  /**
   * تشفير كلمة مرور باستخدام bcrypt
   * @param {string} password - كلمة المرور المراد تشفيرها
   * @returns {Promise<string>} كلمة المرور المشفرة
   */
  async hashPassword(password) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error('خطأ أثناء تشفير كلمة المرور', { error: error.message });
      throw new Error('فشل تشفير كلمة المرور');
    }
  }

  /**
   * التحقق من تطابق كلمة مرور مع نسختها المشفرة
   * @param {string} password - كلمة المرور الأصلية
   * @param {string} hashedPassword - كلمة المرور المشفرة
   * @returns {Promise<boolean>} نتيجة التحقق
   */
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('خطأ أثناء التحقق من كلمة المرور', { error: error.message });
      throw new Error('فشل التحقق من كلمة المرور');
    }
  }

  /**
   * إنشاء توقيع HMAC للبيانات
   * @param {string|object} data - البيانات المراد توقيعها
   * @returns {string} التوقيع بتنسيق Base64
   */
  createHmacSignature(data) {
    try {
      // تحويل البيانات إلى سلسلة نصية إذا كانت كائنًا
      const message = typeof data === 'object' ? JSON.stringify(data) : data;
      
      // إنشاء توقيع HMAC باستخدام SHA-256
      const hmac = crypto.createHmac('sha256', this.hmacSecret);
      hmac.update(message);
      
      return hmac.digest('base64');
    } catch (error) {
      logger.error('خطأ أثناء إنشاء توقيع HMAC', { error: error.message });
      throw new Error('فشل إنشاء توقيع HMAC');
    }
  }

  /**
   * التحقق من صحة توقيع HMAC
   * @param {string|object} data - البيانات الأصلية
   * @param {string} signature - التوقيع المراد التحقق منه
   * @returns {boolean} نتيجة التحقق
   */
  verifyHmacSignature(data, signature) {
    try {
      // إنشاء توقيع جديد للبيانات
      const expectedSignature = this.createHmacSignature(data);
      
      // التحقق من تطابق التوقيعين
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'base64'),
        Buffer.from(expectedSignature, 'base64')
      );
    } catch (error) {
      logger.error('خطأ أثناء التحقق من توقيع HMAC', { error: error.message });
      return false;
    }
  }

  /**
   * إنشاء رمز عشوائي
   * @param {number} [length=32] - طول الرمز بالبايت
   * @returns {string} الرمز العشوائي بتنسيق Base64
   */
  generateRandomToken(length = 32) {
    try {
      return crypto.randomBytes(length).toString('base64');
    } catch (error) {
      logger.error('خطأ أثناء إنشاء رمز عشوائي', { error: error.message });
      throw new Error('فشل إنشاء رمز عشوائي');
    }
  }

  /**
   * تشفير معرف كائن في قاعدة البيانات
   * @param {string} id - المعرف المراد تشفيره
   * @returns {string} المعرف المشفر
   */
  encryptId(id) {
    // استخدام تشفير أحادي الاتجاه للمعرف
    const hmac = crypto.createHmac('sha256', this.hmacSecret);
    hmac.update(id.toString());
    
    // استخدام أول 16 حرفًا من التوقيع كمعرف مشفر
    return hmac.digest('hex').substring(0, 16);
  }

  /**
   * تشفير بيانات حساسة في كائن
   * @param {object} obj - الكائن المحتوي على بيانات حساسة
   * @param {Array<string>} sensitiveFields - قائمة الحقول الحساسة
   * @returns {object} الكائن بعد تشفير البيانات الحساسة
   */
  encryptSensitiveData(obj, sensitiveFields) {
    const result = { ...obj };
    
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.encrypt(result[field]);
      }
    }
    
    return result;
  }

  /**
   * فك تشفير بيانات حساسة في كائن
   * @param {object} obj - الكائن المحتوي على بيانات مشفرة
   * @param {Array<string>} sensitiveFields - قائمة الحقول المشفرة
   * @returns {object} الكائن بعد فك تشفير البيانات
   */
  decryptSensitiveData(obj, sensitiveFields) {
    const result = { ...obj };
    
    for (const field of sensitiveFields) {
      if (result[field]) {
        try {
          result[field] = this.decrypt(result[field]);
        } catch (error) {
          // تجاهل أخطاء فك التشفير والاحتفاظ بالقيمة المشفرة
          logger.warn(`فشل فك تشفير الحقل ${field}`, { error: error.message });
        }
      }
    }
    
    return result;
  }
}

// إنشاء نسخة واحدة من الخدمة
const encryptionService = new EncryptionService();

module.exports = encryptionService;
