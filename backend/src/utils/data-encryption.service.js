/**
 * @file data-encryption.service.js
 * @description خدمة تشفير البيانات للتطبيق
 * توفر هذه الخدمة آليات لتشفير وفك تشفير البيانات الحساسة
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// الحصول على مفتاح التشفير من متغيرات البيئة أو إنشاء مفتاح افتراضي
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 
                       crypto.randomBytes(32).toString('hex');

// الحصول على متجه التهيئة من متغيرات البيئة أو إنشاء متجه افتراضي
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 
                      crypto.randomBytes(16).toString('hex').slice(0, 16);

// خوارزمية التشفير الافتراضية
const DEFAULT_ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';

/**
 * خدمة تشفير البيانات
 * توفر آليات لتشفير وفك تشفير البيانات الحساسة
 */
class DataEncryptionService {
  constructor() {
    this.algorithm = DEFAULT_ALGORITHM;
    this.key = Buffer.from(ENCRYPTION_KEY, 'hex');
    this.iv = Buffer.from(ENCRYPTION_IV, 'hex');
    
    // التحقق من طول المفتاح ومتجه التهيئة
    if (this.key.length !== 32) {
      console.warn('تحذير: طول مفتاح التشفير غير صحيح. يجب أن يكون 32 بايت.');
    }
    
    if (this.iv.length !== 16) {
      console.warn('تحذير: طول متجه التهيئة غير صحيح. يجب أن يكون 16 بايت.');
    }
  }
  
