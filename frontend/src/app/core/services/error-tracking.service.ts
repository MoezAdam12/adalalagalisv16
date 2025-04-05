/**
 * @file error-tracking.service.ts
 * @description خدمة تتبع الأخطاء والإبلاغ عنها
 * توفر هذه الخدمة آلية لتتبع الأخطاء والإبلاغ عنها ومراقبتها
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import * as Sentry from '@sentry/angular';
import { BrowserTracing } from '@sentry/tracing';

/**
 * واجهة تقرير الخطأ
 */
export interface ErrorReport {
  type: string;
  message: string;
  stack?: string;
  context?: any;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

/**
 * خدمة تتبع الأخطاء
 * توفر آلية لتتبع الأخطاء والإبلاغ عنها ومراقبتها
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  
  // ما إذا كان تتبع الأخطاء مهيأ
  private initialized = false;
  
  constructor(private http: HttpClient) {
    this.initErrorTracking();
  }
  
  /**
   * تهيئة تتبع الأخطاء
   */
  initErrorTracking(): void {
    if (this.initialized) {
      return;
    }
    
    // تهيئة Sentry إذا كان مكوناً
    if (environment.integrations.sentryDsn) {
      Sentry.init({
        dsn: environment.integrations.sentryDsn,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1.0,
        environment: environment.production ? 'production' : environment.staging ? 'staging' : 'development',
        
        // لا ترسل معلومات المستخدم في بيئة التطوير
        beforeSend: (event) => {
          if (!environment.production && !environment.staging) {
            delete event.user;
          }
          return event;
        }
      });
      
      this.initialized = true;
    }
  }
  
  /**
   * تعيين معلومات المستخدم لتتبع الأخطاء
   * @param userId معرف المستخدم
   * @param username اسم المستخدم
   * @param email بريد المستخدم الإلكتروني
   */
  setUserContext(userId: string, username?: string, email?: string): void {
    if (environment.integrations.sentryDsn) {
      Sentry.setUser({
        id: userId,
        username,
        email
      });
    }
  }
  
  /**
   * مسح معلومات المستخدم
   */
  clearUserContext(): void {
    if (environment.integrations.sentryDsn) {
      Sentry.setUser(null);
    }
  }
  
  /**
   * تعيين سياق إضافي لتتبع الأخطاء
   * @param name اسم السياق
   * @param context بيانات السياق
   */
  setExtraContext(name: string, context: any): void {
    if (environment.integrations.sentryDsn) {
      Sentry.setExtra(name, context);
    }
  }
  
  /**
   * تعيين علامة لتتبع الأخطاء
   * @param name اسم العلامة
   * @param value قيمة العلامة
   */
  setTag(name: string, value: string): void {
    if (environment.integrations.sentryDsn) {
      Sentry.setTag(name, value);
    }
  }
  
  /**
   * الإبلاغ عن خطأ
   * @param error الخطأ المراد الإبلاغ عنه
   * @param context سياق إضافي للخطأ
   */
  captureException(error: Error, context?: any): void {
    if (environment.integrations.sentryDsn) {
      Sentry.withScope(scope => {
        if (context) {
          Object.keys(context).forEach(key => {
            scope.setExtra(key, context[key]);
          });
        }
        Sentry.captureException(error);
      });
    }
    
    // تسجيل الخطأ في وحدة التحكم
    console.error('[ErrorTracking] Error captured:', error, context);
    
    // إرسال الخطأ إلى الخادم إذا كان في بيئة الإنتاج
    if (environment.production) {
      this.sendErrorToServer({
        type: error.name,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  }
  
  /**
   * الإبلاغ عن رسالة
   * @param message الرسالة المراد الإبلاغ عنها
   * @param level مستوى الرسالة
   * @param context سياق إضافي للرسالة
   */
  captureMessage(message: string, level: Sentry.Severity = Sentry.Severity.Info, context?: any): void {
    if (environment.integrations.sentryDsn) {
      Sentry.withScope(scope => {
        scope.setLevel(level);
        if (context) {
          Object.keys(context).forEach(key => {
            scope.setExtra(key, context[key]);
          });
        }
        Sentry.captureMessage(message);
      });
    }
    
    // تسجيل الرسالة في وحدة التحكم
    console.log(`[ErrorTracking] Message captured (${level}):`, message, context);
  }
  
  /**
   * بدء تتبع أداء
   * @param name اسم التتبع
   * @param operation نوع العملية
   * @returns معرف التتبع
   */
  startPerformanceTracking(name: string, operation?: string): string {
    if (environment.integrations.sentryDsn) {
      const transaction = Sentry.startTransaction({
        name,
        op: operation || 'default'
      });
      
      return transaction.traceId;
    }
    
    return '';
  }
  
  /**
   * إنهاء تتبع أداء
   * @param traceId معرف التتبع
   * @param status حالة التتبع
   */
  finishPerformanceTracking(traceId: string, status: string = 'ok'): void {
    if (environment.integrations.sentryDsn && traceId) {
      const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
      
      if (transaction && transaction.traceId === traceId) {
        transaction.setStatus(status);
        transaction.finish();
      }
    }
  }
  
  /**
   * إرسال خطأ إلى الخادم
   * @param report تقرير الخطأ
   * @returns Observable مع استجابة الخادم
   */
  private sendErrorToServer(report: ErrorReport): Observable<any> {
    return this.http.post(`${environment.apiUrl}/${environment.apiVersion}/errors/report`, report);
  }
  
  /**
   * الحصول على قائمة الأخطاء المسجلة
   * @param limit عدد الأخطاء المراد استرجاعها
   * @param offset موضع البداية
   * @returns Observable مع قائمة الأخطاء
   */
  getErrorLogs(limit: number = 10, offset: number = 0): Observable<any> {
    return this.http.get(`${environment.apiUrl}/${environment.apiVersion}/errors/logs`, {
      params: {
        limit: limit.toString(),
        offset: offset.toString()
      }
    });
  }
  
  /**
   * الحصول على إحصائيات الأخطاء
   * @param startDate تاريخ البداية
   * @param endDate تاريخ النهاية
   * @returns Observable مع إحصائيات الأخطاء
   */
  getErrorStats(startDate?: Date, endDate?: Date): Observable<any> {
    const params: any = {};
    
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    
    if (endDate) {
      params.endDate = endDate.toISOString();
    }
    
    return this.http.get(`${environment.apiUrl}/${environment.apiVersion}/errors/stats`, {
      params
    });
  }
}
