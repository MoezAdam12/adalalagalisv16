/**
 * performance.utils.ts
 * مجموعة من الأدوات المساعدة لتحسين أداء التطبيق
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';

/**
 * واجهة لتكوين التخزين المؤقت
 */
export interface CacheConfig {
  /** مدة صلاحية التخزين المؤقت بالمللي ثانية */
  expiresIn: number;
  /** الحد الأقصى لعدد العناصر المخزنة */
  maxSize?: number;
  /** مفتاح التخزين المؤقت المخصص */
  customKey?: string;
}

/**
 * واجهة لتكوين التحميل البطيء
 */
export interface LazyLoadConfig {
  /** مسار الوحدة المراد تحميلها */
  path: string;
  /** اسم الوحدة المراد تحميلها */
  moduleName: string;
  /** تأخير التحميل بالمللي ثانية (اختياري) */
  delay?: number;
  /** أولوية التحميل (اختياري) */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * واجهة لتكوين تحسين الصور
 */
export interface ImageOptimizationConfig {
  /** عرض الصورة المطلوب */
  width?: number;
  /** ارتفاع الصورة المطلوب */
  height?: number;
  /** جودة الصورة (0-100) */
  quality?: number;
  /** تنسيق الصورة */
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  /** تحميل الصورة بشكل كسول */
  lazy?: boolean;
  /** استخدام صورة مصغرة أولاً */
  placeholder?: boolean;
}

/**
 * خدمة تحسين الأداء
 * توفر أدوات لتحسين أداء التطبيق من خلال التخزين المؤقت والتحميل البطيء وتحسين الصور
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceUtils {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private lazyModules: Map<string, Promise<any>> = new Map();
  private defaultCacheConfig: CacheConfig = {
    expiresIn: 300000, // 5 دقائق
    maxSize: 100
  };

  /**
   * تخزين نتائج الاستعلامات مؤقتًا لتقليل طلبات الخادم
   * @param source$ Observable المصدر
   * @param cacheKey مفتاح التخزين المؤقت
   * @param config تكوين التخزين المؤقت
   * @returns Observable مع التخزين المؤقت
   */
  cacheApiResponse<T>(
    source$: Observable<T>,
    cacheKey: string,
    config?: Partial<CacheConfig>
  ): Observable<T> {
    const mergedConfig = { ...this.defaultCacheConfig, ...config };
    const key = mergedConfig.customKey || cacheKey;

    // التحقق من وجود بيانات مخزنة مؤقتًا وصالحة
    const cachedData = this.cache.get(key);
    if (cachedData && cachedData.expiry > Date.now()) {
      return of(cachedData.data);
    }

    // إذا لم تكن هناك بيانات مخزنة مؤقتًا أو انتهت صلاحيتها، قم بتنفيذ الاستعلام وتخزين النتيجة
    return source$.pipe(
      tap(data => {
        // تخزين البيانات مع وقت انتهاء الصلاحية
        this.cache.set(key, {
          data,
          expiry: Date.now() + mergedConfig.expiresIn
        });

        // التحقق من حجم التخزين المؤقت وإزالة العناصر القديمة إذا تجاوز الحد الأقصى
        if (mergedConfig.maxSize && this.cache.size > mergedConfig.maxSize) {
          const keysIterator = this.cache.keys();
          this.cache.delete(keysIterator.next().value);
        }
      }),
      catchError(error => {
        console.error(`خطأ في استرداد البيانات لـ ${key}:`, error);
        throw error;
      }),
      // مشاركة نفس النتيجة مع جميع المشتركين
      shareReplay(1)
    );
  }

  /**
   * مسح عنصر محدد من التخزين المؤقت
   * @param cacheKey مفتاح التخزين المؤقت
   * @param customKey مفتاح مخصص (اختياري)
   */
  clearCacheItem(cacheKey: string, customKey?: string): void {
    const key = customKey || cacheKey;
    this.cache.delete(key);
  }

