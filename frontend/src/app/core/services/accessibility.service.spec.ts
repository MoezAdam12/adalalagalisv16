import { TestBed } from '@angular/core/testing';
import { AccessibilityService } from './accessibility.service';

/**
 * اختبارات خدمة إمكانية الوصول
 */
describe('AccessibilityService', () => {
  let service: AccessibilityService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(() => {
    // إنشاء تجسس على التخزين المحلي
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem']);
    
    // تعيين سلوك getItem
    localStorageSpy.getItem.and.returnValue(null); // افتراضيًا، لا توجد إعدادات محفوظة
    
    // استبدال localStorage بالتجسس
    spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);

    TestBed.configureTestingModule({
      providers: [AccessibilityService]
    });
    
    service = TestBed.inject(AccessibilityService);
  });

  // التحقق من إنشاء الخدمة بنجاح
  it('يجب إنشاء الخدمة', () => {
    expect(service).toBeTruthy();
  });

  // التحقق من تحميل الإعدادات الافتراضية عند عدم وجود إعدادات محفوظة
  it('يجب تحميل الإعدادات الافتراضية عند عدم وجود إعدادات محفوظة', () => {
    service.accessibilitySettings$.subscribe(settings => {
      expect(settings.highContrast).toBeFalsy();
      expect(settings.largeText).toBeFalsy();
      expect(settings.reducedMotion).toBeFalsy();
      expect(settings.screenReader).toBeFalsy();
      expect(settings.keyboardNavigation).toBeTruthy();
      expect(settings.autoFocus).toBeTruthy();
      expect(settings.textToSpeech).toBeFalsy();
      expect(settings.fontFamily).toBe('default');
    });
  });

  // التحقق من تحميل الإعدادات المحفوظة
  it('يجب تحميل الإعدادات المحفوظة من التخزين المحلي', () => {
    // تعيين إعدادات محفوظة
    const savedSettings = {
      highContrast: true,
      largeText: true,
      fontFamily: 'dyslexic'
    };
    
    localStorageSpy.getItem.and.returnValue(JSON.stringify(savedSettings));
    
    // إعادة إنشاء الخدمة لتحميل الإعدادات المحفوظة
    service = TestBed.inject(AccessibilityService);
    
    service.accessibilitySettings$.subscribe(settings => {
      expect(settings.highContrast).toBeTruthy();
      expect(settings.largeText).toBeTruthy();
      expect(settings.fontFamily).toBe('dyslexic');
      
      // التحقق من أن الإعدادات الأخرى لا تزال بقيمها الافتراضية
      expect(settings.reducedMotion).toBeFalsy();
      expect(settings.screenReader).toBeFalsy();
      expect(settings.keyboardNavigation).toBeTruthy();
    });
  });

  // التحقق من تحديث الإعدادات
  it('يجب تحديث الإعدادات وحفظها في التخزين المحلي', () => {
    // تحديث إعداد
    service.updateSettings({ highContrast: true });
    
    // التحقق من تحديث الإعدادات
    service.accessibilitySettings$.subscribe(settings => {
      expect(settings.highContrast).toBeTruthy();
    });
    
    // التحقق من حفظ الإعدادات في التخزين المحلي
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  // التحقق من إعلان رسالة لقارئات الشاشة
  it('يجب إعلان رسالة لقارئات الشاشة عند تمكين قارئ الشاشة', () => {
    // تمكين قارئ الشاشة
    service.updateSettings({ screenReader: true });
    
    // تجسس على إنشاء العنصر
    spyOn(document, 'createElement').and.callThrough();
    spyOn(document.body, 'appendChild').and.callThrough();
    
    // إعلان رسالة
    service.announceForScreenReader('رسالة اختبار');
    
    // التحقق من إنشاء عنصر live region
    expect(document.createElement).toHaveBeenCalledWith('div');
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  // التحقق من عدم إعلان رسالة عند تعطيل قارئ الشاشة
  it('يجب عدم إعلان رسالة عند تعطيل قارئ الشاشة', () => {
    // تعطيل قارئ الشاشة
    service.updateSettings({ screenReader: false });
    
    // تجسس على إنشاء العنصر
    spyOn(document, 'createElement').and.callThrough();
    spyOn(document.body, 'appendChild').and.callThrough();
    
    // إعلان رسالة
    service.announceForScreenReader('رسالة اختبار');
    
    // التحقق من عدم إنشاء عنصر live region
    expect(document.createElement).not.toHaveBeenCalled();
    expect(document.body.appendChild).not.toHaveBeenCalled();
  });

  // التحقق من تحويل النص إلى كلام
  it('يجب تحويل النص إلى كلام عند تمكين تحويل النص إلى كلام', () => {
    // تمكين تحويل النص إلى كلام
    service.updateSettings({ textToSpeech: true });
    
    // إنشاء تجسس على SpeechSynthesis
    const speechSynthesisMock = {
      speak: jasmine.createSpy('speak'),
      cancel: jasmine.createSpy('cancel')
    };
    
    // استبدال SpeechSynthesis بالتجسس
    spyOnProperty(window, 'speechSynthesis').and.returnValue(speechSynthesisMock);
    
    // تحويل النص إلى كلام
    service.speak('نص اختبار');
    
    // التحقق من استدعاء speak
    expect(speechSynthesisMock.cancel).toHaveBeenCalled();
    expect(speechSynthesisMock.speak).toHaveBeenCalled();
  });

  // التحقق من عدم تحويل النص إلى كلام عند تعطيل تحويل النص إلى كلام
  it('يجب عدم تحويل النص إلى كلام عند تعطيل تحويل النص إلى كلام', () => {
    // تعطيل تحويل النص إلى كلام
    service.updateSettings({ textToSpeech: false });
    
    // إنشاء تجسس على SpeechSynthesis
    const speechSynthesisMock = {
      speak: jasmine.createSpy('speak'),
      cancel: jasmine.createSpy('cancel')
    };
    
    // استبدال SpeechSynthesis بالتجسس
    spyOnProperty(window, 'speechSynthesis').and.returnValue(speechSynthesisMock);
    
    // تحويل النص إلى كلام
    service.speak('نص اختبار');
    
    // التحقق من عدم استدعاء speak
    expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
  });

  // التحقق من التركيز على عنصر
  it('يجب التركيز على عنصر', () => {
    // إنشاء عنصر
    const element = document.createElement('button');
    
    // تجسس على focus
    spyOn(element, 'focus');
    
    // التركيز على العنصر
    service.focusElement(element);
    
    // التحقق من استدعاء focus
    expect(element.focus).toHaveBeenCalled();
  });

  // التحقق من إضافة مؤشر تركيز مرئي
  it('يجب إضافة مؤشر تركيز مرئي إلى العنصر', () => {
    // إنشاء عنصر
    const element = document.createElement('button');
    
    // إضافة مؤشر تركيز مرئي
    service.addFocusIndicator(element);
    
    // التحقق من إضافة الفئة
    expect(element.classList.contains('focus-visible')).toBeTruthy();
    
    // محاكاة حدث فقدان التركيز
    element.dispatchEvent(new Event('blur'));
    
    // التحقق من إزالة الفئة
    expect(element.classList.contains('focus-visible')).toBeFalsy();
  });
});
