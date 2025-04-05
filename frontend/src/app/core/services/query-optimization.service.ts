import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * خدمة تحسين استعلامات قاعدة البيانات
 * توفر وظائف لتحسين أداء استعلامات قاعدة البيانات من خلال الواجهة الأمامية
 */
@Injectable({
  providedIn: 'root'
})
export class QueryOptimizationService {
  // تخزين مؤقت للاستعلامات المشتركة
  private queryCache: Map<string, Observable<any>> = new Map();
  
  constructor(private http: HttpClient) {}

  /**
   * تنفيذ استعلام مع تحديد الحقول المطلوبة فقط
   * @param endpoint نقطة النهاية للاستعلام
   * @param fields الحقول المطلوبة
   * @param params معلمات إضافية
   * @returns ملاحظة قابلة للمراقبة مع نتيجة الاستعلام
   */
  getWithFields<T>(endpoint: string, fields: string[], params: any = {}): Observable<T> {
    // إضافة معلمة الحقول إلى الاستعلام
    const queryParams = { ...params, fields: fields.join(',') };
    
    return this.http.get<T>(`${environment.apiUrl}/${endpoint}`, { params: queryParams }).pipe(
      catchError(error => {
        console.error(`فشل استعلام مع تحديد الحقول: ${endpoint}`, error);
        throw error;
      })
    );
  }

  /**
   * تنفيذ استعلام مع تصفح بالصفحات
   * @param endpoint نقطة النهاية للاستعلام
   * @param page رقم الصفحة
   * @param limit عدد العناصر في الصفحة
   * @param params معلمات إضافية
   * @returns ملاحظة قابلة للمراقبة مع نتيجة الاستعلام
   */
  getPaginated<T>(endpoint: string, page: number, limit: number, params: any = {}): Observable<T> {
    // إضافة معلمات التصفح بالصفحات إلى الاستعلام
    const queryParams = { ...params, page, limit };
    
    return this.http.get<T>(`${environment.apiUrl}/${endpoint}`, { params: queryParams }).pipe(
      catchError(error => {
        console.error(`فشل استعلام مع تصفح بالصفحات: ${endpoint}`, error);
        throw error;
      })
    );
  }

  /**
   * تنفيذ استعلام مع تصفح بالمؤشر
   * @param endpoint نقطة النهاية للاستعلام
   * @param cursor مؤشر التصفح
   * @param limit عدد العناصر
   * @param params معلمات إضافية
   * @returns ملاحظة قابلة للمراقبة مع نتيجة الاستعلام
   */
  getCursorPaginated<T>(endpoint: string, cursor: string | null, limit: number, params: any = {}): Observable<T> {
    // إضافة معلمات التصفح بالمؤشر إلى الاستعلام
    const queryParams = { ...params, limit };
    if (cursor) {
      queryParams['cursor'] = cursor;
    }
    
    return this.http.get<T>(`${environment.apiUrl}/${endpoint}`, { params: queryParams }).pipe(
      catchError(error => {
        console.error(`فشل استعلام مع تصفح بالمؤشر: ${endpoint}`, error);
        throw error;
      })
    );
  }

  /**
   * تنفيذ استعلام مجمع
   * @param endpoint نقطة النهاية للاستعلام
   * @param ids معرفات العناصر المطلوبة
   * @param params معلمات إضافية
   * @returns ملاحظة قابلة للمراقبة مع نتيجة الاستعلام
   */
  getBatch<T>(endpoint: string, ids: string[], params: any = {}): Observable<T> {
    // إضافة معلمة المعرفات إلى الاستعلام
    const queryParams = { ...params, ids: ids.join(',') };
    
    return this.http.get<T>(`${environment.apiUrl}/${endpoint}/batch`, { params: queryParams }).pipe(
      catchError(error => {
        console.error(`فشل استعلام مجمع: ${endpoint}`, error);
        throw error;
      })
    );
  }

  /**
   * تنفيذ استعلام مشترك (يتم مشاركته بين عدة مكونات)
   * @param endpoint نقطة النهاية للاستعلام
   * @param params معلمات الاستعلام
   * @param cacheTime وقت التخزين المؤقت بالمللي ثانية
   * @returns ملاحظة قابلة للمراقبة مع نتيجة الاستعلام
   */
  getShared<T>(endpoint: string, params: any = {}, cacheTime: number = 30000): Observable<T> {
    // إنشاء مفتاح للتخزين المؤقت
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // التحقق من وجود الاستعلام في التخزين المؤقت
    if (!this.queryCache.has(cacheKey)) {
      // تنفيذ الاستعلام وتخزينه مؤقتًا
      const query = this.http.get<T>(`${environment.apiUrl}/${endpoint}`, { params }).pipe(
        // مشاركة الاستعلام بين المشتركين
        shareReplay({ bufferSize: 1, refCount: true, windowTime: cacheTime }),
        catchError(error => {
          console.error(`فشل استعلام مشترك: ${endpoint}`, error);
          // إزالة الاستعلام من التخزين المؤقت في حالة الخطأ
          this.queryCache.delete(cacheKey);
          throw error;
        }),
        // إزالة الاستعلام من التخزين المؤقت بعد انتهاء وقت التخزين المؤقت
        tap(() => {
          setTimeout(() => {
            this.queryCache.delete(cacheKey);
          }, cacheTime);
        })
      );
      
      // تخزين الاستعلام مؤقتًا
      this.queryCache.set(cacheKey, query);
    }
    
    // إرجاع الاستعلام المخزن مؤقتًا
    return this.queryCache.get(cacheKey) as Observable<T>;
  }

  /**
   * تنفيذ استعلام مع تلميحات الفهرس
   * @param endpoint نقطة النهاية للاستعلام
   * @param indexHint تلميح الفهرس
   * @param params معلمات إضافية
   * @returns ملاحظة قابلة للمراقبة مع نتيجة الاستعلام
   */
  getWithIndexHint<T>(endpoint: string, indexHint: string, params: any = {}): Observable<T> {
    // إضافة معلمة تلميح الفهرس إلى الاستعلام
    const queryParams = { ...params, indexHint };
    
    return this.http.get<T>(`${environment.apiUrl}/${endpoint}`, { params: queryParams }).pipe(
      catchError(error => {
        console.error(`فشل استعلام مع تلميح الفهرس: ${endpoint}`, error);
        throw error;
      })
    );
  }

  /**
   * إبطال التخزين المؤقت للاستعلامات المشتركة
   * @param endpoint نقطة النهاية للاستعلام (اختياري)
   */
  invalidateCache(endpoint?: string): void {
    if (endpoint) {
      // إبطال التخزين المؤقت لنقطة نهاية محددة
      const keysToDelete: string[] = [];
      
      this.queryCache.forEach((_, key) => {
        if (key.startsWith(`${endpoint}:`)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.queryCache.delete(key);
      });
    } else {
      // إبطال جميع التخزين المؤقت
      this.queryCache.clear();
    }
  }
}