  /**
   * مسح جميع العناصر المخزنة مؤقتًا
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * تحميل الوحدات بشكل كسول
   * @param config تكوين التحميل البطيء
   * @returns وعد بالوحدة المحملة
   */
  lazyLoadModule(config: LazyLoadConfig): Promise<any> {
    const key = `${config.path}#${config.moduleName}`;

    // التحقق من وجود الوحدة في الذاكرة المؤقتة
    if (this.lazyModules.has(key)) {
      return this.lazyModules.get(key)!;
    }

    // إنشاء وعد لتحميل الوحدة
    const modulePromise = new Promise<any>((resolve, reject) => {
      // إضافة تأخير اختياري
      setTimeout(() => {
        import(/* webpackChunkName: "[request]" */ `${config.path}`)
          .then(module => {
            const loadedModule = module[config.moduleName];
            if (loadedModule) {
              resolve(loadedModule);
            } else {
              reject(new Error(`الوحدة ${config.moduleName} غير موجودة في المسار ${config.path}`));
            }
          })
          .catch(error => {
            console.error(`فشل تحميل الوحدة ${config.moduleName}:`, error);
            reject(error);
          });
      }, config.delay || 0);
    });

    // تخزين الوعد في الذاكرة المؤقتة
    this.lazyModules.set(key, modulePromise);
    return modulePromise;
  }

  /**
   * تحسين تحميل الصور
   * @param imageUrl رابط الصورة
   * @param config تكوين تحسين الصورة
   * @returns رابط الصورة المحسنة
   */
  optimizeImage(imageUrl: string, config: ImageOptimizationConfig): string {
    // التحقق من صحة الرابط
    if (!imageUrl) {
      return '';
    }

    // إذا كان الرابط يحتوي على معلمات تحسين بالفعل، قم بإرجاعه كما هو
    if (imageUrl.includes('?w=') || imageUrl.includes('&w=')) {
      return imageUrl;
    }

    // بناء معلمات التحسين
    const params: string[] = [];

    if (config.width) {
      params.push(`w=${config.width}`);
    }

    if (config.height) {
      params.push(`h=${config.height}`);
    }

    if (config.quality) {
      params.push(`q=${config.quality}`);
    }

    if (config.format) {
      params.push(`fm=${config.format}`);
    }

    // إضافة المعلمات إلى الرابط
    const separator = imageUrl.includes('?') ? '&' : '?';
    return params.length > 0 ? `${imageUrl}${separator}${params.join('&')}` : imageUrl;
  }

