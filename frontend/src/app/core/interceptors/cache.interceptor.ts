import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { environment } from '../../../environments/environment';

/**
 * معترض التخزين المؤقت
 * يقوم بتخزين استجابات HTTP مؤقتًا لتحسين الأداء
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  // قائمة بالطرق التي يمكن تخزينها مؤقتًا
  private cacheableMethods = ['GET'];
  
  // قائمة بأنماط URL التي لا يمكن تخزينها مؤقتًا
  private nonCacheableUrls = [
    /\/auth\//,
    /\/login/,
    /\/logout/,
    /\/register/,
    /\/reset-password/
  ];
  
  constructor(private cacheService: CacheService) {}

  /**
   * اعتراض طلب HTTP
   * @param request طلب HTTP
   * @param next معالج الطلب التالي
   * @returns ملاحظة قابلة للمراقبة مع حدث HTTP
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // تخطي التخزين المؤقت إذا كان معطلاً في البيئة
    if (!environment.enableHttpCache) {
      return next.handle(request);
    }
    
    // تخطي التخزين المؤقت للطلبات غير القابلة للتخزين المؤقت
    if (!this.isCacheable(request)) {
      return next.handle(request);
    }
    
    // التحقق من وجود الاستجابة في الذاكرة المؤقتة
    const cachedResponse = this.cacheService.get(request.urlWithParams);
    
    if (cachedResponse) {
      // إرجاع الاستجابة المخزنة مؤقتًا
      return of(cachedResponse);
    }
    
    // إجراء الطلب وتخزين الاستجابة مؤقتًا
    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // تخزين الاستجابة مؤقتًا
          this.cacheService.set(request.urlWithParams, event, this.getTTL(request));
        }
      })
    );
  }

  /**
   * التحقق مما إذا كان الطلب قابلاً للتخزين المؤقت
   * @param request طلب HTTP
   * @returns ما إذا كان الطلب قابلاً للتخزين المؤقت
   */
  private isCacheable(request: HttpRequest<any>): boolean {
    // التحقق من طريقة الطلب
    if (!this.cacheableMethods.includes(request.method)) {
      return false;
    }
    
    // التحقق من رأس عدم التخزين المؤقت
    if (request.headers.get('Cache-Control') === 'no-cache' || 
        request.headers.get('Pragma') === 'no-cache') {
      return false;
    }
    
    // التحقق من أنماط URL غير القابلة للتخزين المؤقت
    const url = request.url;
    for (const pattern of this.nonCacheableUrls) {
      if (pattern.test(url)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * الحصول على فترة صلاحية التخزين المؤقت للطلب
   * @param request طلب HTTP
   * @returns فترة الصلاحية بالمللي ثانية
   */
  private getTTL(request: HttpRequest<any>): number {
    // يمكن تخصيص فترة الصلاحية بناءً على نوع الطلب
    if (request.url.includes('/api/reference-data')) {
      // بيانات مرجعية - تخزين مؤقت لفترة أطول (ساعة)
      return 60 * 60 * 1000;
    } else if (request.url.includes('/api/user-data')) {
      // بيانات المستخدم - تخزين مؤقت لفترة قصيرة (دقيقة)
      return 60 * 1000;
    }
    
    // فترة صلاحية افتراضية (5 دقائق)
    return 5 * 60 * 1000;
  }
}
