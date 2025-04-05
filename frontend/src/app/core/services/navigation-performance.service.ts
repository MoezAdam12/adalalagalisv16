import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationPerformanceService {
  private navigationStart: number;
  private routeChangeInProgress = false;

  constructor(private router: Router) {
    this.setupNavigationTracking();
  }

  /**
   * إعداد تتبع أداء التنقل
   */
  private setupNavigationTracking(): void {
    // تتبع بداية التنقل
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.navigationStart = performance.now();
      this.routeChangeInProgress = true;
      this.showRouteLoadingIndicator();
    });

    // تتبع نهاية التنقل (نجاح)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.handleNavigationComplete('success');
    });

    // تتبع إلغاء التنقل
    this.router.events.pipe(
      filter(event => event instanceof NavigationCancel)
    ).subscribe(() => {
      this.handleNavigationComplete('cancel');
    });

    // تتبع خطأ التنقل
    this.router.events.pipe(
      filter(event => event instanceof NavigationError)
    ).subscribe((event: NavigationError) => {
      this.handleNavigationComplete('error', event.error);
    });
  }

  /**
   * معالجة اكتمال التنقل
   * @param status حالة التنقل
   * @param error خطأ التنقل (اختياري)
   */
  private handleNavigationComplete(status: 'success' | 'cancel' | 'error', error?: any): void {
    if (!this.routeChangeInProgress) {
      return;
    }

    const navigationEnd = performance.now();
    const navigationTime = navigationEnd - this.navigationStart;

    // تسجيل وقت التنقل
    console.log(`Navigation ${status} - Time: ${navigationTime.toFixed(2)}ms`);

    // إرسال بيانات الأداء إلى التحليلات
    this.sendNavigationMetrics({
      status,
      time: navigationTime,
      error: error ? error.message : null
    });

    this.routeChangeInProgress = false;
    this.hideRouteLoadingIndicator();
  }

  /**
   * إظهار مؤشر تحميل المسار
   */
  private showRouteLoadingIndicator(): void {
    const loadingIndicator = document.getElementById('route-loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    } else {
      // إنشاء مؤشر تحميل إذا لم يكن موجودًا
      this.createRouteLoadingIndicator();
    }
  }

  /**
   * إخفاء مؤشر تحميل المسار
   */
  private hideRouteLoadingIndicator(): void {
    const loadingIndicator = document.getElementById('route-loading-indicator');
    if (loadingIndicator) {
      // إخفاء المؤشر بعد تأخير قصير لتجنب الوميض
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
      }, 300);
    }
  }

  /**
   * إنشاء مؤشر تحميل المسار
   */
  private createRouteLoadingIndicator(): void {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'route-loading-indicator';
    loadingIndicator.className = 'route-loading-indicator';
    
    // إضافة شريط التقدم
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    loadingIndicator.appendChild(progressBar);
    
    // إضافة أنماط CSS
    const style = document.createElement('style');
    style.textContent = `
      .route-loading-indicator {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        z-index: 9999;
        display: none;
      }
      .progress-bar {
        height: 100%;
        width: 0;
        background-color: #007bff;
        animation: progress-animation 2s ease-in-out infinite;
      }
      @keyframes progress-animation {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
    `;
    
    // إضافة العناصر إلى الصفحة
    document.head.appendChild(style);
    document.body.appendChild(loadingIndicator);
  }

  /**
   * إرسال مقاييس التنقل إلى التحليلات
   * @param metrics مقاييس التنقل
   */
  private sendNavigationMetrics(metrics: any): void {
    // يمكن تنفيذ إرسال البيانات إلى خدمة تحليلات هنا
    // على سبيل المثال، باستخدام Google Analytics أو خدمة مخصصة
  }

  /**
   * تحسين أداء التنقل من خلال التحميل المسبق للمسارات
   * @param routes المسارات المراد تحميلها مسبقًا
   */
  public preloadRoutes(routes: string[]): void {
    routes.forEach(route => {
      // إنشاء عنصر رابط للتحميل المسبق
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }

  /**
   * تحسين أداء التنقل من خلال التحميل المسبق للمكونات
   * @param componentPaths مسارات المكونات المراد تحميلها مسبقًا
   */
  public preloadComponents(componentPaths: string[]): void {
    // يتم تنفيذ هذا من خلال استراتيجية التحميل المسبق المخصصة
    console.log('Preloading components:', componentPaths);
  }
}