  /**
   * إنشاء سمات تحميل كسول للصور
   * @param config تكوين تحسين الصورة
   * @returns كائن يحتوي على سمات التحميل الكسول
   */
  createLazyLoadAttributes(config: ImageOptimizationConfig): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};

    if (config.lazy) {
      attributes['loading'] = 'lazy';
      attributes['decoding'] = 'async';
    }

    return attributes;
  }

  /**
   * قياس أداء تنفيذ الدالة
   * @param fn الدالة المراد قياس أدائها
   * @param args وسائط الدالة
   * @returns نتيجة تنفيذ الدالة مع وقت التنفيذ
   */
  measurePerformance<T, A extends any[]>(
    fn: (...args: A) => T,
    ...args: A
  ): { result: T; executionTime: number } {
    const start = performance.now();
    const result = fn(...args);
    const executionTime = performance.now() - start;

    console.log(`تنفيذ الدالة استغرق ${executionTime.toFixed(2)} مللي ثانية`);
    return { result, executionTime };
  }

  /**
   * قياس أداء تنفيذ الدالة غير المتزامنة
   * @param fn الدالة غير المتزامنة المراد قياس أدائها
   * @param args وسائط الدالة
   * @returns وعد بنتيجة تنفيذ الدالة مع وقت التنفيذ
   */
  async measureAsyncPerformance<T, A extends any[]>(
    fn: (...args: A) => Promise<T>,
    ...args: A
  ): Promise<{ result: T; executionTime: number }> {
    const start = performance.now();
    const result = await fn(...args);
    const executionTime = performance.now() - start;

    console.log(`تنفيذ الدالة غير المتزامنة استغرق ${executionTime.toFixed(2)} مللي ثانية`);
    return { result, executionTime };
  }

  /**
   * تحسين تحديثات DOM عن طريق تجميع التغييرات
   * @param updateFn دالة التحديث
   * @param delay التأخير بين التحديثات
   * @returns دالة محسنة
   */
  batchDomUpdates<T extends (...args: any[]) => void>(
    updateFn: T,
    delay: number = 100
  ): (...args: Parameters<T>) => void {
    let timeout: any;
    let argsQueue: Parameters<T>[] = [];

    return (...args: Parameters<T>) => {
      argsQueue.push(args);

      if (!timeout) {
        timeout = setTimeout(() => {
          // استخدام requestAnimationFrame للتزامن مع دورة تحديث المتصفح
          requestAnimationFrame(() => {
            // تنفيذ آخر تحديث فقط لتجنب التحديثات غير الضرورية
            const lastArgs = argsQueue[argsQueue.length - 1];
            updateFn(...lastArgs);

            // إعادة تعيين المتغيرات
            argsQueue = [];
            timeout = null;
          });
        }, delay);
      }
    };
  }

  /**
   * تحسين أداء قوائم العرض الطويلة باستخدام تقنية النافذة الافتراضية
   * @param totalItems إجمالي عدد العناصر
   * @param visibleItems عدد العناصر المرئية
   * @param itemHeight ارتفاع العنصر
   * @param scrollTop موضع التمرير الحالي
   * @returns مؤشرات العناصر المرئية
   */
  getVirtualScrollIndices(
    totalItems: number,
    visibleItems: number,
    itemHeight: number,
    scrollTop: number
  ): { startIndex: number; endIndex: number; offsetY: number } {
    // حساب مؤشر البداية بناءً على موضع التمرير
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
    
    // حساب مؤشر النهاية مع إضافة هامش
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + visibleItems + 2 // إضافة عناصر إضافية لتجنب الوميض أثناء التمرير
    );
    
    // حساب الإزاحة العمودية لتحديد موضع القائمة
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY };
  }

  /**
   * تحسين أداء التطبيق عن طريق تأجيل المهام غير الحرجة
   * @param task المهمة المراد تأجيلها
   * @param priority أولوية المهمة
   */
  scheduleTask(task: () => void, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (typeof requestIdleCallback !== 'undefined') {
      // استخدام requestIdleCallback إذا كان متاحًا
      const options: IdleRequestOptions = {
        timeout: priority === 'high' ? 500 : priority === 'medium' ? 1000 : 2000
      };
      
      requestIdleCallback((deadline) => {
        // التحقق من وجود وقت كافٍ لتنفيذ المهمة
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          task();
        } else {
          // إعادة جدولة المهمة إذا لم يكن هناك وقت كافٍ
          this.scheduleTask(task, priority);
        }
      }, options);
    } else {
      // استخدام setTimeout كبديل
      const delay = priority === 'high' ? 0 : priority === 'medium' ? 50 : 100;
      setTimeout(task, delay);
    }
  }

  /**
   * تحسين أداء التطبيق على الأجهزة المحمولة
   * @returns كائن يحتوي على معلومات حول قدرات الجهاز
   */
  detectDeviceCapabilities(): {
    isLowEndDevice: boolean;
    connectionType: string;
    isDataSaverEnabled: boolean;
  } {
    // التحقق من قدرات الجهاز
    const memory = (navigator as any).deviceMemory || 4; // القيمة الافتراضية 4GB
    const cpuCores = navigator.hardwareConcurrency || 4; // القيمة الافتراضية 4 نواة
    
    // التحقق من نوع الاتصال
    let connectionType = 'unknown';
    let isDataSaverEnabled = false;
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connectionType = connection?.effectiveType || 'unknown';
      isDataSaverEnabled = connection?.saveData || false;
    }
    
    // تحديد ما إذا كان الجهاز منخفض الأداء
    const isLowEndDevice = memory < 4 || cpuCores < 4;
    
    return {
      isLowEndDevice,
      connectionType,
      isDataSaverEnabled
    };
  }

  /**
   * تكييف التطبيق بناءً على قدرات الجهاز
   * @returns إعدادات مخصصة للجهاز
   */
  getAdaptiveSettings(): {
    enableAnimations: boolean;
    imageQuality: number;
    prefetchLevel: 'none' | 'minimal' | 'aggressive';
  } {
    const capabilities = this.detectDeviceCapabilities();
    
    // تعديل الإعدادات بناءً على قدرات الجهاز
    const enableAnimations = !capabilities.isLowEndDevice;
    
    let imageQuality = 80; // القيمة الافتراضية
    if (capabilities.isLowEndDevice || capabilities.isDataSaverEnabled) {
      imageQuality = 60;
    } else if (capabilities.connectionType === '4g') {
      imageQuality = 85;
    }
    
    let prefetchLevel: 'none' | 'minimal' | 'aggressive' = 'minimal';
    if (capabilities.isDataSaverEnabled) {
      prefetchLevel = 'none';
    } else if (!capabilities.isLowEndDevice && capabilities.connectionType === '4g') {
      prefetchLevel = 'aggressive';
    }
    
    return {
      enableAnimations,
      imageQuality,
      prefetchLevel
    };
  }
}

