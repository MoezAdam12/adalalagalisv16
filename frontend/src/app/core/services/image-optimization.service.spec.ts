import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImageOptimizationService } from './image-optimization.service';

/**
 * اختبارات خدمة تحسين الصور
 */
describe('ImageOptimizationService', () => {
  let service: ImageOptimizationService;
  let httpTestingController: HttpTestingController;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImageOptimizationService]
    });
    
    service = TestBed.inject(ImageOptimizationService);
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

  // التحقق من تحسين الصورة
  it('يجب تحسين الصورة بشكل صحيح', () => {
    const imageUrl = 'https://example.com/image.jpg';
    const width = 300;
    const height = 200;
    const quality = 80;
    const format = 'webp';
    
    // استدعاء طريقة تحسين الصورة
    const optimizedUrl = service.optimizeImage(imageUrl, width, height, quality, format);
    
    // التحقق من تنسيق عنوان URL المحسن
    expect(optimizedUrl).toContain(encodeURIComponent(imageUrl));
    expect(optimizedUrl).toContain(`width=${width}`);
    expect(optimizedUrl).toContain(`height=${height}`);
    expect(optimizedUrl).toContain(`quality=${quality}`);
    expect(optimizedUrl).toContain(`format=${format}`);
  });

  // التحقق من تحميل الصورة بشكل كسول
  it('يجب تحميل الصورة بشكل كسول', () => {
    // تجسس على IntersectionObserver
    const observeSpy = jasmine.createSpy('observe');
    const disconnectSpy = jasmine.createSpy('disconnect');
    
    // إنشاء تجسس على IntersectionObserver
    spyOn(window, 'IntersectionObserver').and.returnValue({
      observe: observeSpy,
      disconnect: disconnectSpy
    } as any);
    
    // إنشاء عنصر صورة
    const imgElement = document.createElement('img');
    document.body.appendChild(imgElement);
    
    // استدعاء طريقة التحميل الكسول
    service.lazyLoadImage(imgElement, 'https://example.com/image.jpg');
    
    // التحقق من استدعاء observe
    expect(observeSpy).toHaveBeenCalledWith(imgElement);
    
    // محاكاة تقاطع العنصر مع نافذة العرض
    const intersectionCallback = (window.IntersectionObserver as jasmine.Spy).calls.mostRecent().args[0];
    intersectionCallback([{ isIntersecting: true }]);
    
    // التحقق من تعيين مصدر الصورة
    expect(imgElement.src).toBe('https://example.com/image.jpg');
    
    // التحقق من استدعاء disconnect
    expect(disconnectSpy).toHaveBeenCalled();
    
    // تنظيف
    document.body.removeChild(imgElement);
  });

  // التحقق من إنشاء صورة مصغرة
  it('يجب إنشاء صورة مصغرة بشكل صحيح', () => {
    const imageUrl = 'https://example.com/image.jpg';
    const width = 100;
    
    // استدعاء طريقة إنشاء صورة مصغرة
    const thumbnailUrl = service.createThumbnail(imageUrl, width);
    
    // التحقق من تنسيق عنوان URL للصورة المصغرة
    expect(thumbnailUrl).toContain(encodeURIComponent(imageUrl));
    expect(thumbnailUrl).toContain(`width=${width}`);
    expect(thumbnailUrl).toContain('format=webp');
  });

  // التحقق من تحويل الصورة إلى تنسيق WebP
  it('يجب تحويل الصورة إلى تنسيق WebP بشكل صحيح', () => {
    const imageUrl = 'https://example.com/image.jpg';
    
    // استدعاء طريقة تحويل الصورة
    const webpUrl = service.convertToWebP(imageUrl);
    
    // التحقق من تنسيق عنوان URL للصورة المحولة
    expect(webpUrl).toContain(encodeURIComponent(imageUrl));
    expect(webpUrl).toContain('format=webp');
  });

  // التحقق من تحميل الصورة مسبقًا
  it('يجب تحميل الصورة مسبقًا بشكل صحيح', () => {
    const imageUrl = 'https://example.com/image.jpg';
    
    // تجسس على إنشاء عنصر الصورة
    spyOn(document, 'createElement').and.callThrough();
    
    // استدعاء طريقة التحميل المسبق
    service.preloadImage(imageUrl);
    
    // التحقق من إنشاء عنصر الصورة
    expect(document.createElement).toHaveBeenCalledWith('img');
  });

  // التحقق من تحسين الصورة باستخدام خدمة التحسين
  it('يجب تحسين الصورة باستخدام خدمة التحسين', () => {
    const imageData = new Blob(['fake image data'], { type: 'image/jpeg' });
    const quality = 80;
    
    // استدعاء طريقة تحسين الصورة
    service.optimizeImageData(imageData, quality).subscribe(result => {
      expect(result).toBeTruthy();
    });
    
    // محاكاة استجابة الخادم
    const req = httpTestingController.expectOne(request => 
      request.url.includes('/api/image-optimization/optimize')
    );
    expect(req.request.method).toEqual('POST');
    req.flush(new Blob(['optimized image data'], { type: 'image/webp' }));
  });
});
