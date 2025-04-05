import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MobileExperienceDirective } from './mobile-experience.directive';

// مكون اختبار بسيط لاستخدامه مع التوجيه
@Component({
  template: `
    <div 
      appMobileExperience 
      [touchFeedback]="true" 
      [swipeEnabled]="true"
      [doubleTapEnabled]="true"
      [longPressEnabled]="true">
      عنصر اختبار
    </div>
  `
})
class TestComponent {}

/**
 * اختبارات توجيه تجربة الأجهزة المحمولة
 */
describe('MobileExperienceDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let divEl: DebugElement;
  let divNativeEl: HTMLElement;

  // إعداد الاختبار قبل كل حالة اختبار
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MobileExperienceDirective,
        TestComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    divEl = fixture.debugElement.query(By.css('div'));
    divNativeEl = divEl.nativeElement;
    fixture.detectChanges();
  });

  // التحقق من إنشاء التوجيه بنجاح
  it('يجب إنشاء التوجيه', () => {
    const directive = divEl.injector.get(MobileExperienceDirective);
    expect(directive).toBeTruthy();
  });

  // التحقق من إضافة فئة touch-active عند بدء اللمس
  it('يجب إضافة فئة touch-active عند بدء اللمس', () => {
    // محاكاة حدث بدء اللمس
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({
        identifier: 1,
        target: divNativeEl,
        clientX: 100,
        clientY: 100
      })]
    });
    
    divNativeEl.dispatchEvent(touchStartEvent);
    fixture.detectChanges();
    
    expect(divNativeEl.classList.contains('touch-active')).toBeTruthy();
  });

  // التحقق من إزالة فئة touch-active عند نهاية اللمس
  it('يجب إزالة فئة touch-active عند نهاية اللمس', () => {
    // محاكاة حدث بدء اللمس
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({
        identifier: 1,
        target: divNativeEl,
        clientX: 100,
        clientY: 100
      })]
    });
    
    divNativeEl.dispatchEvent(touchStartEvent);
    fixture.detectChanges();
    
    // محاكاة حدث نهاية اللمس
    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: []
    });
    
    divNativeEl.dispatchEvent(touchEndEvent);
    fixture.detectChanges();
    
    expect(divNativeEl.classList.contains('touch-active')).toBeFalsy();
  });

  // التحقق من إطلاق حدث السحب
  it('يجب إطلاق حدث السحب عند سحب العنصر', () => {
    const directive = divEl.injector.get(MobileExperienceDirective);
    let swipeDirection: string | null = null;
    
    // الاستماع لحدث السحب المخصص
    divNativeEl.addEventListener('app-swipe', (event: any) => {
      swipeDirection = event.detail.direction;
    });
    
    // محاكاة حدث بدء اللمس
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({
        identifier: 1,
        target: divNativeEl,
        clientX: 100,
        clientY: 100
      })]
    });
    
    divNativeEl.dispatchEvent(touchStartEvent);
    
    // تعيين قيم نهاية اللمس يدويًا (لا يمكن محاكاة تحرك اللمس بشكل كامل في الاختبار)
    directive['touchEndX'] = 200; // سحب لليمين
    directive['touchEndY'] = 100;
    
    // محاكاة حدث نهاية اللمس
    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: []
    });
    
    divNativeEl.dispatchEvent(touchEndEvent);
    
    expect(swipeDirection).toBe('right');
  });

  // التحقق من إطلاق حدث الضغط المزدوج
  it('يجب إطلاق حدث الضغط المزدوج عند النقر مرتين بسرعة', () => {
    const directive = divEl.injector.get(MobileExperienceDirective);
    let doubleTapFired = false;
    
    // الاستماع لحدث الضغط المزدوج المخصص
    divNativeEl.addEventListener('app-double-tap', () => {
      doubleTapFired = true;
    });
    
    // تعيين قيم بدء ونهاية اللمس يدويًا
    directive['touchStartX'] = 100;
    directive['touchStartY'] = 100;
    directive['touchEndX'] = 100;
    directive['touchEndY'] = 100;
    
    // تعيين وقت النقرة الأخيرة ليكون قريبًا من الوقت الحالي
    directive['lastTapTime'] = Date.now() - 100; // قبل 100 مللي ثانية
    
    // محاكاة حدث نهاية اللمس
    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: []
    });
    
    divNativeEl.dispatchEvent(touchEndEvent);
    
    expect(doubleTapFired).toBeTruthy();
  });

  // التحقق من إطلاق حدث الضغط الطويل
  it('يجب إطلاق حدث الضغط الطويل عند الضغط لفترة طويلة', (done) => {
    const directive = divEl.injector.get(MobileExperienceDirective);
    let longPressFired = false;
    
    // الاستماع لحدث الضغط الطويل المخصص
    divNativeEl.addEventListener('app-long-press', () => {
      longPressFired = true;
    });
    
    // تعيين وقت بدء اللمس ليكون قبل الحد الأدنى للضغط الطويل
    directive['touchStartTime'] = Date.now() - 600; // قبل 600 مللي ثانية
    directive['longPressThreshold'] = 500; // 500 مللي ثانية
    
    // محاكاة حدث الضغط الطويل
    directive['onLongPress']();
    
    // التحقق بعد فترة قصيرة
    setTimeout(() => {
      expect(longPressFired).toBeTruthy();
      done();
    }, 100);
  });
});
