/**
 * @file error-handler.service.ts
 * @description خدمة معالجة الأخطاء للواجهة الأمامية
 * توفر هذه الخدمة آلية موحدة لمعالجة الأخطاء وإدارتها في جميع أنحاء التطبيق
 */

import { Injectable, ErrorHandler, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import * as Sentry from '@sentry/angular';
import { NotificationService } from './notification.service';

/**
 * واجهة خطأ التطبيق
 */
export interface AppError {
  name: string;
  message: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
  requestId?: string;
}

/**
 * أنواع الأخطاء المعرفة في التطبيق
 */
export enum ErrorTypes {
  VALIDATION = 'ValidationError',
  AUTHENTICATION = 'AuthenticationError',
  AUTHORIZATION = 'AuthorizationError',
  NOT_FOUND = 'NotFoundError',
  CONFLICT = 'ConflictError',
  INTERNAL = 'InternalError',
  EXTERNAL_SERVICE = 'ExternalServiceError',
  NETWORK = 'NetworkError',
  CLIENT = 'ClientError',
  UNKNOWN = 'UnknownError'
}

/**
 * خدمة معالجة الأخطاء
 * توفر آلية موحدة لمعالجة الأخطاء وإدارتها في جميع أنحاء التطبيق
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  
  constructor(private injector: Injector) {}
  
  /**
   * معالجة الخطأ
   * @param error الخطأ المراد معالجته
   */
  handleError(error: any): void {
    // تحويل الخطأ إلى خطأ التطبيق
    const appError = this.normalizeError(error);
    
    // تسجيل الخطأ
    this.logError(appError);
    
    // إرسال إشعار للمستخدم
    this.notifyUser(appError);
    
    // إعادة توجيه المستخدم إذا لزم الأمر
    this.redirectIfNeeded(appError);
  }
  
  /**
   * تحويل الخطأ إلى خطأ التطبيق
   * @param error الخطأ الأصلي
   * @returns خطأ التطبيق
   */
  private normalizeError(error: any): AppError {
    // إذا كان الخطأ من نوع HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      // إذا كان الخطأ من الخادم ويحتوي على بنية خطأ التطبيق
      if (error.error && error.error.code && error.error.message) {
        return {
          name: error.error.code,
          message: error.error.message,
          statusCode: error.status,
          details: error.error.details,
          timestamp: new Date().toISOString(),
          requestId: error.error.requestId
        };
      }
      
      // إذا كان خطأ شبكة
      if (!navigator.onLine || error.status === 0) {
        return {
          name: ErrorTypes.NETWORK,
          message: 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.',
          statusCode: 0,
          timestamp: new Date().toISOString()
        };
      }
      
      // خطأ HTTP آخر
      return {
        name: this.getErrorTypeFromStatus(error.status),
        message: error.message || 'حدث خطأ أثناء الاتصال بالخادم.',
        statusCode: error.status,
        details: error.error,
        timestamp: new Date().toISOString()
      };
    }
    
    // إذا كان الخطأ من نوع Error
    if (error instanceof Error) {
      return {
        name: error.name || ErrorTypes.UNKNOWN,
        message: error.message || 'حدث خطأ غير معروف.',
        timestamp: new Date().toISOString(),
        details: error.stack
      };
    }
    
    // إذا كان الخطأ من نوع string
    if (typeof error === 'string') {
      return {
        name: ErrorTypes.UNKNOWN,
        message: error,
        timestamp: new Date().toISOString()
      };
    }
    
    // إذا كان الخطأ من نوع آخر
    return {
      name: ErrorTypes.UNKNOWN,
      message: 'حدث خطأ غير معروف.',
      timestamp: new Date().toISOString(),
      details: error
    };
  }
  
  /**
   * الحصول على نوع الخطأ من رمز الحالة HTTP
   * @param status رمز الحالة HTTP
   * @returns نوع الخطأ
   */
  private getErrorTypeFromStatus(status: number): ErrorTypes {
    switch (status) {
      case 400:
        return ErrorTypes.VALIDATION;
      case 401:
        return ErrorTypes.AUTHENTICATION;
      case 403:
        return ErrorTypes.AUTHORIZATION;
      case 404:
        return ErrorTypes.NOT_FOUND;
      case 409:
        return ErrorTypes.CONFLICT;
      case 500:
        return ErrorTypes.INTERNAL;
      case 502:
      case 503:
      case 504:
        return ErrorTypes.EXTERNAL_SERVICE;
      default:
        return status >= 400 && status < 500 ? ErrorTypes.CLIENT : ErrorTypes.INTERNAL;
    }
  }
  
  /**
   * تسجيل الخطأ
   * @param error خطأ التطبيق
   */
  private logError(error: AppError): void {
    // تسجيل الخطأ في وحدة التحكم
    console.error('[ErrorHandler]', error);
    
    // تسجيل الخطأ في Sentry إذا كان مكوناً
    if (environment.integrations.sentryDsn && this.shouldReportToSentry(error)) {
      Sentry.captureException(error);
    }
  }
  
  /**
   * التحقق مما إذا كان يجب الإبلاغ عن الخطأ إلى Sentry
   * @param error خطأ التطبيق
   * @returns ما إذا كان يجب الإبلاغ عن الخطأ
   */
  private shouldReportToSentry(error: AppError): boolean {
    // لا تبلغ عن أخطاء المصادقة أو التفويض أو التحقق من الصحة
    if (
      error.name === ErrorTypes.AUTHENTICATION ||
      error.name === ErrorTypes.AUTHORIZATION ||
      error.name === ErrorTypes.VALIDATION
    ) {
      return false;
    }
    
    // لا تبلغ عن أخطاء الشبكة في بيئة التطوير
    if (error.name === ErrorTypes.NETWORK && !environment.production) {
      return false;
    }
    
    // الإبلاغ عن جميع الأخطاء الأخرى
    return true;
  }
  
  /**
   * إرسال إشعار للمستخدم
   * @param error خطأ التطبيق
   */
  private notifyUser(error: AppError): void {
    // الحصول على خدمة الإشعارات
    const notificationService = this.injector.get(NotificationService);
    
    // تحديد نوع الإشعار
    let notificationType: 'error' | 'warning' | 'info' = 'error';
    
    // تحديد ما إذا كان يجب إظهار الإشعار
    let shouldNotify = true;
    
    // تخصيص الإشعار بناءً على نوع الخطأ
    switch (error.name) {
      case ErrorTypes.VALIDATION:
        notificationType = 'warning';
        break;
      case ErrorTypes.AUTHENTICATION:
        // لا تظهر إشعارًا للمصادقة إذا كان المستخدم في صفحة تسجيل الدخول
        const router = this.injector.get(Router);
        if (router.url.includes('/login')) {
          shouldNotify = false;
        }
        break;
      case ErrorTypes.NETWORK:
        // إظهار إشعار مختلف لأخطاء الشبكة
        notificationService.showNotification({
          type: 'warning',
          message: 'لا يمكن الاتصال بالخادم',
          description: 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
          duration: 0 // إظهار حتى يتم إغلاقه يدويًا
        });
        shouldNotify = false;
        break;
    }
    
    // إظهار الإشعار إذا كان مطلوبًا
    if (shouldNotify) {
      notificationService.showNotification({
        type: notificationType,
        message: this.getErrorTitle(error),
        description: this.getErrorMessage(error),
        duration: 5000
      });
    }
  }
  
  /**
   * الحصول على عنوان الخطأ
   * @param error خطأ التطبيق
   * @returns عنوان الخطأ
   */
  private getErrorTitle(error: AppError): string {
    switch (error.name) {
      case ErrorTypes.VALIDATION:
        return 'خطأ في التحقق من صحة البيانات';
      case ErrorTypes.AUTHENTICATION:
        return 'خطأ في المصادقة';
      case ErrorTypes.AUTHORIZATION:
        return 'خطأ في التفويض';
      case ErrorTypes.NOT_FOUND:
        return 'لم يتم العثور على المورد';
      case ErrorTypes.CONFLICT:
        return 'تعارض في البيانات';
      case ErrorTypes.INTERNAL:
        return 'خطأ داخلي';
      case ErrorTypes.EXTERNAL_SERVICE:
        return 'خطأ في الخدمة الخارجية';
      case ErrorTypes.NETWORK:
        return 'خطأ في الشبكة';
      case ErrorTypes.CLIENT:
        return 'خطأ في العميل';
      default:
        return 'خطأ';
    }
  }
  
  /**
   * الحصول على رسالة الخطأ
   * @param error خطأ التطبيق
   * @returns رسالة الخطأ
   */
  private getErrorMessage(error: AppError): string {
    // إذا كان الخطأ يحتوي على رسالة، استخدمها
    if (error.message) {
      return error.message;
    }
    
    // إذا لم يكن هناك رسالة، استخدم رسالة افتراضية بناءً على نوع الخطأ
    switch (error.name) {
      case ErrorTypes.VALIDATION:
        return 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.';
      case ErrorTypes.AUTHENTICATION:
        return 'يرجى تسجيل الدخول مرة أخرى.';
      case ErrorTypes.AUTHORIZATION:
        return 'ليس لديك صلاحية للوصول إلى هذا المورد.';
      case ErrorTypes.NOT_FOUND:
        return 'لم يتم العثور على المورد المطلوب.';
      case ErrorTypes.CONFLICT:
        return 'هناك تعارض في البيانات. يرجى تحديث البيانات والمحاولة مرة أخرى.';
      case ErrorTypes.INTERNAL:
        return 'حدث خطأ داخلي. يرجى المحاولة مرة أخرى لاحقًا.';
      case ErrorTypes.EXTERNAL_SERVICE:
        return 'حدث خطأ في الخدمة الخارجية. يرجى المحاولة مرة أخرى لاحقًا.';
      case ErrorTypes.NETWORK:
        return 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
      case ErrorTypes.CLIENT:
        return 'حدث خطأ في التطبيق. يرجى تحديث الصفحة والمحاولة مرة أخرى.';
      default:
        return 'حدث خطأ غير معروف. يرجى المحاولة مرة أخرى لاحقًا.';
    }
  }
  
  /**
   * إعادة توجيه المستخدم إذا لزم الأمر
   * @param error خطأ التطبيق
   */
  private redirectIfNeeded(error: AppError): void {
    const router = this.injector.get(Router);
    
    // إعادة توجيه المستخدم بناءً على نوع الخطأ
    switch (error.name) {
      case ErrorTypes.AUTHENTICATION:
        // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول إذا لم يكن بالفعل هناك
        if (!router.url.includes('/login')) {
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url }
          });
        }
        break;
      case ErrorTypes.AUTHORIZATION:
        // إعادة توجيه المستخدم إلى صفحة غير مصرح بها
        router.navigate(['/unauthorized']);
        break;
      case ErrorTypes.NOT_FOUND:
        // إعادة توجيه المستخدم إلى صفحة غير موجودة
        router.navigate(['/not-found']);
        break;
      case ErrorTypes.INTERNAL:
      case ErrorTypes.EXTERNAL_SERVICE:
        // إعادة توجيه المستخدم إلى صفحة خطأ إذا كان الخطأ خطيرًا
        if (error.statusCode === 500) {
          router.navigate(['/error']);
        }
        break;
    }
  }
}

/**
 * مزود خدمة معالجة الأخطاء
 */
export const errorHandlerProvider = {
  provide: ErrorHandler,
  useClass: ErrorHandlerService
};
