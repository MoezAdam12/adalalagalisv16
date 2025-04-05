import { TestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';

/**
 * اختبارات خدمة التخزين المؤقت
 */
describe('CacheService', () => {
  let service: CacheService;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService]
    });
    service = TestBed.inject(CacheService);
  });

  // التحقق من إنشاء الخدمة بنجاح
  it('يجب إنشاء الخدمة', () => {
    expect(service).toBeTruthy();
  });

  // التحقق من تخزين واسترجاع البيانات
  it('يجب تخزين واسترجاع البيانات بشكل صحيح', () => {
    const key = 'test-key';
    const data = { name: 'Test Data' };
    
    // تخزين البيانات
    service.set(key, data);
    
    // استرجاع البيانات
    const cachedData = service.get(key);
    
    // التحقق من البيانات
    expect(cachedData).toEqual(data);
  });

  // التحقق من التحقق من وجود البيانات
  it('يجب التحقق من وجود البيانات بشكل صحيح', () => {
    const key = 'test-key';
    const data = { name: 'Test Data' };
    
    // التحقق من عدم وجود البيانات
    expect(service.has(key)).toBeFalsy();
    
    // تخزين البيانات
    service.set(key, data);
    
    // التحقق من وجود البيانات
    expect(service.has(key)).toBeTruthy();
  });

  // التحقق من حذف البيانات
  it('يجب حذف البيانات بشكل صحيح', () => {
    const key = 'test-key';
    const data = { name: 'Test Data' };
    
    // تخزين البيانات
    service.set(key, data);
    
    // التحقق من وجود البيانات
    expect(service.has(key)).toBeTruthy();
    
    // حذف البيانات
    service.remove(key);
    
    // التحقق من عدم وجود البيانات
    expect(service.has(key)).toBeFalsy();
  });

  // التحقق من مسح جميع البيانات
  it('يجب مسح جميع البيانات بشكل صحيح', () => {
    const key1 = 'test-key-1';
    const key2 = 'test-key-2';
    const data = { name: 'Test Data' };
    
    // تخزين البيانات
    service.set(key1, data);
    service.set(key2, data);
    
    // التحقق من وجود البيانات
    expect(service.has(key1)).toBeTruthy();
    expect(service.has(key2)).toBeTruthy();
    
    // مسح جميع البيانات
    service.clear();
    
    // التحقق من عدم وجود البيانات
    expect(service.has(key1)).toBeFalsy();
    expect(service.has(key2)).toBeFalsy();
  });

  // التحقق من انتهاء صلاحية البيانات
  it('يجب انتهاء صلاحية البيانات بعد مرور الوقت المحدد', (done) => {
    const key = 'test-key';
    const data = { name: 'Test Data' };
    const ttl = 100; // 100 مللي ثانية
    
    // تخزين البيانات مع وقت انتهاء الصلاحية
    service.set(key, data, ttl);
    
    // التحقق من وجود البيانات
    expect(service.has(key)).toBeTruthy();
    
    // الانتظار حتى انتهاء الصلاحية
    setTimeout(() => {
      // التحقق من عدم وجود البيانات
      expect(service.has(key)).toBeFalsy();
      done();
    }, ttl + 50);
  });

  // التحقق من إبطال البيانات باستخدام نمط
  it('يجب إبطال البيانات باستخدام نمط', () => {
    const key1 = 'users/1';
    const key2 = 'users/2';
    const key3 = 'posts/1';
    const data = { name: 'Test Data' };
    
    // تخزين البيانات
    service.set(key1, data);
    service.set(key2, data);
    service.set(key3, data);
    
    // التحقق من وجود البيانات
    expect(service.has(key1)).toBeTruthy();
    expect(service.has(key2)).toBeTruthy();
    expect(service.has(key3)).toBeTruthy();
    
    // إبطال البيانات باستخدام نمط
    service.invalidatePattern('users');
    
    // التحقق من عدم وجود البيانات التي تطابق النمط
    expect(service.has(key1)).toBeFalsy();
    expect(service.has(key2)).toBeFalsy();
    expect(service.has(key3)).toBeTruthy(); // لا يطابق النمط
  });

  // التحقق من الحصول على إحصائيات التخزين المؤقت
  it('يجب الحصول على إحصائيات التخزين المؤقت بشكل صحيح', () => {
    const key1 = 'test-key-1';
    const key2 = 'test-key-2';
    const data = { name: 'Test Data' };
    
    // تخزين البيانات
    service.set(key1, data);
    service.set(key2, data);
    
    // الحصول على البيانات لزيادة عدد الإصابات
    service.get(key1);
    service.get(key1);
    service.get(key2);
    
    // محاولة الحصول على بيانات غير موجودة لزيادة عدد الإخفاقات
    service.get('non-existent-key');
    
    // الحصول على الإحصائيات
    const stats = service.getStats();
    
    // التحقق من الإحصائيات
    expect(stats.size).toBe(2);
    expect(stats.hits).toBe(3);
    expect(stats.misses).toBe(1);
    expect(stats.hitRatio).toBe(0.75); // 3 / (3 + 1)
  });
});