/**
 * مجموعة من الأدوات المساعدة لتحسين أداء التطبيق
 */
export const performanceHelpers = {
  /**
   * تأخير تنفيذ الدالة حتى يتوقف المستخدم عن الكتابة
   * @param fn الدالة المراد تنفيذها
   * @param delay مدة التأخير بالمللي ثانية
   * @returns دالة محسنة
   */
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    let timeout: any;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  },
  
  /**
   * تحديد معدل تنفيذ الدالة
   * @param fn الدالة المراد تنفيذها
   * @param limit الحد الأقصى لعدد مرات التنفيذ في الفترة المحددة
   * @returns دالة محسنة
   */
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number = 300
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    let lastArgs: Parameters<T> | null = null;
    
    return (...args: Parameters<T>) => {
      lastArgs = args;
      
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        
        setTimeout(() => {
          inThrottle = false;
          if (lastArgs) {
            fn(...lastArgs);
            lastArgs = null;
          }
        }, limit);
      }
    };
  },
  
  /**
   * تخزين نتائج الدالة مؤقتًا لتجنب إعادة الحساب
   * @param fn الدالة المراد تخزين نتائجها
   * @returns دالة محسنة
   */
  memoize<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
    const cache = new Map<string, ReturnType<T>>();
    
    return (...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  },
  
  /**
   * تقسيم المهام الثقيلة إلى أجزاء صغيرة لتحسين استجابة واجهة المستخدم
   * @param items العناصر المراد معالجتها
   * @param processFn دالة معالجة العناصر
   * @param chunkSize حجم الجزء
   * @param delayBetweenChunks التأخير بين الأجزاء
   * @returns وعد بإكمال المعالجة
   */
  processInChunks<T, R>(
    items: T[],
    processFn: (item: T) => R,
    chunkSize: number = 10,
    delayBetweenChunks: number = 50
  ): Promise<R[]> {
    return new Promise((resolve) => {
      const results: R[] = [];
      let index = 0;
      
      function processNextChunk() {
        const chunk = items.slice(index, index + chunkSize);
        index += chunkSize;
        
        // معالجة الجزء الحالي
        chunk.forEach(item => {
          results.push(processFn(item));
        });
        
        // التحقق من اكتمال المعالجة
        if (index < items.length) {
          // جدولة معالجة الجزء التالي
          setTimeout(processNextChunk, delayBetweenChunks);
        } else {
          // إكمال المعالجة
          resolve(results);
        }
      }
      
      // بدء المعالجة
      processNextChunk();
    });
  },
  
  /**
   * تحسين استخدام الذاكرة عن طريق إزالة المراجع غير المستخدمة
   * @param obj الكائن المراد تنظيفه
   */
  cleanupMemory(obj: any): void {
    if (!obj) return;
    
    // إزالة المراجع الدائرية
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          // تجنب المراجع الدائرية
          if (obj[key] !== obj) {
            performanceHelpers.cleanupMemory(obj[key]);
          }
        }
        
        // إزالة المرجع
        obj[key] = null;
      });
    }
  }
};

