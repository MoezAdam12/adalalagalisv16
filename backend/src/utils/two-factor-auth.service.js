/**
 * @file two-factor-auth.service.js
 * @description خدمة المصادقة الثنائية للتطبيق
 * توفر هذه الخدمة آليات للمصادقة الثنائية (2FA) باستخدام TOTP
 */

const crypto = require('crypto');
const base32 = require('hi-base32');
const QRCode = require('qrcode');

/**
 * خدمة المصادقة الثنائية
 * توفر آليات للمصادقة الثنائية (2FA) باستخدام TOTP
 */
class TwoFactorAuthService {
  constructor() {
    // طول المفتاح السري بالبايت
    this.secretLength = 20;
    
    // مدة صلاحية الرمز بالثواني (30 ثانية)
    this.timeStep = 30;
    
    // طول الرمز (6 أرقام)
    this.codeLength = 6;
    
    // خوارزمية التجزئة
    this.algorithm = 'sha1';
    
    // عدد الفترات الزمنية المسموح بها للتحقق (قبل وبعد الوقت الحالي)
    this.allowedTimePeriods = 1;
  }
  
  /**
   * إنشاء مفتاح سري للمصادقة الثنائية
   * @returns {string} المفتاح السري بتنسيق Base32
   */
  generateSecret() {
    // إنشاء بايتات عشوائية
    const randomBytes = crypto.randomBytes(this.secretLength);
    
    // تحويل البايتات إلى تنسيق Base32
    return base32.encode(randomBytes).replace(/=/g, '');
  }
  
  /**
   * إنشاء رابط لتطبيق المصادقة
   * @param {string} secret المفتاح السري
   * @param {string} accountName اسم الحساب (عادة البريد الإلكتروني للمستخدم)
   * @param {string} issuer اسم مصدر الرمز (اسم التطبيق)
   * @returns {string} رابط otpauth://
   */
  generateAuthUrl(secret, accountName, issuer = 'Adalalegalis') {
    // ترميز المعلمات
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccountName = encodeURIComponent(accountName);
    
    // إنشاء الرابط
    return `otpauth://totp/${encodedIssuer}:${encodedAccountName}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${this.algorithm.toUpperCase()}&digits=${this.codeLength}&period=${this.timeStep}`;
  }
  
