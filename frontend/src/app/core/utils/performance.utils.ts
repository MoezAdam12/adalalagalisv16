/**
 * @file performance.utils.ts
 * @description أدوات مساعدة متعلقة بأداء التطبيق الأمامي
 * توفر هذه الأدوات وظائف لتحسين أداء التطبيق وتسريع وقت التحميل وتحسين تجربة المستخدم
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';

/**
 * خدمة أدوات الأداء
 * توفر وظائف لتحسين أداء التطبيق
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceUtils {
  
  // تخزين مؤقت للبيانات
  private cacheStore: Map<string, any> = new Map<string, any>();
  
  // تخزين مؤقت للطلبات
  private apiCache: Map<string, Observable<any>> = new Map<string, Observable<any>>();
  
  constructor() {}
  
  /**
   * تخزين البيانات مؤقتًا
   * @param key مفتاح التخزين المؤقت
   * @param data البيانات المراد تخزينها
   * @param expirationTimeMs وقت انتهاء صلاحية التخزين المؤقت بالمللي ثانية (اختياري)
   */
  public cacheData(key: string, data: any, expirationTimeMs?: number): void {
    this.cacheStore.set(key, {
      data,
      timestamp: Date.now(),
      expirationTimeMs
    });
  }
  
  /**
   * استرجاع البيانات من التخزين المؤقت
   * @param key مفتاح التخزين المؤقت
   * @returns البيانات المخزنة مؤقتًا أو null إذا لم تكن موجودة أو منتهية الصلاحية
   */
  public getCachedData(key: string): any {
    const cachedItem = this.cacheStore.get(key);
    
    if (!cachedItem) {
      return null;
    }
    
    // التحقق من انتهاء صلاحية التخزين المؤقت
    if (cachedItem.expirationTimeMs && 
        Date.now() - cachedItem.timestamp > cachedItem.expirationTimeMs) {
      this.cacheStore.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }
  
  /**
   * مسح التخزين المؤقت
   * @param key مفتاح التخزين المؤقت (اختياري، إذا لم يتم تحديده، سيتم مسح جميع البيانات المخزنة مؤقتًا)
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cacheStore.delete(key);
      this.apiCache.delete(key);
    } else {
      this.cacheStore.clear();
      this.apiCache.clear();
    }
  }
  
  /**
   * تخزين طلبات API مؤقتًا
   * @param key مفتاح التخزين المؤقت
   * @param apiCall دالة طلب API
   * @param maxAge العمر الأقصى للتخزين المؤقت بالمللي ثانية (اختياري، الافتراضي 5 دقائق)
   * @returns Observable مع البيانات المخزنة مؤقتًا
   */
  public cacheApiCall<T>(key: string, apiCall: Observable<T>, maxAge: number = 300000): Observable<T> {
    const cachedResponse = this.apiCache.get(key);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = apiCall.pipe(
      tap(data => {
        setTimeout(() => this.apiCache.delete(key), maxAge);
      }),
      shareReplay(1),
      catchError(error => {
        this.apiCache.delete(key);
        throw error;
      })
    );
    
    this.apiCache.set(key, response);
    return response;
  }
  
  /**
   * قياس وقت تنفيذ الدالة
   * @param functionName اسم الدالة
   * @param func الدالة المراد قياس وقت تنفيذها
   * @returns نتيجة تنفيذ الدالة
   */
  public measureExecutionTime<T>(functionName: string, func: () => T): T {
    const startTime = performance.now();
    const result = func();
    const endTime = performance.now();
    
    console.log(`[Performance] ${functionName} executed in ${endTime - startTime}ms`);
    
    return result;
  }
  
  /**
   * قياس وقت تنفيذ الدالة غير المتزامنة
   * @param functionName اسم الدالة
   * @param func الدالة غير المتزامنة المراد قياس وقت تنفيذها
   * @returns Promise مع نتيجة تنفيذ الدالة
   */
  public async measureAsyncExecutionTime<T>(functionName: string, func: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await func();
    const endTime = performance.now();
    
    console.log(`[Performance] ${functionName} executed in ${endTime - startTime}ms`);
    
    return result;
  }
  
  /**
   * تأخير تنفيذ المهام غير الضرورية
   * @param task المهمة المراد تأخير تنفيذها
   * @param delayMs وقت التأخير بالمللي ثانية (اختياري، الافتراضي 1000 مللي ثانية)
   */
  public deferNonCriticalTask(task: () => void, delayMs: number = 1000): void {
    setTimeout(() => {
      requestIdleCallback(() => {
        task();
      });
    }, delayMs);
  }
  
  /**
   * تحسين أداء تحميل الصور
   * @param imageUrl رابط الصورة
   * @param loadingPlaceholder رابط صورة بديلة أثناء التحميل (اختياري)
   * @returns وعد مع رابط الصورة المحملة
   */
  public optimizeImageLoading(imageUrl: string, loadingPlaceholder?: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve(imageUrl);
      };
      
      img.onerror = () => {
        resolve(loadingPlaceholder || imageUrl);
      };
      
      img.src = imageUrl;
    });
  }
  
  /**
   * تحسين أداء تحميل الصفحة
   * يقوم بتحميل الموارد الضرورية أولاً ثم تحميل الموارد غير الضرورية لاحقًا
   * @param criticalResources قائمة بالموارد الضرورية
   * @param nonCriticalResources قائمة بالموارد غير الضرورية
   */
  public optimizePageLoading(criticalResources: string[], nonCriticalResources: string[]): void {
    // تحميل الموارد الضرورية فورًا
    criticalResources.forEach(resource => {
      this.preloadResource(resource);
    });
    
    // تأخير تحميل الموارد غير الضرورية
    this.deferNonCriticalTask(() => {
      nonCriticalResources.forEach(resource => {
        this.preloadResource(resource);
      });
    });
  }
  
  /**
   * تحميل مسبق للموارد
   * @param resourceUrl رابط المورد
   */
  private preloadResource(resourceUrl: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resourceUrl;
    
    if (resourceUrl.endsWith('.js')) {
      link.as = 'script';
    } else if (resourceUrl.endsWith('.css')) {
      link.as = 'style';
    } else if (resourceUrl.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
      link.as = 'image';
    } else if (resourceUrl.match(/\.(woff|woff2|ttf|otf)$/)) {
      link.as = 'font';
    }
    
    document.head.appendChild(link);
  }
}
