import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

/**
 * اختبارات خدمة المصادقة
 */
describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    // إنشاء تجسس على التوجيه
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // إنشاء تجسس على التخزين المحلي
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem']);
    
    // تعيين سلوك getItem
    localStorageSpy.getItem.and.returnValue(null); // افتراضيًا، لا توجد بيانات محفوظة
    
    // استبدال localStorage بالتجسس
    spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(localStorageSpy.removeItem);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  // التنظيف بعد كل اختبار
  afterEach(() => {
    httpTestingController.verify();
  });

  // التحقق من إنشاء الخدمة بنجاح
  it('يجب إنشاء الخدمة', () => {
    expect(service).toBeTruthy();
  });

  // التحقق من تسجيل الدخول
  it('يجب تسجيل الدخول بشكل صحيح', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const mockResponse = {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user']
      }
    };
    
    // استدعاء طريقة تسجيل الدخول
    service.login(credentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBeTruthy();
      expect(service.getCurrentUser()).toEqual(mockResponse.user);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/auth/login');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);
    
    // التحقق من حفظ الرمز المميز في التخزين المحلي
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockResponse.token);
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', mockResponse.refreshToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
  });

  // التحقق من تسجيل الخروج
  it('يجب تسجيل الخروج بشكل صحيح', () => {
    // استدعاء طريقة تسجيل الخروج
    service.logout();
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/auth/logout');
    expect(req.request.method).toEqual('POST');
    req.flush({ success: true });
    
    // التحقق من إزالة الرمز المميز من التخزين المحلي
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    
    // التحقق من التوجيه إلى صفحة تسجيل الدخول
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    
    // التحقق من حالة المصادقة
    expect(service.isAuthenticated()).toBeFalsy();
    expect(service.getCurrentUser()).toBeNull();
  });

  // التحقق من التسجيل
  it('يجب التسجيل بشكل صحيح', () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const mockResponse = {
      success: true,
      message: 'تم التسجيل بنجاح'
    };
    
    // استدعاء طريقة التسجيل
    service.register(userData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/auth/register');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(userData);
    req.flush(mockResponse);
  });

  // التحقق من تحديث الرمز المميز
  it('يجب تحديث الرمز المميز بشكل صحيح', () => {
    const mockResponse = {
      token: 'new-jwt-token',
      refreshToken: 'new-refresh-token'
    };
    
    // تعيين رمز التحديث في التخزين المحلي
    localStorageSpy.getItem.and.returnValue('old-refresh-token');
    
    // استدعاء طريقة تحديث الرمز المميز
    service.refreshToken().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/auth/refresh-token');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
    req.flush(mockResponse);
    
    // التحقق من حفظ الرمز المميز الجديد في التخزين المحلي
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockResponse.token);
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', mockResponse.refreshToken);
  });

  // التحقق من إعادة تعيين كلمة المرور
  it('يجب إرسال طلب إعادة تعيين كلمة المرور بشكل صحيح', () => {
    const email = 'test@example.com';
    
    const mockResponse = {
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    };
    
    // استدعاء طريقة إعادة تعيين كلمة المرور
    service.requestPasswordReset(email).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/auth/request-password-reset');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({ email });
    req.flush(mockResponse);
  });

  // التحقق من تأكيد إعادة تعيين كلمة المرور
  it('يجب تأكيد إعادة تعيين كلمة المرور بشكل صحيح', () => {
    const resetData = {
      token: 'reset-token',
      password: 'new-password'
    };
    
    const mockResponse = {
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    };
    
    // استدعاء طريقة تأكيد إعادة تعيين كلمة المرور
    service.confirmPasswordReset(resetData.token, resetData.password).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/auth/confirm-password-reset');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(resetData);
    req.flush(mockResponse);
  });

  // التحقق من التحقق من المصادقة الثنائية
  it('يجب التحقق من المصادقة الثنائية بشكل صحيح', () => {
    const twoFactorData = {
      userId: 1,
      code: '123456'
    };
    
    const mockResponse = {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user']
      }
    };
    
    // استدعاء طريقة التحقق من المصادقة الثنائية
    service.verifyTwoFactor(twoFactorData.userId, twoFactorData.code).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBeTruthy();
      expect(service.getCurrentUser()).toEqual(mockResponse.user);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/auth/verify-two-factor');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(twoFactorData);
    req.flush(mockResponse);
    
    // التحقق من حفظ الرمز المميز في التخزين المحلي
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockResponse.token);
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', mockResponse.refreshToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
  });

  // التحقق من الحصول على المستخدم الحالي
  it('يجب الحصول على المستخدم الحالي بشكل صحيح', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user']
    };
    
    // تعيين المستخدم في التخزين المحلي
    localStorageSpy.getItem.and.returnValue(JSON.stringify(mockUser));
    
    // الحصول على المستخدم الحالي
    const currentUser = service.getCurrentUser();
    
    // التحقق من المستخدم
    expect(currentUser).toEqual(mockUser);
  });

  // التحقق من التحقق من الأدوار
  it('يجب التحقق من الأدوار بشكل صحيح', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user', 'admin']
    };
    
    // تعيين المستخدم في التخزين المحلي
    localStorageSpy.getItem.and.returnValue(JSON.stringify(mockUser));
    
    // التحقق من الأدوار
    expect(service.hasRole('user')).toBeTruthy();
    expect(service.hasRole('admin')).toBeTruthy();
    expect(service.hasRole('guest')).toBeFalsy();
  });
});
