import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';
import { BaseService } from './base.service';
import { HttpRepository } from '../repositories/http.repository';
import { User } from '../models/user.model';
import { ErrorHandlingService } from './error-handling.service';

/**
 * خدمة المستخدم
 * توفر منطق الأعمال للتعامل مع المستخدمين
 */
@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService<User> {
  /**
   * إنشاء نسخة من خدمة المستخدم
   * @param http خدمة HttpClient
   * @param errorService خدمة معالجة الأخطاء
   */
  constructor(
    http: HttpClient,
    private errorService: ErrorHandlingService
  ) {
    // إنشاء مستودع HTTP للمستخدمين
    const repository = new HttpRepository<User>(http, '/api/users');
    super(repository);
  }

  /**
   * الحصول على المستخدمين النشطين
   * @returns تدفق رصدي يحتوي على مصفوفة من المستخدمين النشطين
   */
  getActiveUsers(): Observable<User[]> {
    return this.repository.search({ status: 'active' }).pipe(
      catchError(error => {
        this.errorService.handleHttpError(error);
        throw error;
      })
    );
  }

  /**
   * الحصول على المستخدمين حسب الدور
   * @param roleId معرف الدور
   * @returns تدفق رصدي يحتوي على مصفوفة من المستخدمين
   */
  getUsersByRole(roleId: number | string): Observable<User[]> {
    return this.repository.search({ roleId }).pipe(
      catchError(error => {
        this.errorService.handleHttpError(error);
        throw error;
      })
    );
  }

  /**
   * تغيير كلمة مرور المستخدم
   * @param userId معرف المستخدم
   * @param currentPassword كلمة المرور الحالية
   * @param newPassword كلمة المرور الجديدة
   * @returns تدفق رصدي يحتوي على نتيجة العملية
   */
  changePassword(userId: number | string, currentPassword: string, newPassword: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`/api/users/${userId}/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      map(response => response.success),
      catchError(error => {
        this.errorService.handleHttpError(error);
        throw error;
      })
    );
  }

  /**
   * تحديث حالة المستخدم
   * @param userId معرف المستخدم
   * @param status الحالة الجديدة
   * @returns تدفق رصدي يحتوي على المستخدم المحدث
   */
  updateUserStatus(userId: number | string, status: 'active' | 'inactive' | 'suspended'): Observable<User> {
    return this.update(userId, { status }).pipe(
      tap(user => {
        // يمكن إضافة منطق إضافي هنا مثل تسجيل تغيير الحالة
        console.log(`تم تحديث حالة المستخدم ${userId} إلى ${status}`);
      }),
      catchError(error => {
        this.errorService.handleHttpError(error);
        throw error;
      })
    );
  }

  /**
   * تعيين أدوار للمستخدم
   * @param userId معرف المستخدم
   * @param roleIds مصفوفة من معرفات الأدوار
   * @returns تدفق رصدي يحتوي على المستخدم المحدث
   */
  assignRoles(userId: number | string, roleIds: (number | string)[]): Observable<User> {
    return this.http.post<User>(`/api/users/${userId}/roles`, { roleIds }).pipe(
      catchError(error => {
        this.errorService.handleHttpError(error);
        throw error;
      })
    );
  }

  /**
   * التحقق من وجود اسم المستخدم
   * @param username اسم المستخدم
   * @returns تدفق رصدي يحتوي على قيمة منطقية تشير إلى وجود اسم المستخدم
   */
  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<{ exists: boolean }>(`/api/users/check-username`, {
      params: { username }
    }).pipe(
      map(response => response.exists),
      catchError(error => {
        this.errorService.handleHttpError(error);
        throw error;
      })
    );
  }

  /**
   * التحقق من وجود البريد الإلكتروني
   * @param email البريد الإلكتروني
   * @returns تدفق رصدي يحتوي على قيمة منطقية تشير إلى وجود البريد الإلكتروني
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<{ exists: boolean }>(`/api/users/check-email`, {
      params: { email }
    }).pipe(
      map(response => response.exists),
      catchError(error => {
        this.errorService.handleHttpError(error);
        throw error;
      })
    );
  }
}
