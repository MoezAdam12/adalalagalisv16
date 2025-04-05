import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, tap } from 'rxjs';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { BaseFacade } from './base.facade';
import { ErrorHandlingService } from '../services/error-handling.service';

/**
 * واجهة المستخدم
 * توفر واجهة بسيطة للتفاعل مع خدمة المستخدم
 */
@Injectable({
  providedIn: 'root'
})
export class UserFacade extends BaseFacade<User> {
  /**
   * موضوع سلوكي لتخزين المستخدمين النشطين
   */
  private activeUsers$ = new BehaviorSubject<User[]>([]);
  
  /**
   * موضوع سلوكي لتخزين المستخدمين حسب الدور
   */
  private usersByRole$ = new BehaviorSubject<{ [roleId: string]: User[] }>({});

  /**
   * إنشاء نسخة من واجهة المستخدم
   * @param userService خدمة المستخدم
   * @param errorService خدمة معالجة الأخطاء
   */
  constructor(
    private userService: UserService,
    private errorService: ErrorHandlingService
  ) {
    super();
  }

  /**
   * تحميل جميع المستخدمين
   */
  loadAll(): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.getAll().pipe(
      tap(users => this.entities$.next(users)),
      catchError(error => {
        this.setError('حدث خطأ أثناء تحميل المستخدمين');
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * تحميل مستخدم بواسطة المعرف
   * @param id معرف المستخدم
   */
  loadById(id: number | string): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.getById(id).pipe(
      tap(user => this.selectedEntity$.next(user)),
      catchError(error => {
        this.setError(`حدث خطأ أثناء تحميل المستخدم رقم ${id}`);
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * إنشاء مستخدم جديد
   * @param user المستخدم المراد إنشاؤه
   */
  create(user: Partial<User>): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.create(user).pipe(
      tap(newUser => {
        const currentUsers = this.entities$.getValue();
        this.entities$.next([...currentUsers, newUser]);
        this.selectedEntity$.next(newUser);
        this.errorService.showSuccessMessage('تم إنشاء المستخدم بنجاح');
      }),
      catchError(error => {
        this.setError('حدث خطأ أثناء إنشاء المستخدم');
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * تحديث مستخدم موجود
   * @param id معرف المستخدم
   * @param user المستخدم المحدث
   */
  update(id: number | string, user: Partial<User>): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.update(id, user).pipe(
      tap(updatedUser => {
        const currentUsers = this.entities$.getValue();
        const index = currentUsers.findIndex(u => u.id === id);
        
        if (index !== -1) {
          const updatedUsers = [...currentUsers];
          updatedUsers[index] = updatedUser;
          this.entities$.next(updatedUsers);
        }
        
        if (this.selectedEntity$.getValue()?.id === id) {
          this.selectedEntity$.next(updatedUser);
        }
        
        this.errorService.showSuccessMessage('تم تحديث المستخدم بنجاح');
      }),
      catchError(error => {
        this.setError(`حدث خطأ أثناء تحديث المستخدم رقم ${id}`);
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * حذف مستخدم
   * @param id معرف المستخدم
   */
  delete(id: number | string): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.delete(id).pipe(
      tap(success => {
        if (success) {
          const currentUsers = this.entities$.getValue();
          this.entities$.next(currentUsers.filter(u => u.id !== id));
          
          if (this.selectedEntity$.getValue()?.id === id) {
            this.selectedEntity$.next(null);
          }
          
          this.errorService.showSuccessMessage('تم حذف المستخدم بنجاح');
        } else {
          this.setError(`فشل حذف المستخدم رقم ${id}`);
        }
      }),
      catchError(error => {
        this.setError(`حدث خطأ أثناء حذف المستخدم رقم ${id}`);
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * تحميل المستخدمين النشطين
   */
  loadActiveUsers(): void {
    this.setLoading(true);
    
    this.userService.getActiveUsers().pipe(
      tap(users => this.activeUsers$.next(users)),
      catchError(error => {
        this.setError('حدث خطأ أثناء تحميل المستخدمين النشطين');
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * الحصول على تدفق رصدي للمستخدمين النشطين
   * @returns تدفق رصدي يحتوي على مصفوفة من المستخدمين النشطين
   */
  getActiveUsers(): Observable<User[]> {
    return this.activeUsers$.asObservable();
  }

  /**
   * تحميل المستخدمين حسب الدور
   * @param roleId معرف الدور
   */
  loadUsersByRole(roleId: number | string): void {
    this.setLoading(true);
    
    this.userService.getUsersByRole(roleId).pipe(
      tap(users => {
        const currentUsersByRole = this.usersByRole$.getValue();
        this.usersByRole$.next({
          ...currentUsersByRole,
          [roleId.toString()]: users
        });
      }),
      catchError(error => {
        this.setError(`حدث خطأ أثناء تحميل المستخدمين للدور رقم ${roleId}`);
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * الحصول على تدفق رصدي للمستخدمين حسب الدور
   * @param roleId معرف الدور
   * @returns تدفق رصدي يحتوي على مصفوفة من المستخدمين
   */
  getUsersByRole(roleId: number | string): Observable<User[]> {
    return new Observable<User[]>(observer => {
      const subscription = this.usersByRole$.subscribe(usersByRole => {
        const roleIdStr = roleId.toString();
        observer.next(usersByRole[roleIdStr] || []);
      });
      
      return () => subscription.unsubscribe();
    });
  }

  /**
   * تغيير كلمة مرور المستخدم
   * @param userId معرف المستخدم
   * @param currentPassword كلمة المرور الحالية
   * @param newPassword كلمة المرور الجديدة
   */
  changePassword(userId: number | string, currentPassword: string, newPassword: string): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.changePassword(userId, currentPassword, newPassword).pipe(
      tap(success => {
        if (success) {
          this.errorService.showSuccessMessage('تم تغيير كلمة المرور بنجاح');
        } else {
          this.setError('فشل تغيير كلمة المرور');
        }
      }),
      catchError(error => {
        this.setError('حدث خطأ أثناء تغيير كلمة المرور');
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * تحديث حالة المستخدم
   * @param userId معرف المستخدم
   * @param status الحالة الجديدة
   */
  updateUserStatus(userId: number | string, status: 'active' | 'inactive' | 'suspended'): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.updateUserStatus(userId, status).pipe(
      tap(updatedUser => {
        const currentUsers = this.entities$.getValue();
        const index = currentUsers.findIndex(u => u.id === userId);
        
        if (index !== -1) {
          const updatedUsers = [...currentUsers];
          updatedUsers[index] = updatedUser;
          this.entities$.next(updatedUsers);
        }
        
        if (this.selectedEntity$.getValue()?.id === userId) {
          this.selectedEntity$.next(updatedUser);
        }
        
        this.errorService.showSuccessMessage(`تم تحديث حالة المستخدم إلى ${status} بنجاح`);
      }),
      catchError(error => {
        this.setError(`حدث خطأ أثناء تحديث حالة المستخدم رقم ${userId}`);
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  /**
   * تعيين أدوار للمستخدم
   * @param userId معرف المستخدم
   * @param roleIds مصفوفة من معرفات الأدوار
   */
  assignRoles(userId: number | string, roleIds: (number | string)[]): void {
    this.setLoading(true);
    this.setError(null);
    
    this.userService.assignRoles(userId, roleIds).pipe(
      tap(updatedUser => {
        const currentUsers = this.entities$.getValue();
        const index = currentUsers.findIndex(u => u.id === userId);
        
        if (index !== -1) {
          const updatedUsers = [...currentUsers];
          updatedUsers[index] = updatedUser;
          this.entities$.next(updatedUsers);
        }
        
        if (this.selectedEntity$.getValue()?.id === userId) {
          this.selectedEntity$.next(updatedUser);
        }
        
        this.errorService.showSuccessMessage('تم تعيين الأدوار للمستخدم بنجاح');
      }),
      catchError(error => {
        this.setError(`حدث خطأ أثناء تعيين الأدوار للمستخدم رقم ${userId}`);
        this.errorService.handleError(error);
        throw error;
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }
}
