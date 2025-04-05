import { TestBed } from '@angular/core/testing';
import { QueryOptimizationService } from './query-optimization.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

/**
 * اختبارات خدمة تحسين الاستعلامات
 */
describe('QueryOptimizationService', () => {
  let service: QueryOptimizationService;
  let httpTestingController: HttpTestingController;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QueryOptimizationService]
    });
    
    service = TestBed.inject(QueryOptimizationService);
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

  // التحقق من تحسين الاستعلام بتحديد الحقول
  it('يجب تحسين الاستعلام بتحديد الحقول', () => {
    const url = '/api/users';
    const fields = ['id', 'name', 'email'];
    
    // استدعاء طريقة الاستعلام المحسن
    service.getWithFields(url, fields).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(`${url}?fields=${fields.join(',')}`);
    expect(req.request.method).toEqual('GET');
    req.flush({ data: [{ id: 1, name: 'Test', email: 'test@example.com' }] });
  });

  // التحقق من تصفح الصفحات
  it('يجب تصفح الصفحات بشكل صحيح', () => {
    const url = '/api/users';
    const page = 2;
    const limit = 10;
    
    // استدعاء طريقة تصفح الصفحات
    service.getPaginated(url, page, limit).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(`${url}?page=${page}&limit=${limit}`);
    expect(req.request.method).toEqual('GET');
    req.flush({
      data: [{ id: 11, name: 'User 11' }],
      pagination: { page: 2, limit: 10, total: 25 }
    });
  });

  // التحقق من تصفح المؤشر
  it('يجب تصفح المؤشر بشكل صحيح', () => {
    const url = '/api/users';
    const cursor = 'abc123';
    const limit = 10;
    
    // استدعاء طريقة تصفح المؤشر
    service.getCursorPaginated(url, cursor, limit).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(`${url}?cursor=${cursor}&limit=${limit}`);
    expect(req.request.method).toEqual('GET');
    req.flush({
      data: [{ id: 11, name: 'User 11' }],
      nextCursor: 'def456',
      hasMore: true
    });
  });

  // التحقق من الاستعلام المجمع
  it('يجب تنفيذ الاستعلام المجمع بشكل صحيح', () => {
    const url = '/api/users/batch';
    const ids = [1, 2, 3];
    
    // استدعاء طريقة الاستعلام المجمع
    service.batchGet(url, ids).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(`${url}?ids=${ids.join(',')}`);
    expect(req.request.method).toEqual('GET');
    req.flush({
      data: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' }
      ]
    });
  });

  // التحقق من الاستعلام المشترك
  it('يجب تنفيذ الاستعلام المشترك بشكل صحيح', () => {
    const url = '/api/users';
    const includes = ['posts', 'comments'];
    
    // استدعاء طريقة الاستعلام المشترك
    service.getWithIncludes(url, includes).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(`${url}?include=${includes.join(',')}`);
    expect(req.request.method).toEqual('GET');
    req.flush({
      data: [
        {
          id: 1,
          name: 'User 1',
          posts: [{ id: 1, title: 'Post 1' }],
          comments: [{ id: 1, text: 'Comment 1' }]
        }
      ]
    });
  });

  // التحقق من الاستعلام المخزن مؤقتًا
  it('يجب تنفيذ الاستعلام المخزن مؤقتًا بشكل صحيح', () => {
    const url = '/api/users';
    const cacheKey = 'users-list';
    const ttl = 300;
    
    // استدعاء طريقة الاستعلام المخزن مؤقتًا
    service.getCached(url, cacheKey, ttl).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.flush({ data: [{ id: 1, name: 'User 1' }] });
    
    // استدعاء مرة أخرى (يجب أن يستخدم التخزين المؤقت)
    service.getCached(url, cacheKey, ttl).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // لا يجب أن يكون هناك طلب إضافي
    httpTestingController.expectNone(url);
  });

  // التحقق من إبطال التخزين المؤقت
  it('يجب إبطال التخزين المؤقت بشكل صحيح', () => {
    const url = '/api/users';
    const cacheKey = 'users-list';
    const ttl = 300;
    
    // استدعاء طريقة الاستعلام المخزن مؤقتًا
    service.getCached(url, cacheKey, ttl).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.flush({ data: [{ id: 1, name: 'User 1' }] });
    
    // إبطال التخزين المؤقت
    service.invalidateCache(cacheKey);
    
    // استدعاء مرة أخرى (يجب أن يرسل طلبًا جديدًا)
    service.getCached(url, cacheKey, ttl).subscribe(data => {
      expect(data).toBeTruthy();
    });
    
    // يجب أن يكون هناك طلب إضافي
    const req2 = httpTestingController.expectOne(url);
    expect(req2.request.method).toEqual('GET');
    req2.flush({ data: [{ id: 1, name: 'User 1' }] });
  });
});
