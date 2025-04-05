/**
 * error-tracking.service.ts
 * خدمة تتبع الأخطاء وإعداد التقارير في الواجهة الأمامية
 */

import { Injectable, ErrorHandler, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * واجهة لتمثيل الخطأ المنسق
 */
export interface FormattedError {
  name: string;
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userId?: string;
  sessionId?: string;
  browser: string;
  device: string;
  os: string;
  metadata?: any;
}

/**
 * خدمة تتبع الأخطاء وإعداد التقارير
 * توفر آلية مركزية لتتبع الأخطاء وإعداد التقارير في الواجهة الأمامية
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService implements ErrorHandler {
  private readonly MAX_STORED_ERRORS = 50;
  private readonly ERROR_STORAGE_KEY = 'adalalegalis_error_log';
  private readonly SESSION_ID = this.generateSessionId();
  
  constructor(private injector: Injector) {}

  /**
   * معالجة الأخطاء المرسلة من Angular
   * @param error الخطأ المراد معالجته
   */
  handleError(error: any): void {
    try {
      // تنسيق الخطأ
      const formattedError = this.formatError(error);
      
      // تسجيل الخطأ في وحدة التحكم
      this.logErrorToConsole(formattedError);
      
      // تخزين الخطأ محليًا
      this.storeErrorLocally(formattedError);
      
      // إرسال الخطأ إلى الخادم إذا كان ذلك مناسبًا
      this.reportErrorToServer(formattedError);
      
      // عرض رسالة خطأ للمستخدم إذا كان ذلك مناسبًا
      this.showUserFriendlyError(error);
      
      // إعادة توجيه المستخدم إلى صفحة الخطأ إذا كان ذلك مناسبًا
      this.redirectToErrorPage(error);
    } catch (handlingError) {
      // في حالة حدوث خطأ أثناء معالجة الخطأ، نسجل ذلك في وحدة التحكم
      console.error('خطأ أثناء معالجة الخطأ:', handlingError);
      console.error('الخطأ الأصلي:', error);
    }
  }

  /**
   * تنسيق الخطأ إلى هيكل موحد
   * @param error الخطأ المراد تنسيقه
   * @returns الخطأ المنسق
   */
  private formatError(error: any): FormattedError {
    // استخراج معلومات الخطأ
    const name = error.name || (error instanceof HttpErrorResponse ? 'HttpErrorResponse' : 'Error');
    const message = error.message || 'حدث خطأ غير معروف';
    const stack = error.stack;
    const timestamp = new Date().toISOString();
    const url = this.getCurrentUrl();
    
    // استخراج معلومات المستخدم
    const userId = this.getUserId();
    
    // استخراج معلومات المتصفح والجهاز
    const browser = this.getBrowserInfo();
    const device = this.getDeviceInfo();
    const os = this.getOSInfo();
    
    // إضافة بيانات وصفية إضافية
    const metadata: any = {};
    
    // إضافة معلومات إضافية لأخطاء HTTP
    if (error instanceof HttpErrorResponse) {
      metadata.status = error.status;
      metadata.statusText = error.statusText;
      metadata.url = error.url;
      
      if (error.error) {
        if (typeof error.error === 'string') {
          try {
            metadata.serverError = JSON.parse(error.error);
          } catch {
            metadata.serverError = error.error;
          }
        } else {
          metadata.serverError = error.error;
        }
      }
    }
    
    return {
      name,
      message,
      stack,
      timestamp,
      url,
      userId,
      sessionId: this.SESSION_ID,
      browser,
      device,
      os,
      metadata
    };
  }

  /**
   * تسجيل الخطأ في وحدة التحكم
   * @param error الخطأ المنسق
   */
  private logErrorToConsole(error: FormattedError): void {
    if (environment.debug.enabled) {
      console.group('%c🛑 خطأ في التطبيق', 'color: #ff0000; font-weight: bold; font-size: 14px;');
      console.log(`%c${error.name}: ${error.message}`, 'color: #ff6666;');
      console.log('الوقت:', error.timestamp);
      console.log('المسار:', error.url);
      console.log('معرف الجلسة:', error.sessionId);
      
      if (error.userId) {
        console.log('معرف المستخدم:', error.userId);
      }
      
      console.log('المتصفح:', error.browser);
      console.log('الجهاز:', error.device);
      console.log('نظام التشغيل:', error.os);
      
      if (error.metadata && Object.keys(error.metadata).length > 0) {
        console.log('بيانات إضافية:', error.metadata);
      }
      
      if (error.stack) {
        console.log('تتبع المكدس:');
        console.log(error.stack);
      }
      
      console.groupEnd();
    } else {
      console.error(`${error.name}: ${error.message}`);
    }
  }

  /**
   * تخزين الخطأ محليًا
   * @param error الخطأ المنسق
   */
  private storeErrorLocally(error: FormattedError): void {
    try {
      // الحصول على الأخطاء المخزنة سابقًا
      const storedErrors = this.getStoredErrors();
      
      // إضافة الخطأ الجديد
      storedErrors.unshift(error);
      
      // الاحتفاظ فقط بالعدد المحدد من الأخطاء
      if (storedErrors.length > this.MAX_STORED_ERRORS) {
        storedErrors.length = this.MAX_STORED_ERRORS;
      }
      
      // تخزين الأخطاء المحدثة
      localStorage.setItem(this.ERROR_STORAGE_KEY, JSON.stringify(storedErrors));
    } catch (e) {
      // تجاهل أخطاء التخزين المحلي
      console.warn('فشل تخزين الخطأ محليًا:', e);
    }
  }

  /**
   * الحصول على الأخطاء المخزنة محليًا
   * @returns مصفوفة الأخطاء المخزنة
   */
  private getStoredErrors(): FormattedError[] {
    try {
      const storedErrors = localStorage.getItem(this.ERROR_STORAGE_KEY);
      return storedErrors ? JSON.parse(storedErrors) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * إرسال الخطأ إلى الخادم
   * @param error الخطأ المنسق
   */
  private reportErrorToServer(error: FormattedError): void {
    // تحقق مما إذا كان الإبلاغ عن الأخطاء مفعلًا
    if (environment.analytics.logErrors) {
      // تجاهل بعض الأخطاء غير المهمة
      if (this.shouldIgnoreError(error)) {
        return;
      }
      
      // إرسال الخطأ إلى الخادم
      // يمكن استخدام خدمة HTTP هنا لإرسال الخطأ إلى نقطة نهاية API
      // أو استخدام خدمة تتبع الأخطاء مثل Sentry أو LogRocket
      
      // مثال على إرسال الخطأ باستخدام fetch
      if (navigator.onLine) {
        const errorData = {
          ...error,
          appVersion: environment.apiVersion,
          environment: environment.production ? 'production' : environment.staging ? 'staging' : 'development'
        };
        
        // تجاهل تتبع المكدس في الإنتاج لتقليل حجم البيانات
        if (environment.production) {
          delete errorData.stack;
        }
        
        // إرسال الخطأ إلى الخادم
        fetch(`${environment.apiUrl}/errors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorData),
          // استخدام keepalive لضمان إرسال الطلب حتى إذا تم إغلاق الصفحة
          keepalive: true
        }).catch(e => {
          // تجاهل أخطاء الإرسال
          console.warn('فشل إرسال الخطأ إلى الخادم:', e);
        });
      } else {
        // تخزين الخطأ لإرساله لاحقًا عندما يكون الاتصال متاحًا
        this.queueErrorForLaterSending(error);
      }
    }
  }

  /**
   * تحديد ما إذا كان يجب تجاهل الخطأ
   * @param error الخطأ المنسق
   * @returns true إذا كان يجب تجاهل الخطأ، false خلاف ذلك
   */
  private shouldIgnoreError(error: FormattedError): boolean {
    // تجاهل أخطاء CORS
    if (error.message.includes('Access to XMLHttpRequest') && error.message.includes('has been blocked by CORS policy')) {
      return true;
    }
    
    // تجاهل أخطاء الشبكة العامة
    if (error.name === 'HttpErrorResponse' && error.message.includes('Unknown Error')) {
      return true;
    }
    
    // تجاهل أخطاء إلغاء الطلبات
    if (error.message.includes('cancelled') || error.message.includes('aborted')) {
      return true;
    }
    
    // تجاهل أخطاء الامتدادات والإضافات
    if (error.stack && (error.stack.includes('chrome-extension://') || error.stack.includes('moz-extension://'))) {
      return true;
    }
    
    return false;
  }

  /**
   * وضع الخطأ في قائمة الانتظار لإرساله لاحقًا
   * @param error الخطأ المنسق
   */
  private queueErrorForLaterSending(error: FormattedError): void {
    try {
      // الحصول على قائمة الأخطاء المنتظرة
      const queueKey = 'adalalegalis_error_queue';
      const queuedErrors = JSON.parse(localStorage.getItem(queueKey) || '[]');
      
      // إضافة الخطأ الجديد
      queuedErrors.push(error);
      
      // تخزين القائمة المحدثة
      localStorage.setItem(queueKey, JSON.stringify(queuedErrors));
      
      // إضافة مستمع لحدث الاتصال بالإنترنت لإرسال الأخطاء المنتظرة
      window.addEventListener('online', this.sendQueuedErrors.bind(this), { once: true });
    } catch (e) {
      // تجاهل أخطاء التخزين المحلي
      console.warn('فشل وضع الخطأ في قائمة الانتظار:', e);
    }
  }

  /**
   * إرسال الأخطاء المنتظرة عندما يكون الاتصال متاحًا
   */
  private sendQueuedErrors(): void {
    try {
      // الحصول على قائمة الأخطاء المنتظرة
      const queueKey = 'adalalegalis_error_queue';
      const queuedErrors = JSON.parse(localStorage.getItem(queueKey) || '[]');
      
      if (queuedErrors.length === 0) {
        return;
      }
      
      // إرسال الأخطاء المنتظرة
      const apiUrl = `${environment.apiUrl}/errors/batch`;
      
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errors: queuedErrors,
          appVersion: environment.apiVersion,
          environment: environment.production ? 'production' : environment.staging ? 'staging' : 'development'
        })
      })
      .then(response => {
        if (response.ok) {
          // مسح الأخطاء المنتظرة بعد إرسالها بنجاح
          localStorage.removeItem(queueKey);
        }
      })
      .catch(e => {
        console.warn('فشل إرسال الأخطاء المنتظرة:', e);
        // إعادة إضافة مستمع لمحاولة لاحقة
        window.addEventListener('online', this.sendQueuedErrors.bind(this), { once: true });
      });
    } catch (e) {
      console.warn('فشل معالجة الأخطاء المنتظرة:', e);
    }
  }

  /**
   * عرض رسالة خطأ صديقة للمستخدم
   * @param error الخطأ الأصلي
   */
  private showUserFriendlyError(error: any): void {
    // الحصول على خدمة الإشعارات
    try {
      // يمكن استخدام خدمة الإشعارات هنا لعرض رسالة خطأ للمستخدم
      // مثال: this.injector.get(NotificationService).showError(message);
      
      // تحديد ما إذا كان يجب عرض الخطأ للمستخدم
      if (this.shouldShowErrorToUser(error)) {
        let message = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        
        // تخصيص الرسالة بناءً على نوع الخطأ
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 0:
              message = 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
              break;
            case 400:
              message = 'طلب غير صالح. يرجى التحقق من البيانات المدخلة.';
              break;
            case 401:
              message = 'جلستك انتهت. يرجى تسجيل الدخول مرة أخرى.';
              break;
            case 403:
              message = 'ليس لديك صلاحية للوصول إلى هذا المورد.';
              break;
            case 404:
              message = 'المورد المطلوب غير موجود.';
              break;
            case 500:
              message = 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقًا.';
              break;
            default:
              if (error.error && error.error.message) {
                message = error.error.message;
              }
          }
        }
        
        // عرض الرسالة للمستخدم
        // مثال: this.injector.get(NotificationService).showError(message);
        console.warn('رسالة الخطأ للمستخدم:', message);
      }
    } catch (e) {
      // تجاهل أخطاء عرض الإشعارات
      console.warn('فشل عرض رسالة الخطأ للمستخدم:', e);
    }
  }

  /**
   * تحديد ما إذا كان يجب عرض الخطأ للمستخدم
   * @param error الخطأ الأصلي
   * @returns true إذا كان يجب عرض الخطأ للمستخدم، false خلاف ذلك
   */
  private shouldShowErrorToUser(error: any): boolean {
    // عرض أخطاء HTTP للمستخدم
    if (error instanceof HttpErrorResponse) {
      // تجاهل أخطاء إلغاء الطلبات
      if (error.name === 'HttpErrorResponse' && error.message.includes('cancelled')) {
        return false;
      }
      
      // عرض أخطاء الخادم والمصادقة
      return true;
    }
    
    // تجاهل أخطاء التطبيق الداخلية في الإنتاج
    if (environment.production) {
      return false;
    }
    
    // عرض جميع الأخطاء في بيئة التطوير
    return true;
  }

  /**
   * إعادة توجيه المستخدم إلى صفحة الخطأ
   * @param error الخطأ الأصلي
   */
  private redirectToErrorPage(error: any): void {
    // تحديد ما إذا كان يجب إعادة التوجيه
    if (this.shouldRedirectToErrorPage(error)) {
      try {
        const router = this.injector.get(Router);
        
        // تحديد صفحة الخطأ المناسبة
        let errorRoute = '/error';
        
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 401:
              errorRoute = '/auth/login';
              break;
            case 403:
              errorRoute = '/error/forbidden';
              break;
            case 404:
              errorRoute = '/error/not-found';
              break;
            case 500:
              errorRoute = '/error/server';
              break;
          }
        }
        
        // إعادة التوجيه إلى صفحة الخطأ
        router.navigate([errorRoute], {
          queryParams: {
            errorId: this.SESSION_ID,
            timestamp: new Date().getTime()
          }
        });
      } catch (e) {
        // تجاهل أخطاء إعادة التوجيه
        console.warn('فشل إعادة التوجيه إلى صفحة الخطأ:', e);
      }
    }
  }

  /**
   * تحديد ما إذا كان يجب إعادة التوجيه إلى صفحة الخطأ
   * @param error الخطأ الأصلي
   * @returns true إذا كان يجب إعادة التوجيه، false خلاف ذلك
   */
  private shouldRedirectToErrorPage(error: any): boolean {
    // إعادة التوجيه فقط لأخطاء HTTP الحرجة
    if (error instanceof HttpErrorResponse) {
      // إعادة التوجيه لأخطاء المصادقة والصلاحيات
      if (error.status === 401 || error.status === 403) {
        return true;
      }
      
      // إعادة التوجيه لأخطاء الخادم الحرجة
      if (error.status === 500 || error.status === 503) {
        return true;
      }
    }
    
    // لا إعادة توجيه للأخطاء الأخرى
    return false;
  }

  /**
   * الحصول على المسار الحالي
   * @returns المسار الحالي
   */
  private getCurrentUrl(): string {
    return window.location.href;
  }

  /**
   * الحصول على معرف المستخدم
   * @returns معرف المستخدم إذا كان متاحًا
   */
  private getUserId(): string | undefined {
    try {
      // يمكن استخدام خدمة المصادقة هنا للحصول على معرف المستخدم
      // مثال: return this.injector.get(AuthService).getUserId();
      
      // بديل: محاولة الحصول على معرف المستخدم من التخزين المحلي
      const userDataStr = localStorage.getItem('adalalegalis_user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.id;
      }
    } catch (e) {
      // تجاهل أخطاء الحصول على معرف المستخدم
    }
    
    return undefined;
  }

  /**
   * الحصول على معلومات المتصفح
   * @returns معلومات المتصفح
   */
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    let browser = 'غير معروف';
    
    if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
      browser = 'Samsung Browser';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browser = 'Opera';
    } else if (userAgent.indexOf('Trident') > -1) {
      browser = 'Internet Explorer';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge (Legacy)';
    } else if (userAgent.indexOf('Edg') > -1) {
      browser = 'Edge (Chromium)';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
    }
    
    return browser;
  }

  /**
   * الحصول على معلومات الجهاز
   * @returns معلومات الجهاز
   */
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    
    if (/iPad/.test(userAgent)) {
      return 'iPad';
    } else if (/iPhone/.test(userAgent)) {
      return 'iPhone';
    } else if (/Android/.test(userAgent)) {
      return 'Android';
    } else if (/Windows Phone/.test(userAgent)) {
      return 'Windows Phone';
    } else if (/Windows/.test(userAgent)) {
      return 'Desktop (Windows)';
    } else if (/Macintosh/.test(userAgent)) {
      return 'Desktop (Mac)';
    } else if (/Linux/.test(userAgent)) {
      return 'Desktop (Linux)';
    }
    
    return 'غير معروف';
  }

  /**
   * الحصول على معلومات نظام التشغيل
   * @returns معلومات نظام التشغيل
   */
  private getOSInfo(): string {
    const userAgent = navigator.userAgent;
    let os = 'غير معروف';
    
    if (/Windows NT 10.0/.test(userAgent)) {
      os = 'Windows 10';
    } else if (/Windows NT 6.3/.test(userAgent)) {
      os = 'Windows 8.1';
    } else if (/Windows NT 6.2/.test(userAgent)) {
      os = 'Windows 8';
    } else if (/Windows NT 6.1/.test(userAgent)) {
      os = 'Windows 7';
    } else if (/Windows NT 6.0/.test(userAgent)) {
      os = 'Windows Vista';
    } else if (/Windows NT 5.1/.test(userAgent)) {
      os = 'Windows XP';
    } else if (/Windows/.test(userAgent)) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
      os = 'iOS';
    } else if (/Mac/.test(userAgent)) {
      os = 'macOS';
    } else if (/Linux/.test(userAgent)) {
      os = 'Linux';
    }
    
    return os;
  }

  /**
   * إنشاء معرف جلسة فريد
   * @returns معرف الجلسة
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * الحصول على الأخطاء المخزنة
   * @returns مصفوفة الأخطاء المخزنة
   */
  getErrors(): FormattedError[] {
    return this.getStoredErrors();
  }

  /**
   * مسح الأخطاء المخزنة
   */
  clearErrors(): void {
    localStorage.removeItem(this.ERROR_STORAGE_KEY);
  }
}
