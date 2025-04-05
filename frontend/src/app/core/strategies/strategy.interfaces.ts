import { Observable } from 'rxjs';

/**
 * واجهة استراتيجية المصادقة
 * تسمح بتبديل استراتيجيات المصادقة المختلفة في وقت التشغيل
 */
export interface AuthenticationStrategy {
  /**
   * مصادقة المستخدم
   * @param credentials بيانات اعتماد المستخدم
   * @returns تدفق رصدي يحتوي على نتيجة المصادقة
   */
  authenticate(credentials: any): Observable<any>;
}

/**
 * واجهة استراتيجية التخزين المؤقت
 * تسمح بتبديل استراتيجيات التخزين المؤقت المختلفة في وقت التشغيل
 */
export interface CachingStrategy {
  /**
   * الحصول على عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   * @returns العنصر المخزن أو null إذا لم يكن موجودًا
   */
  get<T>(key: string): T | null;
  
  /**
   * تخزين عنصر في التخزين المؤقت
   * @param key مفتاح العنصر
   * @param value قيمة العنصر
   * @param ttl مدة صلاحية العنصر بالثواني (اختياري)
   */
  set<T>(key: string, value: T, ttl?: number): void;
  
  /**
   * إزالة عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   */
  remove(key: string): void;
  
  /**
   * مسح جميع العناصر من التخزين المؤقت
   */
  clear(): void;
}

/**
 * واجهة استراتيجية التحقق من الصحة
 * تسمح بتبديل استراتيجيات التحقق من الصحة المختلفة في وقت التشغيل
 */
export interface ValidationStrategy {
  /**
   * التحقق من صحة كيان
   * @param entity الكيان المراد التحقق من صحته
   * @returns كائن يحتوي على أخطاء التحقق من الصحة أو null إذا كان الكيان صحيحًا
   */
  validate(entity: any): { [key: string]: string } | null;
}

/**
 * واجهة استراتيجية التشفير
 * تسمح بتبديل استراتيجيات التشفير المختلفة في وقت التشغيل
 */
export interface EncryptionStrategy {
  /**
   * تشفير بيانات
   * @param data البيانات المراد تشفيرها
   * @returns البيانات المشفرة
   */
  encrypt(data: any): string;
  
  /**
   * فك تشفير بيانات
   * @param encryptedData البيانات المشفرة
   * @returns البيانات الأصلية
   */
  decrypt(encryptedData: string): any;
}

/**
 * واجهة استراتيجية التسجيل
 * تسمح بتبديل استراتيجيات التسجيل المختلفة في وقت التشغيل
 */
export interface LoggingStrategy {
  /**
   * تسجيل معلومات
   * @param message رسالة المعلومات
   * @param context سياق التسجيل (اختياري)
   */
  info(message: string, context?: any): void;
  
  /**
   * تسجيل تحذير
   * @param message رسالة التحذير
   * @param context سياق التسجيل (اختياري)
   */
  warn(message: string, context?: any): void;
  
  /**
   * تسجيل خطأ
   * @param message رسالة الخطأ
   * @param error كائن الخطأ (اختياري)
   * @param context سياق التسجيل (اختياري)
   */
  error(message: string, error?: Error, context?: any): void;
  
  /**
   * تسجيل معلومات تصحيح الأخطاء
   * @param message رسالة التصحيح
   * @param context سياق التسجيل (اختياري)
   */
  debug(message: string, context?: any): void;
}
