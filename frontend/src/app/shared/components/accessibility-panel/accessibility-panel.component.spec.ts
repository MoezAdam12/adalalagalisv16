import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccessibilityPanelComponent } from './accessibility-panel.component';
import { AccessibilityService } from '../../../core/services/accessibility.service';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/**
 * اختبارات مكون لوحة إمكانية الوصول
 */
describe('AccessibilityPanelComponent', () => {
  let component: AccessibilityPanelComponent;
  let fixture: ComponentFixture<AccessibilityPanelComponent>;
  let accessibilityServiceMock: jasmine.SpyObj<AccessibilityService>;
  let settingsSubject: BehaviorSubject<any>;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(async () => {
    // إنشاء إعدادات افتراضية للاختبار
    const defaultSettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      autoFocus: true,
      textToSpeech: false,
      fontFamily: 'default'
    };
    
    // إنشاء موضوع سلوكي للإعدادات
    settingsSubject = new BehaviorSubject(defaultSettings);
    
    // إنشاء تجسس على خدمة إمكانية الوصول
    accessibilityServiceMock = jasmine.createSpyObj('AccessibilityService', 
      ['updateSettings', 'announceForScreenReader'],
      { accessibilitySettings$: settingsSubject.asObservable() }
    );

    await TestBed.configureTestingModule({
      declarations: [AccessibilityPanelComponent],
      providers: [
        { provide: AccessibilityService, useValue: accessibilityServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // للسماح بعناصر Angular غير المعروفة مثل *ngFor
    }).compileComponents();

    fixture = TestBed.createComponent(AccessibilityPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // التحقق من إنشاء المكون بنجاح
  it('يجب إنشاء المكون', () => {
    expect(component).toBeTruthy();
  });

  // التحقق من تحميل الإعدادات الافتراضية
  it('يجب تحميل الإعدادات الافتراضية', () => {
    expect(component.accessibilitySettings).toBeDefined();
    expect(component.accessibilitySettings.highContrast).toBeFalsy();
    expect(component.accessibilitySettings.largeText).toBeFalsy();
    expect(component.accessibilitySettings.keyboardNavigation).toBeTruthy();
  });

  // التحقق من عرض حالة الإعدادات الحالية
  it('يجب عرض حالة الإعدادات الحالية في واجهة المستخدم', () => {
    // العثور على أزرار التبديل
    const highContrastButton = fixture.debugElement.query(By.css('#high-contrast-toggle'));
    const largeTextButton = fixture.debugElement.query(By.css('#large-text-toggle'));
    
    // التحقق من حالة الأزرار
    expect(highContrastButton.nativeElement.textContent.trim()).toBe('معطل');
    expect(largeTextButton.nativeElement.textContent.trim()).toBe('معطل');
    
    // تحديث الإعدادات
    settingsSubject.next({
      ...component.accessibilitySettings,
      highContrast: true
    });
    fixture.detectChanges();
    
    // التحقق من تحديث حالة الأزرار
    expect(highContrastButton.nativeElement.textContent.trim()).toBe('مفعل');
  });

  // التحقق من تبديل الإعدادات
  it('يجب تبديل الإعدادات عند النقر على أزرار التبديل', () => {
    // العثور على زر التباين العالي
    const highContrastButton = fixture.debugElement.query(By.css('#high-contrast-toggle'));
    
    // النقر على الزر
    highContrastButton.nativeElement.click();
    fixture.detectChanges();
    
    // التحقق من استدعاء updateSettings
    expect(accessibilityServiceMock.updateSettings).toHaveBeenCalledWith({ highContrast: true });
  });

  // التحقق من تحديث الإعدادات
  it('يجب تحديث الإعدادات عند تغيير قيمة القائمة المنسدلة', () => {
    // العثور على قائمة عائلة الخط
    const fontSelect = fixture.debugElement.query(By.css('#font-family-select'));
    
    // تغيير القيمة
    fontSelect.nativeElement.value = 'dyslexic';
    fontSelect.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    
    // التحقق من استدعاء updateSettings
    expect(accessibilityServiceMock.updateSettings).toHaveBeenCalledWith({ fontFamily: 'dyslexic' });
  });

  // التحقق من إعادة تعيين الإعدادات
  it('يجب إعادة تعيين جميع الإعدادات عند النقر على زر إعادة التعيين', () => {
    // العثور على زر إعادة التعيين
    const resetButton = fixture.debugElement.query(By.css('.reset-button'));
    
    // النقر على الزر
    resetButton.nativeElement.click();
    fixture.detectChanges();
    
    // التحقق من استدعاء updateSettings بالقيم الافتراضية
    expect(accessibilityServiceMock.updateSettings).toHaveBeenCalledWith({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      autoFocus: true,
      textToSpeech: false,
      fontFamily: 'default'
    });
  });

  // التحقق من إعلان التغييرات لقارئات الشاشة
  it('يجب إعلان التغييرات لقارئات الشاشة', () => {
    // تبديل إعداد
    component.toggleSetting('highContrast');
    
    // التحقق من استدعاء announceForScreenReader
    expect(accessibilityServiceMock.announceForScreenReader).toHaveBeenCalled();
  });

  // التحقق من الحصول على اسم العرض للإعداد
  it('يجب الحصول على اسم العرض الصحيح للإعداد', () => {
    // استدعاء getSettingDisplayName من خلال updateSetting
    component.updateSetting('highContrast', true);
    
    // التحقق من استدعاء announceForScreenReader بالاسم الصحيح
    expect(accessibilityServiceMock.announceForScreenReader).toHaveBeenCalledWith(
      jasmine.stringMatching(/وضع التباين العالي/)
    );
  });
});
