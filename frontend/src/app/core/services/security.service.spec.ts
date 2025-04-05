import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SecurityService } from './security.service';

/**
 * اختبارات خدمة الأمان
 */
describe('SecurityService', () => {
  let service: SecurityService;
  let httpTestingController: HttpTestingController;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SecurityService]
    });
    
    service = TestBed.inject(SecurityService);
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

  // التحقق من تنظيف النص المدخل
  it('يجب تنظيف النص المدخل بشكل صحيح', () => {
    const dirtyText = '<script>alert("XSS")</script>Hello World';
    const cleanText = service.sanitizeInput(dirtyText);
    
    // التحقق من إزالة وسوم البرمجة النصية
    expect(cleanText).not.toContain('<script>');
    expect(cleanText).toContain('Hello World');
  });

  // التحقق من التحقق من صحة البريد الإلكتروني
  it('يجب التحقق من صحة البريد الإلكتروني بشكل صحيح', () => {
    // بريد إلكتروني صحيح
    expect(service.validateEmail('test@example.com')).toBeTruthy();
    
    // بريد إلكتروني غير صحيح
    expect(service.validateEmail('invalid-email')).toBeFalsy();
    expect(service.validateEmail('test@')).toBeFalsy();
    expect(service.validateEmail('@example.com')).toBeFalsy();
  });

  // التحقق من التحقق من صحة كلمة المرور
  it('يجب التحقق من صحة كلمة المرور بشكل صحيح', () => {
    // كلمة مرور قوية
    expect(service.validatePassword('StrongP@ss123')).toBeTruthy();
    
    // كلمة مرور ضعيفة
    expect(service.validatePassword('weak')).toBeFalsy();
    expect(service.validatePassword('123456')).toBeFalsy();
    expect(service.validatePassword('password')).toBeFalsy();
  });

  // التحقق من تشفير البيانات
  it('يجب تشفير البيانات بشكل صحيح', () => {
    const data = { id: 1, name: 'Test User' };
    const encryptedData = service.encryptData(data);
    
    // التحقق من أن البيانات المشفرة ليست هي البيانات الأصلية
    expect(encryptedData).not.toEqual(JSON.stringify(data));
    expect(typeof encryptedData).toBe('string');
  });

  // التحقق من فك تشفير البيانات
  it('يجب فك تشفير البيانات بشكل صحيح', () => {
    const data = { id: 1, name: 'Test User' };
    const encryptedData = service.encryptData(data);
    const decryptedData = service.decryptData(encryptedData);
    
    // التحقق من أن البيانات المفكوكة تساوي البيانات الأصلية
    expect(decryptedData).toEqual(data);
  });

  // التحقق من إنشاء رمز CSRF
  it('يجب إنشاء رمز CSRF بشكل صحيح', () => {
    const csrfToken = service.generateCsrfToken();
    
    // التحقق من أن الرمز ليس فارغًا وله طول مناسب
    expect(csrfToken).toBeTruthy();
    expect(csrfToken.length).toBeGreaterThan(20);
  });

  // التحقق من التحقق من رمز CSRF
  it('يجب التحقق من رمز CSRF بشكل صحيح', () => {
    const csrfToken = service.generateCsrfToken();
    
    // التحقق من رمز صحيح
    expect(service.validateCsrfToken(csrfToken)).toBeTruthy();
    
    // التحقق من رمز غير صحيح
    expect(service.validateCsrfToken('invalid-token')).toBeFalsy();
  });

  // التحقق من تحليل عنوان URL
  it('يجب تحليل عنوان URL بشكل صحيح', () => {
    const url = 'https://example.com/path?param=value#fragment';
    const parsedUrl = service.parseUrl(url);
    
    // التحقق من تحليل عنوان URL
    expect(parsedUrl.protocol).toBe('https:');
    expect(parsedUrl.hostname).toBe('example.com');
    expect(parsedUrl.pathname).toBe('/path');
    expect(parsedUrl.searchParams.get('param')).toBe('value');
    expect(parsedUrl.hash).toBe('#fragment');
  });

  // التحقق من التحقق من عنوان URL
  it('يجب التحقق من عنوان URL بشكل صحيح', () => {
    // عنوان URL صحيح
    expect(service.validateUrl('https://example.com')).toBeTruthy();
    
    // عنوان URL غير صحيح
    expect(service.validateUrl('invalid-url')).toBeFalsy();
    expect(service.validateUrl('javascript:alert(1)')).toBeFalsy();
  });

  // التحقق من تحديث إعدادات الأمان
  it('يجب تحديث إعدادات الأمان بشكل صحيح', () => {
    const settings = {
      enableCsrf: true,
      enableXssProtection: true,
      enableContentSecurityPolicy: true
    };
    
    // استدعاء طريقة تحديث الإعدادات
    service.updateSecuritySettings(settings).subscribe(response => {
      expect(response.success).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/security-settings');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(settings);
    req.flush({ success: true });
  });

  // التحقق من الحصول على إعدادات الأمان
  it('يجب الحصول على إعدادات الأمان بشكل صحيح', () => {
    // استدعاء طريقة الحصول على الإعدادات
    service.getSecuritySettings().subscribe(settings => {
      expect(settings).toBeTruthy();
      expect(settings.enableCsrf).toBeDefined();
      expect(settings.enableXssProtection).toBeDefined();
      expect(settings.enableContentSecurityPolicy).toBeDefined();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne('/api/security-settings');
    expect(req.request.method).toEqual('GET');
    req.flush({
      enableCsrf: true,
      enableXssProtection: true,
      enableContentSecurityPolicy: true
    });
  });
});
