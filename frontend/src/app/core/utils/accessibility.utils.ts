/**
 * accessibility.utils.ts
 * أدوات مساعدة لتحسين إمكانية الوصول في التطبيق
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  /**
   * حجم الخط الحالي (بالنسبة المئوية)
   */
  private currentFontSize = 100;

  /**
   * مستوى التباين الحالي
   */
  private currentContrast: 'normal' | 'high' | 'inverted' = 'normal';

  /**
   * حالة تمكين وضع قارئ الشاشة
   */
  private screenReaderMode = false;

  /**
   * الحصول على حجم الخط الحالي
   * @returns حجم الخط الحالي بالنسبة المئوية
   */
  getFontSize(): number {
    return this.currentFontSize;
  }

  /**
   * زيادة حجم الخط
   * @param step مقدار الزيادة (بالنسبة المئوية)
   */
  increaseFontSize(step = 10): void {
    if (this.currentFontSize < 200) {
      this.currentFontSize += step;
      this.applyFontSize();
    }
  }

  /**
   * تقليل حجم الخط
   * @param step مقدار النقصان (بالنسبة المئوية)
   */
  decreaseFontSize(step = 10): void {
    if (this.currentFontSize > 70) {
      this.currentFontSize -= step;
      this.applyFontSize();
    }
  }

  /**
   * إعادة تعيين حجم الخط إلى القيمة الافتراضية
   */
  resetFontSize(): void {
    this.currentFontSize = 100;
    this.applyFontSize();
  }

  /**
   * تطبيق حجم الخط الحالي على المستند
   */
  private applyFontSize(): void {
    document.documentElement.style.fontSize = `${this.currentFontSize}%`;
  }

  /**
   * الحصول على مستوى التباين الحالي
   * @returns مستوى التباين الحالي
   */
  getContrast(): 'normal' | 'high' | 'inverted' {
    return this.currentContrast;
  }

  /**
   * تعيين مستوى التباين
   * @param contrast مستوى التباين المطلوب
   */
  setContrast(contrast: 'normal' | 'high' | 'inverted'): void {
    this.currentContrast = contrast;
    this.applyContrast();
  }

  /**
   * تبديل مستوى التباين بين القيم المتاحة
   */
  toggleContrast(): void {
    switch (this.currentContrast) {
      case 'normal':
        this.setContrast('high');
        break;
      case 'high':
        this.setContrast('inverted');
        break;
      case 'inverted':
        this.setContrast('normal');
        break;
    }
  }

  /**
   * تطبيق مستوى التباين الحالي على المستند
   */
  private applyContrast(): void {
    // إزالة جميع فئات التباين السابقة
    document.body.classList.remove('contrast-normal', 'contrast-high', 'contrast-inverted');
    
    // إضافة فئة التباين الحالية
    document.body.classList.add(`contrast-${this.currentContrast}`);
  }

  /**
   * الحصول على حالة وضع قارئ الشاشة
   * @returns حالة تمكين وضع قارئ الشاشة
   */
  getScreenReaderMode(): boolean {
    return this.screenReaderMode;
  }

  /**
   * تبديل وضع قارئ الشاشة
   */
  toggleScreenReaderMode(): void {
    this.screenReaderMode = !this.screenReaderMode;
    this.applyScreenReaderMode();
  }

  /**
   * تطبيق وضع قارئ الشاشة على المستند
   */
  private applyScreenReaderMode(): void {
    if (this.screenReaderMode) {
      document.body.classList.add('screen-reader-mode');
    } else {
      document.body.classList.remove('screen-reader-mode');
    }
  }

  /**
   * إضافة سمات ARIA إلى عنصر
   * @param element العنصر المراد إضافة سمات ARIA إليه
   * @param attributes سمات ARIA المراد إضافتها
   */
  addAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, value);
    });
  }

  /**
   * إضافة تلميح للعنصر
   * @param element العنصر المراد إضافة تلميح له
   * @param tooltip نص التلميح
   */
  addTooltip(element: HTMLElement, tooltip: string): void {
    element.setAttribute('title', tooltip);
    element.setAttribute('aria-label', tooltip);
  }

  /**
   * التحقق من تباين الألوان بين لونين
   * @param foreground لون النص
   * @param background لون الخلفية
   * @returns نسبة التباين
   */
  checkColorContrast(foreground: string, background: string): number {
    // تحويل الألوان إلى قيم RGB
    const fgRgb = this.hexToRgb(foreground);
    const bgRgb = this.hexToRgb(background);
    
    if (!fgRgb || !bgRgb) {
      return 0;
    }
    
    // حساب نسبة التباين وفقًا لمعايير WCAG
    const fgLuminance = this.calculateLuminance(fgRgb);
    const bgLuminance = this.calculateLuminance(bgRgb);
    
    const ratio = fgLuminance > bgLuminance
      ? (fgLuminance + 0.05) / (bgLuminance + 0.05)
      : (bgLuminance + 0.05) / (fgLuminance + 0.05);
    
    return Math.round(ratio * 100) / 100;
  }

  /**
   * تحويل لون من تنسيق HEX إلى RGB
   * @param hex لون بتنسيق HEX
   * @returns كائن يحتوي على قيم RGB
   */
  private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * حساب إضاءة لون RGB
   * @param rgb كائن يحتوي على قيم RGB
   * @returns قيمة الإضاءة
   */
  private calculateLuminance(rgb: { r: number, g: number, b: number }): number {
    const { r, g, b } = rgb;
    
    // تحويل قيم RGB إلى قيم نسبية
    const rsrgb = r / 255;
    const gsrgb = g / 255;
    const bsrgb = b / 255;
    
    // حساب قيم RGB المعدلة
    const rc = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
    const gc = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
    const bc = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);
    
    // حساب الإضاءة وفقًا لمعادلة WCAG
    return 0.2126 * rc + 0.7152 * gc + 0.0722 * bc;
  }

  /**
   * تهيئة خدمة إمكانية الوصول
   */
  initialize(): void {
    // تطبيق الإعدادات الافتراضية
    this.applyFontSize();
    this.applyContrast();
    this.applyScreenReaderMode();
    
    // إضافة مستمع لمفتاح Tab لتحسين التنقل باستخدام لوحة المفاتيح
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    // إزالة تأثير التنقل باستخدام لوحة المفاتيح عند استخدام الماوس
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
}
