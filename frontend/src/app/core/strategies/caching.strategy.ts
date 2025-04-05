import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CachingStrategy } from './strategy.interfaces';

/**
 * استراتيجية التخزين المؤقت في الذاكرة
 * تنفيذ لواجهة استراتيجية التخزين المؤقت باستخدام الذاكرة
 */
@Injectable({
  providedIn: 'root'
})
export class MemoryCachingStrategy implements CachingStrategy {
  /**
   * مخزن البيانات المؤقت
   * @private
   */
  private cache: Map<string, { value: any; expiry: number | null }> = new Map();

  /**
   * الحصول على عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   * @returns العنصر المخزن أو null إذا لم يكن موجودًا أو انتهت صلاحيته
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // التحقق من انتهاء الصلاحية
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * تخزين عنصر في التخزين المؤقت
   * @param key مفتاح العنصر
   * @param value قيمة العنصر
   * @param ttl مدة صلاحية العنصر بالثواني (اختياري)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, { value, expiry });
  }

  /**
   * إزالة عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * مسح جميع العناصر من التخزين المؤقت
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * استراتيجية التخزين المؤقت في التخزين المحلي
 * تنفيذ لواجهة استراتيجية التخزين المؤقت باستخدام التخزين المحلي للمتصفح
 */
@Injectable({
  providedIn: 'root'
})
export class LocalStorageCachingStrategy implements CachingStrategy {
  /**
   * بادئة مفاتيح التخزين المؤقت
   * @private
   */
  private prefix = 'app_cache_';

  /**
   * الحصول على عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   * @returns العنصر المخزن أو null إذا لم يكن موجودًا أو انتهت صلاحيته
   */
  get<T>(key: string): T | null {
    const itemStr = localStorage.getItem(this.prefix + key);
    
    if (!itemStr) {
      return null;
    }
    
    try {
      const item = JSON.parse(itemStr);
      
      // التحقق من انتهاء الصلاحية
      if (item.expiry && item.expiry < Date.now()) {
        this.remove(key);
        return null;
      }
      
      return item.value as T;
    } catch (e) {
      this.remove(key);
      return null;
    }
  }

  /**
   * تخزين عنصر في التخزين المؤقت
   * @param key مفتاح العنصر
   * @param value قيمة العنصر
   * @param ttl مدة صلاحية العنصر بالثواني (اختياري)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + (ttl * 1000) : null;
    const item = { value, expiry };
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      console.error('خطأ في تخزين العنصر في التخزين المحلي:', e);
    }
  }

  /**
   * إزالة عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   */
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * مسح جميع العناصر من التخزين المؤقت
   */
  clear(): void {
    // إزالة فقط العناصر التي تبدأ بالبادئة المحددة
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

/**
 * خدمة التخزين المؤقت
 * توفر واجهة موحدة للتخزين المؤقت مع دعم استراتيجيات مختلفة
 */
@Injectable({
  providedIn: 'root'
})
export class CachingService {
  /**
   * استراتيجية التخزين المؤقت الحالية
   * @private
   */
  private strategy: CachingStrategy;

  /**
   * إنشاء نسخة من خدمة التخزين المؤقت
   * @param memoryStrategy استراتيجية التخزين المؤقت في الذاكرة
   * @param localStorageStrategy استراتيجية التخزين المؤقت في التخزين المحلي
   */
  constructor(
    private memoryStrategy: MemoryCachingStrategy,
    private localStorageStrategy: LocalStorageCachingStrategy
  ) {
    // استخدام استراتيجية الذاكرة كاستراتيجية افتراضية
    this.strategy = this.memoryStrategy;
  }

  /**
   * تعيين استراتيجية التخزين المؤقت
   * @param strategyType نوع الاستراتيجية
   */
  setStrategy(strategyType: 'memory' | 'localStorage'): void {
    this.strategy = strategyType === 'memory' ? this.memoryStrategy : this.localStorageStrategy;
  }

  /**
   * الحصول على عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   * @returns العنصر المخزن أو null إذا لم يكن موجودًا
   */
  get<T>(key: string): T | null {
    return this.strategy.get<T>(key);
  }

  /**
   * تخزين عنصر في التخزين المؤقت
   * @param key مفتاح العنصر
   * @param value قيمة العنصر
   * @param ttl مدة صلاحية العنصر بالثواني (اختياري)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.strategy.set<T>(key, value, ttl);
  }

  /**
   * إزالة عنصر من التخزين المؤقت
   * @param key مفتاح العنصر
   */
  remove(key: string): void {
    this.strategy.remove(key);
  }

  /**
   * مسح جميع العناصر من التخزين المؤقت
   */
  clear(): void {
    this.strategy.clear();
  }

  /**
   * تخزين نتيجة استدعاء دالة في التخزين المؤقت
   * @param key مفتاح التخزين المؤقت
   * @param fn الدالة المراد تخزين نتيجتها
   * @param ttl مدة صلاحية العنصر بالثواني (اختياري)
   * @returns تدفق رصدي يحتوي على نتيجة الدالة
   */
  cacheObservable<T>(key: string, fn: () => Observable<T>, ttl?: number): Observable<T> {
    return new Observable<T>(observer => {
      // محاولة الحصول على النتيجة من التخزين المؤقت
      const cachedValue = this.get<T>(key);
      
      if (cachedValue !== null) {
        // إرجاع القيمة المخزنة مؤقتًا
        observer.next(cachedValue);
        observer.complete();
        return;
      }
      
      // استدعاء الدالة وتخزين النتيجة
      const subscription = fn().subscribe({
        next: (value: T) => {
          this.set(key, value, ttl);
          observer.next(value);
        },
        error: (err: any) => observer.error(err),
        complete: () => observer.complete()
      });
      
      // تنظيف الاشتراك عند إلغاء الاشتراك
      return () => subscription.unsubscribe();
    });
  }
}
