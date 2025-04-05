/**
 * وسيط تشفير البيانات
 * يوفر هذا الوسيط وظائف لتشفير وفك تشفير البيانات الحساسة
 */

const crypto = require('crypto');
const envConfig = require('../config/env.config');

// التحقق من وجود مفتاح التشفير
if (envConfig.DATA_ENCRYPTION_ENABLED && !envConfig.ENCRYPTION_KEY) {
  console.error('خطأ: تم تمكين تشفير البيانات ولكن لم يتم تعيين مفتاح التشفير (ENCRYPTION_KEY)');
  if (envConfig.NODE_ENV === 'production') {
    throw new Error('مفتاح التشفير مطلوب في بيئة الإنتاج عندما يكون تشفير البيانات ممكّنًا');
  }
}

// الحصول على مفتاح التشفير من متغيرات البيئة أو استخدام مفتاح افتراضي للتطوير
const ENCRYPTION_KEY = envConfig.ENCRYPTION_KEY || 'development-key-32-chars-exactly!';
// استخدام مفتاح بطول 32 بايت (256 بت) للتوافق مع خوارزمية AES-256
const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));

// خوارزمية التشفير
const ALGORITHM = 'aes-256-gcm';
// طول IV (متجه التهيئة)
const IV_LENGTH = 16;
// طول علامة المصادقة
const AUTH_TAG_LENGTH = 16;

/**
 * تشفير بيانات
 * @param {string|object} data - البيانات المراد تشفيرها (نص أو كائن)
 * @returns {string} - البيانات المشفرة كسلسلة Base64
 */
const encrypt = (data) => {
  // إذا كان تشفير البيانات معطلاً، إرجاع البيانات كما هي
  if (!envConfig.DATA_ENCRYPTION_ENABLED) {
    return typeof data === 'object' ? JSON.stringify(data) : data;
  }

  try {
    // تحويل البيانات إلى سلسلة نصية إذا كانت كائنًا
    const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // إنشاء IV عشوائي
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // إنشاء مشفر
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
    
    // تشفير البيانات
    let encrypted = cipher.update(dataString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // الحصول على علامة المصادقة
    const authTag = cipher.getAuthTag();
    
    // دمج IV وعلامة المصادقة والبيانات المشفرة
    const result = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]).toString('base64');
    
    return result;
  } catch (error) {
    console.error('خطأ في تشفير البيانات:', error);
    throw new Error('فشل تشفير البيانات');
  }
};

/**
 * فك تشفير بيانات
 * @param {string} encryptedData - البيانات المشفرة كسلسلة Base64
 * @param {boolean} parseJson - ما إذا كان يجب تحليل النتيجة كـ JSON
 * @returns {string|object} - البيانات المفكوكة التشفير
 */
const decrypt = (encryptedData, parseJson = false) => {
  // إذا كان تشفير البيانات معطلاً، إرجاع البيانات كما هي
  if (!envConfig.DATA_ENCRYPTION_ENABLED) {
    return parseJson ? JSON.parse(encryptedData) : encryptedData;
  }

  try {
    // تحويل البيانات المشفرة من Base64 إلى Buffer
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // استخراج IV وعلامة المصادقة والبيانات المشفرة
    const iv = buffer.slice(0, IV_LENGTH);
    const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptedText = buffer.slice(IV_LENGTH + AUTH_TAG_LENGTH).toString('base64');
    
    // إنشاء مفكك تشفير
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
    
    // تعيين علامة المصادقة
    decipher.setAuthTag(authTag);
    
    // فك تشفير البيانات
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // تحليل النتيجة كـ JSON إذا كان مطلوبًا
    return parseJson ? JSON.parse(decrypted) : decrypted;
  } catch (error) {
    console.error('خطأ في فك تشفير البيانات:', error);
    throw new Error('فشل فك تشفير البيانات');
  }
};

/**
 * تشفير حقول محددة في كائن
 * @param {object} obj - الكائن المراد تشفير حقوله
 * @param {string[]} fields - قائمة الحقول المراد تشفيرها
 * @returns {object} - الكائن مع الحقول المشفرة
 */
const encryptFields = (obj, fields) => {
  // إذا كان تشفير البيانات معطلاً، إرجاع الكائن كما هو
  if (!envConfig.DATA_ENCRYPTION_ENABLED) {
    return obj;
  }

  // نسخ الكائن لتجنب تعديل الكائن الأصلي
  const result = { ...obj };
  
  // تشفير كل حقل محدد
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(result[field]);
    }
  }
  
  return result;
};

/**
 * فك تشفير حقول محددة في كائن
 * @param {object} obj - الكائن المراد فك تشفير حقوله
 * @param {string[]} fields - قائمة الحقول المراد فك تشفيرها
 * @param {object} parseJsonFields - كائن يحدد الحقول التي يجب تحليلها كـ JSON
 * @returns {object} - الكائن مع الحقول المفكوكة التشفير
 */
const decryptFields = (obj, fields, parseJsonFields = {}) => {
  // إذا كان تشفير البيانات معطلاً، إرجاع الكائن كما هو
  if (!envConfig.DATA_ENCRYPTION_ENABLED) {
    return obj;
  }

  // نسخ الكائن لتجنب تعديل الكائن الأصلي
  const result = { ...obj };
  
  // فك تشفير كل حقل محدد
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      const parseJson = parseJsonFields[field] === true;
      result[field] = decrypt(result[field], parseJson);
    }
  }
  
  return result;
};

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields
};
