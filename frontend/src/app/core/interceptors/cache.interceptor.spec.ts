import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CacheInterceptor } from './cache.interceptor';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { CacheService } from '../services/cache.service';

/**
 * اختبارات معترض التخزين المؤقت
 */
describe('CacheInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let cacheService: jasmine.SpyObj<CacheService>;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    // إنشاء تجسس على خدمة التخزين المؤقت
    cacheService = jasmine.createSpyObj('CacheService', ['get', 'set', 'has']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CacheService, useValue: cacheService },
        { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  // التنظيف بعد كل اختبار
  afterEach(() => {
    httpTestingController.verify();
  });

  // التحقق من استخدام التخزين المؤقت لطلبات GET
  it('يجب استخدام التخزين المؤقت لطلبات GET', () => {
    const testUrl = '/api/data';
    const testData = { name: 'Test Data' };
    
    // تعيين سلوك خدمة التخزين المؤقت
    cacheService.has.and.returnValue(true);
    cacheService.get.and.returnValue(testData);
    
    // إرسال طلب GET
    httpClient.get(testUrl).subscribe(data => {
      expect(data).toEqual(testData);
    });
    
    // التحقق من استدعاء خدمة التخزين المؤقت
    expect(cacheService.has).toHaveBeenCalled();
    expect(cacheService.get).toHaveBeenCalled();
    
    // التحقق من عدم إرسال طلب HTTP
    httpTestingController.expectNone(testUrl);
  });

  // التحقق من تخزين استجابة طلب GET في التخزين المؤقت
  it('يجب تخزين استجابة طلب GET في التخزين المؤقت', () => {
    const testUrl = '/api/data';
    const testData = { name: 'Test Data' };
    
    // تعيين سلوك خدمة التخزين المؤقت
    cacheService.has.and.returnValue(false);
    
    // إرسال طلب GET
    httpClient.get(testUrl).subscribe(data => {
      expect(data).toEqual(testData);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(testUrl);
    req.flush(testData);
    
    // التحقق من استدعاء خدمة التخزين المؤقت
    expect(cacheService.set).toHaveBeenCalledWith(
      jasmine.any(String),
      testData,
      jasmine.any(Number)
    );
  });

  // التحقق من عدم استخدام التخزين المؤقت لطلبات POST
  it('يجب عدم استخدام التخزين المؤقت لطلبات POST', () => {
    const testUrl = '/api/data';
    const testData = { name: 'Test Data' };
    
    // إرسال طلب POST
    httpClient.post(testUrl, testData).subscribe(data => {
      expect(data).toEqual(testData);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(testUrl);
    expect(req.request.method).toEqual('POST');
    req.flush(testData);
    
    // التحقق من عدم استدعاء خدمة التخزين المؤقت
    expect(cacheService.has).not.toHaveBeenCalled();
    expect(cacheService.get).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  // التحقق من عدم استخدام التخزين المؤقت للطلبات التي تحتوي على رأس no-cache
  it('يجب عدم استخدام التخزين المؤقت للطلبات التي تحتوي على رأس no-cache', () => {
    const testUrl = '/api/data';
    const testData = { name: 'Test Data' };
    
    // إرسال طلب GET مع رأس no-cache
    httpClient.get(testUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    }).subscribe(data => {
      expect(data).toEqual(testData);
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(testUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(testData);
    
    // التحقق من عدم استدعاء خدمة التخزين المؤقت للتحقق من وجود البيانات
    expect(cacheService.has).not.toHaveBeenCalled();
    expect(cacheService.get).not.toHaveBeenCalled();
    
    // التحقق من استدعاء خدمة التخزين المؤقت لتخزين البيانات
    expect(cacheService.set).toHaveBeenCalled();
  });
});
