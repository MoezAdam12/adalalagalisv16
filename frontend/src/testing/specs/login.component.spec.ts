/**
 * login.component.spec.ts
 * اختبارات وحدة لمكون تسجيل الدخول
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from '../../app/features/auth/components/login/login.component';
import { AuthService } from '../../app/core/services/auth.service';
import { TestConfig, TestHelpers } from '../test.config';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    // إنشاء نسخ وهمية من الخدمات
    authService = TestHelpers.createMockService({
      login: jasmine.createSpy('login'),
      setAuthState: jasmine.createSpy('setAuthState')
    });
    
    router = TestHelpers.createMockService({
      navigate: jasmine.createSpy('navigate')
    });
    
    snackBar = TestHelpers.createMockService({
      open: jasmine.createSpy('open')
    });

    TestConfig.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('يجب إنشاء المكون', () => {
    expect(component).toBeTruthy();
  });

  it('يجب أن يكون نموذج تسجيل الدخول غير صالح عند البداية', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('يجب أن يكون حقل البريد الإلكتروني غير صالح إذا كان فارغًا', () => {
    const email = component.loginForm.controls['email'];
    expect(email.valid).toBeFalsy();
    expect(email.errors['required']).toBeTruthy();
  });

  it('يجب أن يكون حقل البريد الإلكتروني غير صالح إذا كان بتنسيق غير صحيح', () => {
    const email = component.loginForm.controls['email'];
    email.setValue('invalid-email');
    expect(email.valid).toBeFalsy();
    expect(email.errors['email']).toBeTruthy();
  });

  it('يجب أن يكون حقل كلمة المرور غير صالح إذا كان فارغًا', () => {
    const password = component.loginForm.controls['password'];
    expect(password.valid).toBeFalsy();
    expect(password.errors['required']).toBeTruthy();
  });

  it('يجب أن يكون نموذج تسجيل الدخول صالحًا عند إدخال بيانات صحيحة', () => {
    const email = component.loginForm.controls['email'];
    const password = component.loginForm.controls['password'];
    
    email.setValue('admin@adalalegalis.com');
    password.setValue('password123');
    
    expect(email.valid).toBeTruthy();
    expect(password.valid).toBeTruthy();
    expect(component.loginForm.valid).toBeTruthy();
  });

  it('يجب استدعاء خدمة تسجيل الدخول عند تقديم النموذج الصالح', () => {
    const email = component.loginForm.controls['email'];
    const password = component.loginForm.controls['password'];
    
    email.setValue('admin@adalalegalis.com');
    password.setValue('password123');
    
    // محاكاة استجابة ناجحة
    authService.login.and.returnValue(of({
      success: true,
      data: {
        user: { id: '1', username: 'admin', role: 'admin' },
        token: 'mock-token'
      }
    }));
    
    component.onSubmit();
    
    expect(authService.login).toHaveBeenCalledWith({
      email: 'admin@adalalegalis.com',
      password: 'password123'
    });
    
    expect(authService.setAuthState).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('يجب عرض رسالة خطأ عند فشل تسجيل الدخول', () => {
    const email = component.loginForm.controls['email'];
    const password = component.loginForm.controls['password'];
    
    email.setValue('wrong@example.com');
    password.setValue('wrongpassword');
    
    // محاكاة استجابة فاشلة
    const errorResponse = {
      error: {
        success: false,
        error: {
          message: 'بيانات الاعتماد غير صالحة',
          statusCode: 401
        }
      }
    };
    
    authService.login.and.returnValue(throwError(errorResponse));
    
    component.onSubmit();
    
    expect(authService.login).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'بيانات الاعتماد غير صالحة',
      'إغلاق',
      jasmine.any(Object)
    );
    expect(component.isLoading).toBeFalse();
  });

  it('يجب تعطيل زر تسجيل الدخول عندما يكون النموذج غير صالح', () => {
    fixture.detectChanges();
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    
    expect(submitButton.disabled).toBeTrue();
    
    // إدخال بيانات صالحة
    const email = component.loginForm.controls['email'];
    const password = component.loginForm.controls['password'];
    
    email.setValue('admin@adalalegalis.com');
    password.setValue('password123');
    
    fixture.detectChanges();
    
    expect(submitButton.disabled).toBeFalse();
  });

  it('يجب عرض مؤشر التحميل أثناء عملية تسجيل الدخول', () => {
    // إدخال بيانات صالحة
    const email = component.loginForm.controls['email'];
    const password = component.loginForm.controls['password'];
    
    email.setValue('admin@adalalegalis.com');
    password.setValue('password123');
    
    // تأخير استجابة تسجيل الدخول
    authService.login.and.returnValue(new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            user: { id: '1', username: 'admin', role: 'admin' },
            token: 'mock-token'
          }
        });
      }, 1000);
    }));
    
    component.onSubmit();
    
    expect(component.isLoading).toBeTrue();
    
    // بعد الانتهاء من تسجيل الدخول
    fixture.whenStable().then(() => {
      expect(component.isLoading).toBeFalse();
    });
  });
});
