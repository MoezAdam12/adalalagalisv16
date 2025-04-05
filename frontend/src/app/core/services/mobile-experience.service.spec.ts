import { TestBed } from '@angular/core/testing';
import { MobileExperienceService } from './mobile-experience.service';

/**
 * اختبارات خدمة تجربة الأجهزة المحمولة
 */
describe('MobileExperienceService', () => {
  let service: MobileExperienceService;
  let localStorageSpy: jasmine.SpyObj<Storage>;
  let userAgentGetter: jasmine.Spy;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    // إنشاء تجسس على التخزين المحلي
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem']);
    
    // تعيين سلوك getItem
    localStorageSpy.getItem.and.returnValue(null); // افتراضيًا، لا توجد إعدادات محفوظة
    
    // استبدال localStorage بالتجسس
    spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);

    // تجسس على وكيل المستخدم
    userAgentGetter = spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0');

    // تجسس على أبعاد النافذة
    spyOnProperty(window, 'innerWidth').and.returnValue(1024);
    spyOnProperty(window, 'innerHeight').and.returnValue(768);

    TestBed.configureTestingModule({
      providers: [MobileExperienceService]
    });
    
    service = TestBed.inject(MobileExperienceService);
  });

  // التحقق من إنشاء الخدمة بنجاح
  it('يجب إنشاء الخدمة', () => {
    expect(service).toBeTruthy();
  });

  // التحقق من تحميل الإعدادات الافتراضية عند عدم وجود إعدادات محفوظة
  it('يجب تحميل الإعدادات الافتراضية عند عدم وجود إعدادات محفوظة', () => {
    service.mobileSettings$.subscribe(settings => {
      expect(settings.enableTouchGestures).toBeTruthy();
      expect(settings.enablePinchZoom).toBeTruthy();
      expect(settings.enableSwipe).toBeTruthy();
      expect(settings.enableDoubleTap).toBeTruthy();
      expect(settings.enableLongPress).toBeTruthy();
      expect(settings.touchFeedback).toBeTruthy();
      expect(settings.largeTargets).toBeTruthy();
      expect(settings.optimizeForSmallScreens).toBeTruthy();
      expect(settings.adaptiveLayout).toBeTruthy();
      expect(settings.bottomNavigation).toBeTruthy();
    });
  });

  // التحقق من تحميل الإعدادات المحفوظة
  it('يجب تحميل الإعدادات المحفوظة من التخزين المحلي', () => {
    // تعيين إعدادات محفوظة
    const savedSettings = {
      enableTouchGestures: false,
      largeTargets: false,
      bottomNavigation: false
    };
    
    localStorageSpy.getItem.and.returnValue(JSON.stringify(savedSettings));
    
    // إعادة إنشاء الخدمة لتحميل الإعدادات المحفوظة
    service = TestBed.inject(MobileExperienceService);
    
    service.mobileSettings$.subscribe(settings => {
      expect(settings.enableTouchGestures).toBeFalsy();
      expect(settings.largeTargets).toBeFalsy();
      expect(settings.bottomNavigation).toBeFalsy();
      
      // التحقق من أن الإعدادات الأخرى لا تزال بقيمها الافتراضية
      expect(settings.enablePinchZoom).toBeTruthy();
      expect(settings.enableSwipe).toBeTruthy();
      expect(settings.optimizeForSmallScreens).toBeTruthy();
    });
  });

  // التحقق من تحديث الإعدادات
  it('يجب تحديث الإعدادات وحفظها في التخزين المحلي', () => {
    // تحديث إعداد
    service.updateSettings({ largeTargets: false });
    
    // التحقق من تحديث الإعدادات
    service.mobileSettings$.subscribe(settings => {
      expect(settings.largeTargets).toBeFalsy();
    });
    
    // التحقق من حفظ الإعدادات في التخزين المحلي
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  // التحقق من اكتشاف الجهاز المحمول
  it('يجب اكتشاف الجهاز المحمول بشكل صحيح', () => {
    // تعيين وكيل المستخدم لجهاز محمول
    userAgentGetter.and.returnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    
    // إعادة إنشاء الخدمة لاكتشاف الجهاز
    service = TestBed.inject(MobileExperienceService);
    
    // التحقق من اكتشاف الجهاز المحمول
    expect(service.isMobileDevice).toBeTruthy();
    expect(service.isTabletDevice).toBeFalsy();
  });

  // التحقق من اكتشاف الجهاز اللوحي
  it('يجب اكتشاف الجهاز اللوحي بشكل صحيح', () => {
    // تعيين وكيل المستخدم لجهاز لوحي
    userAgentGetter.and.returnValue('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');
    
    // إعادة إنشاء الخدمة لاكتشاف الجهاز
    service = TestBed.inject(MobileExperienceService);
    
    // التحقق من اكتشاف الجهاز اللوحي
    expect(service.isMobileDevice).toBeTruthy();
    expect(service.isTabletDevice).toBeTruthy();
  });

  // التحقق من اكتشاف اتجاه الشاشة
  it('يجب اكتشاف اتجاه الشاشة بشكل صحيح', () => {
    // تعيين أبعاد النافذة للاتجاه الأفقي
    spyOnProperty(window, 'innerWidth').and.returnValue(1024);
    spyOnProperty(window, 'innerHeight').and.returnValue(768);
    
    // إعادة إنشاء الخدمة لاكتشاف الاتجاه
    service = TestBed.inject(MobileExperienceService);
    
    // التحقق من اكتشاف الاتجاه الأفقي
    expect(service.orientation).toBe('landscape');
    
    // تعيين أبعاد النافذة للاتجاه العمودي
    spyOnProperty(window, 'innerWidth').and.returnValue(768);
    spyOnProperty(window, 'innerHeight').and.returnValue(1024);
    
    // محاكاة حدث تغيير حجم النافذة
    window.dispatchEvent(new Event('resize'));
    
    // التحقق من اكتشاف الاتجاه العمودي
    expect(service.orientation).toBe('portrait');
  });

  // التحقق من تحسين عنصر للأجهزة المحمولة
  it('يجب تحسين عنصر للأجهزة المحمولة', () => {
    // تعيين وكيل المستخدم لجهاز محمول
    userAgentGetter.and.returnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    
    // إعادة إنشاء الخدمة لاكتشاف الجهاز
    service = TestBed.inject(MobileExperienceService);
    
    // إنشاء عنصر
    const button = document.createElement('button');
    
    // تحسين العنصر
    service.optimizeElementForMobile(button);
    
    // التحقق من إضافة الفئات
    expect(button.classList.contains('mobile-optimized-target')).toBeTruthy();
    expect(button.classList.contains('touch-feedback-enabled')).toBeTruthy();
  });

  // التحقق من تحسين قائمة للأجهزة المحمولة
  it('يجب تحسين قائمة للأجهزة المحمولة', () => {
    // تعيين وكيل المستخدم لجهاز محمول
    userAgentGetter.and.returnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    
    // إعادة إنشاء الخدمة لاكتشاف الجهاز
    service = TestBed.inject(MobileExperienceService);
    
    // إنشاء قائمة
    const menu = document.createElement('ul');
    const menuItem1 = document.createElement('li');
    const menuItem2 = document.createElement('li');
    menu.appendChild(menuItem1);
    menu.appendChild(menuItem2);
    
    // تحسين القائمة
    service.optimizeMenuForMobile(menu);
    
    // التحقق من إضافة الفئات
    expect(menu.classList.contains('mobile-optimized-menu')).toBeTruthy();
    expect(menuItem1.classList.contains('mobile-menu-item')).toBeTruthy();
    expect(menuItem2.classList.contains('mobile-menu-item')).toBeTruthy();
  });

  // التحقق من تحسين نموذج للأجهزة المحمولة
  it('يجب تحسين نموذج للأجهزة المحمولة', () => {
    // تعيين وكيل المستخدم لجهاز محمول
    userAgentGetter.and.returnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    
    // إعادة إنشاء الخدمة لاكتشاف الجهاز
    service = TestBed.inject(MobileExperienceService);
    
    // إنشاء نموذج
    const form = document.createElement('form');
    const input = document.createElement('input');
    const button = document.createElement('button');
    form.appendChild(input);
    form.appendChild(button);
    
    // تحسين النموذج
    service.optimizeFormForMobile(form);
    
    // التحقق من إضافة الفئات
    expect(form.classList.contains('mobile-optimized-form')).toBeTruthy();
    expect(input.classList.contains('mobile-input-field')).toBeTruthy();
    expect(button.classList.contains('mobile-form-button')).toBeTruthy();
  });
});