  /**
   * إنشاء رمز QR للمصادقة الثنائية
   * @param {string} authUrl رابط المصادقة
   * @returns {Promise<string>} وعد يتم حله برمز QR بتنسيق Data URL
   */
  async generateQRCode(authUrl) {
    try {
      // إنشاء رمز QR
      return await QRCode.toDataURL(authUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        scale: 4
      });
    } catch (error) {
      console.error('خطأ في إنشاء رمز QR:', error);
      throw new Error('فشل إنشاء رمز QR');
    }
  }
  
  /**
   * إنشاء رمز TOTP
   * @param {string} secret المفتاح السري بتنسيق Base32
   * @param {number} counter العداد (الوقت الحالي بالثواني مقسومًا على مدة الخطوة)
   * @returns {string} رمز TOTP
   */
  generateTOTP(secret, counter) {
    try {
      // فك ترميز المفتاح السري من Base32
      const decodedSecret = base32.decode.asBytes(secret);
      
      // تحويل العداد إلى بايتات
      const buffer = Buffer.alloc(8);
      for (let i = 0; i < 8; i++) {
        buffer[7 - i] = counter & 0xff;
        counter = counter >> 8;
      }
      
      // إنشاء HMAC
      const hmac = crypto.createHmac(this.algorithm, Buffer.from(decodedSecret));
      hmac.update(buffer);
      const hmacResult = hmac.digest();
      
      // الحصول على موضع البداية للرمز
      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      
      // استخراج 4 بايتات من HMAC بدءًا من الموضع
      const binary = ((hmacResult[offset] & 0x7f) << 24) |
                     ((hmacResult[offset + 1] & 0xff) << 16) |
                     ((hmacResult[offset + 2] & 0xff) << 8) |
                     (hmacResult[offset + 3] & 0xff);
      
      // الحصول على الرمز
      const otp = binary % Math.pow(10, this.codeLength);
      
      // تنسيق الرمز ليكون بالطول المطلوب
      return otp.toString().padStart(this.codeLength, '0');
    } catch (error) {
      console.error('خطأ في إنشاء رمز TOTP:', error);
      throw new Error('فشل إنشاء رمز TOTP');
    }
  }
  
  /**
   * إنشاء رمز TOTP للوقت الحالي
   * @param {string} secret المفتاح السري بتنسيق Base32
   * @returns {string} رمز TOTP
   */
  generateCode(secret) {
    // الحصول على العداد الحالي
    const counter = Math.floor(Date.now() / 1000 / this.timeStep);
    
    // إنشاء الرمز
    return this.generateTOTP(secret, counter);
  }
  
  /**
   * التحقق من صحة رمز TOTP
   * @param {string} token الرمز المدخل
   * @param {string} secret المفتاح السري بتنسيق Base32
   * @returns {boolean} ما إذا كان الرمز صالحًا
   */
  verifyCode(token, secret) {
    if (!token || !secret) {
      return false;
    }
    
    try {
      // الحصول على العداد الحالي
      const currentCounter = Math.floor(Date.now() / 1000 / this.timeStep);
      
      // التحقق من الرمز في الفترات الزمنية المسموح بها
      for (let i = -this.allowedTimePeriods; i <= this.allowedTimePeriods; i++) {
        const counter = currentCounter + i;
        const generatedToken = this.generateTOTP(secret, counter);
        
        if (token === generatedToken) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('خطأ في التحقق من رمز TOTP:', error);
      return false;
    }
  }
  
  /**
   * إنشاء رموز احتياطية
   * @param {number} count عدد الرموز (الافتراضي: 10)
   * @param {number} length طول كل رمز (الافتراضي: 8)
   * @returns {Array<string>} مصفوفة من الرموز الاحتياطية
   */
  generateBackupCodes(count = 10, length = 8) {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // إنشاء رمز عشوائي
      const code = crypto.randomBytes(length / 2).toString('hex');
      
      // إضافة الرمز إلى المصفوفة
      codes.push(code);
    }
    
    return codes;
  }
  
  /**
   * تشفير رموز احتياطية
   * @param {Array<string>} codes مصفوفة من الرموز الاحتياطية
   * @returns {Array<string>} مصفوفة من الرموز المشفرة
   */
  hashBackupCodes(codes) {
    return codes.map(code => {
      // إنشاء ملح
      const salt = crypto.randomBytes(16).toString('hex');
      
      // إنشاء تجزئة
      const hash = crypto.pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
      
      // إرجاع الملح والتجزئة
      return `${salt}:${hash}`;
    });
  }
  
  /**
   * التحقق من صحة رمز احتياطي
   * @param {string} code الرمز المدخل
   * @param {Array<string>} hashedCodes مصفوفة من الرموز المشفرة
   * @returns {Object} كائن يحتوي على نتيجة التحقق ومؤشر الرمز إذا كان صالحًا
   */
  verifyBackupCode(code, hashedCodes) {
    if (!code || !hashedCodes || !Array.isArray(hashedCodes)) {
      return { valid: false, index: -1 };
    }
    
    // البحث عن الرمز في المصفوفة
    for (let i = 0; i < hashedCodes.length; i++) {
      const [salt, hash] = hashedCodes[i].split(':');
      
      // التحقق من التجزئة
      const calculatedHash = crypto.pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
      
      if (calculatedHash === hash) {
        return { valid: true, index: i };
      }
    }
    
    return { valid: false, index: -1 };
  }
}

// إنشاء نسخة واحدة من الخدمة
const twoFactorAuthService = new TwoFactorAuthService();

// تصدير الخدمة
module.exports = twoFactorAuthService;
