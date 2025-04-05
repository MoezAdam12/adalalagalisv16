import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  private metrics: any = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    navigationStart: null,
    loadComplete: null
  };

  constructor(private http: HttpClient) { }

  /**
   * بدء مراقبة مقاييس الأداء
   */
  public startMonitoring(): void {
    this.captureNavigationTiming();
    this.captureWebVitals();
  }

  /**
   * التقاط توقيتات التنقل
   */
  private captureNavigationTiming(): void {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.metrics.navigationStart = timing.navigationStart;
      this.metrics.ttfb = timing.responseStart - timing.navigationStart;

      // انتظار اكتمال تحميل الصفحة
      window.addEventListener('load', () => {
        this.metrics.loadComplete = Date.now() - timing.navigationStart;
        this.sendMetricsToAnalytics();
      });
    }
  }

  /**
   * التقاط مقاييس الويب الحيوية
   */
  private captureWebVitals(): void {
    // قياس First Contentful Paint (FCP)
    this.observePaint('first-contentful-paint', (entry) => {
      this.metrics.fcp = entry.startTime;
    });

    // قياس Largest Contentful Paint (LCP)
    this.observePaint('largest-contentful-paint', (entry) => {
      this.metrics.lcp = entry.startTime;
    });

    // قياس First Input Delay (FID)
    this.observeFirstInput((entry) => {
      this.metrics.fid = entry.processingStart - entry.startTime;
    });

    // قياس Cumulative Layout Shift (CLS)
    this.observeLayoutShift((entry) => {
      if (!this.metrics.cls) {
        this.metrics.cls = 0;
      }
      this.metrics.cls += entry.value;
    });
  }

  /**
   * مراقبة أحداث الرسم
   * @param type نوع حدث الرسم
   * @param callback دالة رد الاتصال
   */
  private observePaint(type: string, callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const po = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            callback(entries[entries.length - 1]);
          }
        });
        po.observe({ type: type, buffered: true });
      } catch (e) {
        console.error(`Error observing ${type}:`, e);
      }
    }
  }

  /**
   * مراقبة أول إدخال
   * @param callback دالة رد الاتصال
   */
  private observeFirstInput(callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const po = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            callback(entries[0]);
          }
        });
        po.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.error('Error observing first-input:', e);
      }
    }
  }

  /**
   * مراقبة تغيير التخطيط
   * @param callback دالة رد الاتصال
   */
  private observeLayoutShift(callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const po = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(callback);
        });
        po.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.error('Error observing layout-shift:', e);
      }
    }
  }

  /**
   * إرسال المقاييس إلى التحليلات
   */
  private sendMetricsToAnalytics(): void {
    // إرسال المقاييس إلى الخادم للتحليل
    this.http.post(`${environment.apiUrl}/analytics/performance`, this.metrics)
      .pipe(
        tap(() => console.log('Performance metrics sent to analytics')),
        catchError(error => {
          console.error('Error sending performance metrics:', error);
          return of(null);
        })
      )
      .subscribe();

    // تسجيل المقاييس في وحدة التحكم للتطوير
    console.log('Performance Metrics:', this.metrics);
  }

  /**
   * الحصول على مقاييس الأداء الحالية
   * @returns مقاييس الأداء
   */
  public getMetrics(): Observable<any> {
    return of(this.metrics);
  }

  /**
   * تحسين أداء First Contentful Paint
   * @param element العنصر المراد تحسينه
   */
  public optimizeFCP(element: HTMLElement): void {
    // تطبيق أنماط مضمنة لتجنب انتظار تحميل CSS
    element.style.display = 'block';
    element.style.visibility = 'visible';
  }

  /**
   * تحسين أداء Largest Contentful Paint
   * @param imageUrls مصفوفة عناوين URL للصور
   */
  public optimizeLCP(imageUrls: string[]): void {
    // تحميل الصور مسبقًا
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * تحسين أداء First Input Delay
   */
  public optimizeFID(): void {
    // تقسيم المهام الطويلة
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // تنفيذ المهام غير الحرجة خلال وقت الخمول
      });
    }
  }

  /**
   * تحسين أداء Cumulative Layout Shift
   * @param elements العناصر المراد تحسينها
   */
  public optimizeCLS(elements: HTMLElement[]): void {
    // تعيين أبعاد محددة للعناصر لتجنب تغيير التخطيط
    elements.forEach(element => {
      if (element.tagName.toLowerCase() === 'img') {
        element.setAttribute('width', element.getAttribute('width') || '100%');
        element.setAttribute('height', element.getAttribute('height') || 'auto');
      }
    });
  }

  /**
   * تحسين أداء Time to First Byte
   */
  public optimizeTTFB(): void {
    // تنفيذ في الخادم: تحسين استجابة الخادم، تخزين مؤقت، CDN
  }

  /**
   * تحسين أداء الشبكة البطيئة
   */
  public optimizeForSlowNetwork(): void {
    // اكتشاف سرعة الاتصال
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        // تحميل نسخة مخففة من التطبيق
        this.loadLightweightVersion();
      }
    }
  }

  /**
   * تحميل نسخة مخففة من التطبيق
   */
  private loadLightweightVersion(): void {
    // تعطيل الرسوم المتحركة
    document.body.classList.add('reduce-animations');
    
    // تحميل صور بجودة منخفضة
    const images = document.querySelectorAll('img[data-src-low]');
    images.forEach((img: HTMLImageElement) => {
      const lowResSrc = img.getAttribute('data-src-low');
      if (lowResSrc) {
        img.src = lowResSrc;
      }
    });
  }
}
