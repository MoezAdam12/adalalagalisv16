/**
 * auth.service.spec.ts
 * اختبارات وحدة لخدمة المصادقة
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../app/core/services/auth.service';
import { environment } from '../../environments/environment';
import { TestConfig, MockData } from '../test.config';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/${environment.apiVersion}`;

  beforeEach(() => {
    TestConfig.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('يجب إنشاء الخدمة', () => {
    expect(service).toBeTruthy();
  });

  describe('تسجيل الدخول', () => {
    it('يجب أن يعيد بيانات المستخدم والرمز المميز عند تسجيل الدخول بنجاح', () => {
      const mockCredentials = {
        email: 'admin@adalalegalis.com',
        password: 'password123'
      };
      
      const mockResponse = {
        success: true,
        data: {
          user: MockData.users[0],
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        }
      };

      service.login(mockCredentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);
      req.flush(mockResponse);
    });

    it('يجب أن يعيد خطأ عند فشل تسجيل الدخول', () => {
      const mockCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };
      
      const mockErrorResponse = {
        success: false,
        error: {
          message: 'بيانات الاعتماد غير صالحة',
          statusCode: 401
        }
      };

      service.login(mockCredentials).subscribe(
        () => fail('يجب أن يفشل مع خطأ'),
        error => {
          expect(error.error).toEqual(mockErrorResponse);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockErrorResponse, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('تسجيل الخروج', () => {
    it('يجب أن يمسح بيانات المستخدم والرمز المميز عند تسجيل الخروج', () => {
      // محاكاة وجود مستخدم مسجل الدخول
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({
        user: MockData.users[0],
        token: 'mock-jwt-token'
      }));
      
      spyOn(localStorage, 'removeItem');
      spyOn(service.authState, 'next');

      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('adalalegalis_auth');
      expect(service.authState.next).toHaveBeenCalledWith(null);
      
      const req = httpMock.expectOne(`${apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });

  describe('تحديث الرمز المميز', () => {
    it('يجب أن يحدث الرمز المميز باستخدام رمز التحديث', () => {
      const mockRefreshToken = 'mock-refresh-token';
      
      const mockResponse = {
        success: true,
        data: {
          token: 'new-jwt-token',
          refreshToken: 'new-refresh-token'
        }
      };

      service.refreshToken(mockRefreshToken).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh-token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: mockRefreshToken });
      req.flush(mockResponse);
    });
  });

  describe('التحقق من حالة المصادقة', () => {
    it('يجب أن يعيد true عندما يكون المستخدم مسجل الدخول', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({
        user: MockData.users[0],
        token: 'mock-jwt-token'
      }));

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('يجب أن يعيد false عندما لا يكون المستخدم مسجل الدخول', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('التحقق من الأدوار', () => {
    it('يجب أن يعيد true عندما يكون للمستخدم الدور المطلوب', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({
        user: MockData.users[0], // مستخدم بدور admin
        token: 'mock-jwt-token'
      }));

      expect(service.hasRole('admin')).toBeTrue();
    });

    it('يجب أن يعيد false عندما لا يكون للمستخدم الدور المطلوب', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({
        user: MockData.users[1], // مستخدم بدور lawyer
        token: 'mock-jwt-token'
      }));

      expect(service.hasRole('admin')).toBeFalse();
    });
  });

  describe('التحقق من الصلاحيات', () => {
    it('يجب أن يعيد true عندما يكون للمستخدم الصلاحية المطلوبة', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({
        user: MockData.users[0], // مستخدم له صلاحية admin
        token: 'mock-jwt-token'
      }));

      expect(service.hasPermission('admin')).toBeTrue();
    });

    it('يجب أن يعيد false عندما لا يكون للمستخدم الصلاحية المطلوبة', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({
        user: MockData.users[2], // مستخدم له صلاحية read فقط
        token: 'mock-jwt-token'
      }));

      expect(service.hasPermission('write')).toBeFalse();
    });
  });
});
