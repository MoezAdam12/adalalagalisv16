import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * توجيه تجربة الأجهزة المحمولة
 * يضيف دعمًا للإيماءات اللمسية وتحسينات لتجربة المستخدم على الأجهزة المحمولة
 */
@Directive({
  selector: '[appMobileExperience]'
})
export class MobileExperienceDirective implements OnInit {
  @Input() touchFeedback: boolean = true;
  @Input() swipeEnabled: boolean = false;
  @Input() pinchZoomEnabled: boolean = false;
  @Input() doubleTapEnabled: boolean = false;
  @Input() longPressEnabled: boolean = false;

  // متغيرات لتتبع الإيماءات
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private lastTapTime: number = 0;
  private touchStartTime: number = 0;
  private longPressThreshold: number = 500; // بالمللي ثانية
  private swipeThreshold: number = 50; // بالبكسل
  private doubleTapThreshold: number = 300; // بالمللي ثانية

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // إضافة فئة للأجهزة المحمولة
    if (this.isMobileDevice()) {
      this.renderer.addClass(this.el.nativeElement, 'mobile-device');
    }

    // تعطيل التكبير/التصغير بالضغط المزدوج الافتراضي إذا كان مطلوبًا
    if (this.pinchZoomEnabled || this.doubleTapEnabled) {
      this.disableDefaultTouchBehavior();
    }
  }

  /**
   * مستمع لحدث بدء اللمس
   * @param event حدث اللمس
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    // تخزين موقع بدء اللمس
    if (event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      this.touchStartTime = Date.now();

      // إضافة تأثير اللمس
      if (this.touchFeedback) {
        this.renderer.addClass(this.el.nativeElement, 'touch-active');
      }

      // بدء مؤقت الضغط الطويل
      if (this.longPressEnabled) {
        setTimeout(() => {
          const currentTime = Date.now();
          if (currentTime - this.touchStartTime >= this.longPressThreshold) {
            this.onLongPress();
          }
        }, this.longPressThreshold);
      }
    }
  }

  /**
   * مستمع لحدث تحرك اللمس
   * @param event حدث اللمس
   */
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    // تحديث موقع نهاية اللمس
    if (event.touches.length > 0) {
      this.touchEndX = event.touches[0].clientX;
      this.touchEndY = event.touches[0].clientY;

      // إلغاء تأثير اللمس إذا تحرك المستخدم بعيدًا
      if (this.touchFeedback && this.getDistance() > 10) {
        this.renderer.removeClass(this.el.nativeElement, 'touch-active');
      }
    }
  }

  /**
   * مستمع لحدث نهاية اللمس
   * @param event حدث اللمس
   */
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    // إزالة تأثير اللمس
    if (this.touchFeedback) {
      this.renderer.removeClass(this.el.nativeElement, 'touch-active');
    }

    // حساب المسافة والاتجاه
    const distance = this.getDistance();
    const direction = this.getDirection();

    // التحقق من السحب
    if (this.swipeEnabled && distance > this.swipeThreshold) {
      this.onSwipe(direction);
    }

    // التحقق من الضغط المزدوج
    if (this.doubleTapEnabled) {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastTapTime;

      if (timeDiff < this.doubleTapThreshold && distance < 10) {
        this.onDoubleTap();
        this.lastTapTime = 0; // إعادة تعيين لتجنب الضغط المزدوج المتكرر
      } else {
        this.lastTapTime = currentTime;
      }
    }
  }

  /**
   * مستمع لحدث إلغاء اللمس
   */
  @HostListener('touchcancel')
  onTouchCancel(): void {
    // إزالة تأثير اللمس
    if (this.touchFeedback) {
      this.renderer.removeClass(this.el.nativeElement, 'touch-active');
    }
  }

  /**
   * التحقق مما إذا كان الجهاز محمولاً
   * @returns ما إذا كان الجهاز محمولاً
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * تعطيل سلوك اللمس الافتراضي
   */
  private disableDefaultTouchBehavior(): void {
    // تعطيل التكبير/التصغير بالضغط المزدوج
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: pan-x pan-y;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * حساب المسافة بين نقطة البداية والنهاية
   * @returns المسافة بالبكسل
   */
  private getDistance(): number {
    const dx = this.touchEndX - this.touchStartX;
    const dy = this.touchEndY - this.touchStartY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * تحديد اتجاه السحب
   * @returns اتجاه السحب (up, down, left, right)
   */
  private getDirection(): 'up' | 'down' | 'left' | 'right' {
    const dx = this.touchEndX - this.touchStartX;
    const dy = this.touchEndY - this.touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * معالجة حدث السحب
   * @param direction اتجاه السحب
   */
  private onSwipe(direction: 'up' | 'down' | 'left' | 'right'): void {
    // إطلاق حدث مخصص للسحب
    const swipeEvent = new CustomEvent('app-swipe', {
      bubbles: true,
      detail: { direction }
    });
    this.el.nativeElement.dispatchEvent(swipeEvent);
  }

  /**
   * معالجة حدث الضغط المزدوج
   */
  private onDoubleTap(): void {
    // إطلاق حدث مخصص للضغط المزدوج
    const doubleTapEvent = new CustomEvent('app-double-tap', {
      bubbles: true
    });
    this.el.nativeElement.dispatchEvent(doubleTapEvent);
  }

  /**
   * معالجة حدث الضغط الطويل
   */
  private onLongPress(): void {
    // التحقق من أن المستخدم لا يزال يضغط
    if (Date.now() - this.touchStartTime >= this.longPressThreshold) {
      // إطلاق حدث مخصص للضغط الطويل
      const longPressEvent = new CustomEvent('app-long-press', {
        bubbles: true
      });
      this.el.nativeElement.dispatchEvent(longPressEvent);
    }
  }
}
