import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AccessibilityDirective } from './accessibility.directive';

// مكون اختبار بسيط لاستخدامه مع التوجيه
@Component({
  template: `
    <button 
      appAccessibility 
      [ariaLabel]="'زر الاختبار'" 
      [role]="'button'"
      [tabindex]="0"
      [focusable]="true"
      [highContrast]="false">
      زر الاختبار
    </button>
  `
})
class TestComponent {}

/**
 * اختبارات توجيه إمكانية الوصول
 */
describe('AccessibilityDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let buttonEl: DebugElement;
  let buttonNativeEl: HTMLElement;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AccessibilityDirective,
        TestComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    buttonEl = fixture.debugElement.query(By.css('button'));
    buttonNativeEl = buttonEl.nativeElement;
    fixture.detectChanges();
  });

  // التحقق من إنشاء التوجيه بنجاح
  it('يجب إنشاء التوجيه', () => {
    const directive = buttonEl.injector.get(AccessibilityDirective);
    expect(directive).toBeTruthy();
  });

  // التحقق من إضافة سمة aria-label
  it('يجب إضافة سمة aria-label إلى العنصر', () => {
    expect(buttonNativeEl.getAttribute('aria-label')).toBe('زر الاختبار');
  });

  // التحقق من إضافة سمة role
  it('يجب إضافة سمة role إلى العنصر', () => {
    expect(buttonNativeEl.getAttribute('role')).toBe('button');
  });

  // التحقق من إضافة سمة tabindex
  it('يجب إضافة سمة tabindex إلى العنصر', () => {
    expect(buttonNativeEl.getAttribute('tabindex')).toBe('0');
  });

  // التحقق من عدم إضافة فئة high-contrast
  it('يجب عدم إضافة فئة high-contrast عندما تكون highContrast=false', () => {
    expect(buttonNativeEl.classList.contains('high-contrast')).toBeFalsy();
  });

  // التحقق من إضافة فئة high-contrast عند تغيير القيمة
  it('يجب إضافة فئة high-contrast عندما تكون highContrast=true', () => {
    const directive = buttonEl.injector.get(AccessibilityDirective);
    directive.highContrast = true;
    directive.ngOnInit();
    fixture.detectChanges();
    expect(buttonNativeEl.classList.contains('high-contrast')).toBeTruthy();
  });

  // التحقق من استجابة العنصر لحدث الضغط على مفتاح Enter
  it('يجب أن يستجيب العنصر لحدث الضغط على مفتاح Enter', () => {
    spyOn(buttonNativeEl, 'click');
    
    // محاكاة حدث الضغط على مفتاح Enter
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    });
    buttonNativeEl.dispatchEvent(keyboardEvent);
    
    expect(buttonNativeEl.click).toHaveBeenCalled();
  });

  // التحقق من استجابة العنصر لحدث الضغط على مفتاح Space
  it('يجب أن يستجيب العنصر لحدث الضغط على مفتاح Space', () => {
    spyOn(buttonNativeEl, 'click');
    
    // محاكاة حدث الضغط على مفتاح Space
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true
    });
    buttonNativeEl.dispatchEvent(keyboardEvent);
    
    expect(buttonNativeEl.click).toHaveBeenCalled();
  });
});
