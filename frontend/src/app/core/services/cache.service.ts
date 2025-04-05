/**
 * @file cache.service.ts
 * @description خدمة تخزين بيانات الواجهة الأمامية مؤقتًا
 * توفر هذه الخدمة آليات لتخزين بيانات الواجهة الأمامية مؤقتًا لتقليل طلبات الخادم
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';

/**
 * واجهة عنصر التخزين المؤقت
 */
interface CacheItem<T> {
  value: T;
  expiry: number;
}

/**
 * واجهة خيارات التخزين المؤقت
 */
export interface CacheOptions {
  /** مدة صلاحية التخزين المؤقت بالمللي ثانية */
  maxAge?: number;
  /** ما إذا كان يجب تخزين الاستجابة في التخزين المحلي */
  localStoragePersist?: boolean;
  /** مفتاح التخزين المحلي (مطلوب إذا كان localStoragePersist صحيحًا) */
  localStorageKey?: string;
}

/**
 * خدمة التخزين المؤقت
 * توفر آليات لتخزين بيانات الواجهة الأمامية مؤقتًا لتقليل طلبات الخادم
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  
  // تخزين مؤقت في الذاكرة
  private cache: Map<string, CacheItem<any>> = new Map<string, CacheItem<any>>();
  
  // تخزين مؤقت للطلبات
  private requestCache: Map<string, Observable<any>> = new Map<string, Observable<any>>();
  
  // مدة الصلاحية الافتراضية (5 دقائق)
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000;
  
  constructor() {
    // تنظيف التخزين المؤقت كل ساعة
    setInterval(() => this.cleanExpiredCache(), 60 * 60 * 1000);
  }
  
  /**
   * تخزين قيمة مؤقتًا
   * @param key مفتاح التخزين المؤقت
   * @param value القيمة المراد تخزينها
   * @param options خيارات التخزين المؤقت
   */
  public set<T>(key: string, value: T, options?: CacheOptions): void {
    const maxAge = options?.maxAge || this.DEFAULT_MAX_AGE;
    const expiry = Date.now() + maxAge;
    
    // تخزين في الذاكرة
    this.cache.set(key, { value, expiry });
    
    // تخزين في التخزين المحلي إذا تم تحديد ذلك
    if (options?.localStoragePersist && options?.localStorageKey) {
      try {
        localStorage.setItem(options.localStorageKey, JSON.stringify({
          value,
          expiry
        }));
      } catch (error) {
        console.error('[CacheService] Error saving to localStorage:', error);
      }
    }
  }
  
  /**
   * الحصول على قيمة من التخزين المؤقت
   * @param key مفتاح التخزين المؤقت
   * @param options خيارات التخزين المؤقت
   * @returns القيمة المخزنة مؤقتًا أو null إذا لم تكن موجودة أو منتهية الصلاحية
   */
  public get<T>(key: string, options?: CacheOptions): T | null {
    // التحقق من التخزين المؤقت في الذاكرة
    const cachedItem = this.cache.get(key);
    
    if (cachedItem && cachedItem.expiry > Date.now()) {
      return cachedItem.value as T;
    }
    
    // إذا لم يتم العثور على العنصر في الذاكرة، تحقق من التخزين المحلي
    if (options?.localStoragePersist && options?.localStorageKey) {
      try {
        const localStorageItem = localStorage.getItem(options.localStorageKey);
        
        if (localStorageItem) {
          const parsedItem = JSON.parse(localStorageItem) as CacheItem<T>;
          
          if (parsedItem.expiry > Date.now()) {
            // تحديث التخزين المؤقت في الذاكرة
            this.cache.set(key, parsedItem);
            return parsedItem.value;
          } else {
            // إزالة العنصر منتهي الصلاحية من التخزين المحلي
            localStorage.removeItem(options.localStorageKey);
          }
        }
      } catch (error) {
        console.error('[CacheService] Error reading from localStorage:', error);
      }
    }
    
    // إزالة العنصر منتهي الصلاحية من التخزين المؤقت في الذاكرة
    if (cachedItem) {
      this.cache.delete(key);
    }
    
    return null;
  }
  
  /**
   * تخزين طلب HTTP مؤقتًا
   * @param key مفتاح التخزين المؤقت
   * @param request طلب HTTP
   * @param options خيارات التخزين المؤقت
   * @returns Observable مع نتيجة الطلب
   */
  public cacheRequest<T>(key: string, request: Observable<T>, options?: CacheOptions): Observable<T> {
    // التحقق من التخزين المؤقت في الذاكرة
    const cachedValue = this.get<T>(key, options);
    
    if (cachedValue !== null) {
      return of(cachedValue);
    }
    
    // التحقق من التخزين المؤقت للطلبات
    const cachedRequest = this.requestCache.get(key);
    
    if (cachedRequest) {
      return cachedRequest as Observable<T>;
    }
    
    // إنشاء طلب جديد مع تخزين النتيجة مؤقتًا
    const newRequest = request.pipe(
      tap(response => {
        // تخزين الاستجابة مؤقتًا
        this.set(key, response, options);
        
        // إزالة الطلب من التخزين المؤقت للطلبات
        setTimeout(() => {
          this.requestCache.delete(key);
        }, 0);
      }),
      catchError(error => {
        // إزالة الطلب من التخزين المؤقت للطلبات في حالة حدوث خطأ
        this.requestCache.delete(key);
        throw error;
      }),
      // مشاركة نفس النتيجة لجميع المشتركين
      shareReplay(1)
    );
    
    // تخزين الطلب مؤقتًا
    this.requestCache.set(key, newRequest);
    
    return newRequest;
  }
  
  /**
   * تخزين استجابة HTTP مؤقتًا
   * @param key مفتاح التخزين المؤقت
   * @param request طلب HTTP
   * @param options خيارات التخزين المؤقت
   * @returns Observable مع استجابة HTTP
   */
  public cacheHttpResponse<T>(key: string, request: Observable<HttpResponse<T>>, options?: CacheOptions): Observable<HttpResponse<T>> {
    // التحقق من التخزين المؤقت في الذاكرة
    const cachedValue = this.get<HttpResponse<T>>(key, options);
    
    if (cachedValue !== null) {
      return of(cachedValue);
    }
    
    // التحقق من التخزين المؤقت للطلبات
    const cachedRequest = this.requestCache.get(key);
    
    if (cachedRequest) {
      return cachedRequest as Observable<HttpResponse<T>>;
    }
    
    // إنشاء طلب جديد مع تخزين النتيجة مؤقتًا
    const newRequest = request.pipe(
      tap(response => {
        // تخزين الاستجابة مؤقتًا إذا كانت ناجحة
        if (response.ok) {
          this.set(key, response, options);
        }
        
        // إزالة الطلب من التخزين المؤقت للطلبات
        setTimeout(() => {
          this.requestCache.delete(key);
        }, 0);
      }),
      catchError(error => {
        // إزالة الطلب من التخزين المؤقت للطلبات في حالة حدوث خطأ
        this.requestCache.delete(key);
        throw error;
      }),
      // مشاركة نفس النتيجة لجميع المشتركين
      shareReplay(1)
    );
    
    // تخزين الطلب مؤقتًا
    this.requestCache.set(key, newRequest);
    
    return newRequest;
  }
  
  /**
   * مسح التخزين المؤقت
   * @param key مفتاح التخزين المؤقت (اختياري، إذا لم يتم تحديده، سيتم مسح جميع البيانات المخزنة مؤقتًا)
   * @param options خيارات التخزين المؤقت
   */
  public clear(key?: string, options?: CacheOptions): void {
    if (key) {
      // مسح عنصر محدد
      this.cache.delete(key);
      this.requestCache.delete(key);
      
      // مسح من التخزين المحلي إذا تم تحديد ذلك
      if (options?.localStoragePersist && options?.localStorageKey) {
        try {
          localStorage.removeItem(options.localStorageKey);
        } catch (error) {
          console.error('[CacheService] Error removing from localStorage:', error);
        }
      }
    } else {
      // مسح جميع العناصر
      this.cache.clear();
      this.requestCache.clear();
      
      // لا نقوم بمسح التخزين المحلي بالكامل لأنه قد يحتوي على بيانات أخرى
    }
  }
  
  /**
   * تنظيف العناصر منتهية الصلاحية من التخزين المؤقت
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    
    // تنظيف التخزين المؤقت في الذاكرة
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * الحصول على حجم التخزين المؤقت
   * @returns عدد العناصر في التخزين المؤقت
   */
  public getCacheSize(): number {
    return this.cache.size;
  }
  
  /**
   * الحصول على مفاتيح التخزين المؤقت
   * @returns مصفوفة من مفاتيح التخزين المؤقت
   */
  public getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * التحقق مما إذا كان المفتاح موجودًا في التخزين المؤقت
   * @param key مفتاح التخزين المؤقت
   * @returns ما إذا كان المفتاح موجودًا وغير منتهي الصلاحية
   */
  public has(key: string): boolean {
    const cachedItem = this.cache.get(key);
    return cachedItem !== undefined && cachedItem.expiry > Date.now();
  }
}
