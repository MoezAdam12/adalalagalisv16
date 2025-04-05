import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * توجيه إمكانية الوصول
 * يضيف سمات ARIA وتحسينات إمكانية الوصول إلى العناصر
 */
@Directive({
  selector: '[appAccessibility]'
})
export class AccessibilityDirective implements OnInit {
  @Input() ariaLabel: string;
  @Input() ariaDescribedby: string;
  @Input() ariaLabelledby: string;
  @Input() role: string;
  @Input() tabindex: number;
  @Input() focusable: boolean = true;
  @Input() highContrast: boolean = false;
  @Input() largeText: boolean = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.applyAccessibilityAttributes();
  }

  /**
   * تطبيق سمات إمكانية الوصول على العنصر
   */
  private applyAccessibilityAttributes(): void {
    const element = this.el.nativeElement;

    // إضافة سمات ARIA
    if (this.ariaLabel) {
      this.renderer.setAttribute(element, 'aria-label', this.ariaLabel);
    }

    if (this.ariaDescribedby) {
      this.renderer.setAttribute(element, 'aria-describedby', this.ariaDescribedby);
    }

    if (this.ariaLabelledby) {
      this.renderer.setAttribute(element, 'aria-labelledby', this.ariaLabelledby);
    }

    // إضافة دور العنصر
    if (this.role) {
      this.renderer.setAttribute(element, 'role', this.role);
    }

    // إضافة فهرس الجدولة
    if (this.tabindex !== undefined) {
      this.renderer.setAttribute(element, 'tabindex', this.tabindex.toString());
    }

    // تعيين قابلية التركيز
    if (!this.focusable) {
      this.renderer.setAttribute(element, 'tabindex', '-1');
      this.renderer.setAttribute(element, 'aria-hidden', 'true');
    }

    // تطبيق نمط التباين العالي
    if (this.highContrast) {
      this.renderer.addClass(element, 'high-contrast');
    }

    // تطبيق نمط النص الكبير
    if (this.largeText) {
      this.renderer.addClass(element, 'large-text');
    }

    // إضافة مستمع لأحداث لوحة المفاتيح للعناصر التفاعلية
    if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
        element.tagName === 'INPUT' || element.tagName === 'SELECT') {
      this.addKeyboardEventListeners(element);
    }
  }

  /**
   * إضافة مستمعي أحداث لوحة المفاتيح
   * @param element العنصر المراد إضافة المستمعين إليه
   */
  private addKeyboardEventListeners(element: HTMLElement): void {
    // إضافة مستمع لحدث الضغط على مفتاح Enter
    this.renderer.listen(element, 'keydown.enter', (event) => {
      if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
        event.preventDefault();
        element.click();
      }
    });

    // إضافة مستمع لحدث الضغط على مفتاح Space
    this.renderer.listen(element, 'keydown.space', (event) => {
      if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
        event.preventDefault();
        element.click();
      }
    });
  }
}