  /**
   * تشفير نص
   * @param {string} text النص المراد تشفيره
   * @returns {string} النص المشفر بتنسيق Base64
   */
  encrypt(text) {
    if (!text) {
      return '';
    }
    
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return encrypted;
    } catch (error) {
      console.error('خطأ في تشفير البيانات:', error);
      throw new Error('فشل تشفير البيانات');
    }
  }
  
  /**
   * فك تشفير نص
   * @param {string} encryptedText النص المشفر بتنسيق Base64
   * @returns {string} النص الأصلي
   */
  decrypt(encryptedText) {
    if (!encryptedText) {
      return '';
    }
    
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('خطأ في فك تشفير البيانات:', error);
      throw new Error('فشل فك تشفير البيانات');
    }
  }
  
  /**
   * تشفير كائن
   * @param {Object} data الكائن المراد تشفيره
   * @returns {string} الكائن المشفر بتنسيق Base64
   */
  encryptObject(data) {
    if (!data) {
      return '';
    }
    
    try {
      const jsonString = JSON.stringify(data);
      return this.encrypt(jsonString);
    } catch (error) {
      console.error('خطأ في تشفير الكائن:', error);
      throw new Error('فشل تشفير الكائن');
    }
  }
  
  /**
   * فك تشفير كائن
   * @param {string} encryptedData الكائن المشفر بتنسيق Base64
   * @returns {Object} الكائن الأصلي
   */
  decryptObject(encryptedData) {
    if (!encryptedData) {
      return null;
    }
    
    try {
      const jsonString = this.decrypt(encryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('خطأ في فك تشفير الكائن:', error);
      throw new Error('فشل فك تشفير الكائن');
    }
  }
  
  /**
   * تشفير ملف
   * @param {string} inputFilePath مسار الملف المراد تشفيره
   * @param {string} outputFilePath مسار الملف المشفر
   * @returns {Promise<void>} وعد يتم حله عند اكتمال التشفير
   */
  encryptFile(inputFilePath, outputFilePath) {
    return new Promise((resolve, reject) => {
      try {
        const readStream = fs.createReadStream(inputFilePath);
        const writeStream = fs.createWriteStream(outputFilePath);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        
        readStream.pipe(cipher).pipe(writeStream);
        
        writeStream.on('finish', () => {
          resolve();
        });
        
        writeStream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * فك تشفير ملف
   * @param {string} inputFilePath مسار الملف المشفر
   * @param {string} outputFilePath مسار الملف الأصلي
   * @returns {Promise<void>} وعد يتم حله عند اكتمال فك التشفير
   */
  decryptFile(inputFilePath, outputFilePath) {
    return new Promise((resolve, reject) => {
      try {
        const readStream = fs.createReadStream(inputFilePath);
        const writeStream = fs.createWriteStream(outputFilePath);
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        
        readStream.pipe(decipher).pipe(writeStream);
        
        writeStream.on('finish', () => {
          resolve();
        });
        
        writeStream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * إنشاء تجزئة لنص
   * @param {string} text النص المراد تجزئته
   * @param {string} algorithm خوارزمية التجزئة (الافتراضية: sha256)
   * @returns {string} التجزئة بتنسيق hex
   */
  hash(text, algorithm = 'sha256') {
    if (!text) {
      return '';
    }
    
    try {
      return crypto.createHash(algorithm).update(text).digest('hex');
    } catch (error) {
      console.error('خطأ في إنشاء التجزئة:', error);
      throw new Error('فشل إنشاء التجزئة');
    }
  }
  
  /**
   * إنشاء تجزئة مملحة لنص
   * @param {string} text النص المراد تجزئته
   * @param {string} salt الملح (اختياري، سيتم إنشاؤه إذا لم يتم توفيره)
   * @returns {Object} كائن يحتوي على التجزئة والملح
   */
  hashWithSalt(text, salt = null) {
    if (!text) {
      return { hash: '', salt: '' };
    }
    
    try {
      // إنشاء ملح إذا لم يتم توفيره
      const usedSalt = salt || crypto.randomBytes(16).toString('hex');
      
      // إنشاء تجزئة مملحة
      const hash = crypto.pbkdf2Sync(text, usedSalt, 10000, 64, 'sha512').toString('hex');
      
      return { hash, salt: usedSalt };
    } catch (error) {
      console.error('خطأ في إنشاء التجزئة المملحة:', error);
      throw new Error('فشل إنشاء التجزئة المملحة');
    }
  }
  
  /**
   * التحقق من تطابق نص مع تجزئة مملحة
   * @param {string} text النص المراد التحقق منه
   * @param {string} hash التجزئة المخزنة
   * @param {string} salt الملح المستخدم
   * @returns {boolean} ما إذا كان النص يطابق التجزئة
   */
  verifyHash(text, hash, salt) {
    if (!text || !hash || !salt) {
      return false;
    }
    
    try {
      // إنشاء تجزئة من النص والملح
      const newHash = crypto.pbkdf2Sync(text, salt, 10000, 64, 'sha512').toString('hex');
      
      // مقارنة التجزئة الجديدة مع التجزئة المخزنة
      return newHash === hash;
    } catch (error) {
      console.error('خطأ في التحقق من التجزئة:', error);
      return false;
    }
  }
  
  /**
   * إنشاء توقيع لبيانات
   * @param {string} data البيانات المراد توقيعها
   * @param {string} privateKeyPath مسار المفتاح الخاص
   * @returns {string} التوقيع بتنسيق Base64
   */
  sign(data, privateKeyPath) {
    if (!data || !privateKeyPath) {
      return '';
    }
    
    try {
      // قراءة المفتاح الخاص
      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      
      // إنشاء توقيع
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      sign.end();
      
      return sign.sign(privateKey, 'base64');
    } catch (error) {
      console.error('خطأ في إنشاء التوقيع:', error);
      throw new Error('فشل إنشاء التوقيع');
    }
  }
  
  /**
   * التحقق من توقيع
   * @param {string} data البيانات الموقعة
   * @param {string} signature التوقيع بتنسيق Base64
   * @param {string} publicKeyPath مسار المفتاح العام
   * @returns {boolean} ما إذا كان التوقيع صالحًا
   */
  verify(data, signature, publicKeyPath) {
    if (!data || !signature || !publicKeyPath) {
      return false;
    }
    
    try {
      // قراءة المفتاح العام
      const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
      
      // التحقق من التوقيع
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      verify.end();
      
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      console.error('خطأ في التحقق من التوقيع:', error);
      return false;
    }
  }
  
  /**
   * إنشاء زوج مفاتيح RSA
   * @param {number} keySize حجم المفتاح (الافتراضي: 2048)
   * @param {string} outputDir مجلد الإخراج
   * @returns {Promise<Object>} وعد يتم حله بكائن يحتوي على مسارات المفاتيح
   */
  generateKeyPair(keySize = 2048, outputDir = './keys') {
    return new Promise((resolve, reject) => {
      try {
        // إنشاء مجلد المفاتيح إذا لم يكن موجودًا
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // إنشاء زوج مفاتيح
        crypto.generateKeyPair('rsa', {
          modulusLength: keySize,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        }, (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
            return;
          }
          
          // كتابة المفاتيح إلى ملفات
          const publicKeyPath = path.join(outputDir, 'public_key.pem');
          const privateKeyPath = path.join(outputDir, 'private_key.pem');
          
          fs.writeFileSync(publicKeyPath, publicKey);
          fs.writeFileSync(privateKeyPath, privateKey);
          
          resolve({ publicKeyPath, privateKeyPath });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// إنشاء نسخة واحدة من الخدمة
const dataEncryptionService = new DataEncryptionService();

// تصدير الخدمة
module.exports = dataEncryptionService;
