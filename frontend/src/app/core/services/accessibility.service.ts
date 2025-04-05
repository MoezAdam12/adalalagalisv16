import { Injectable } from '@angular/core';

/**
 * خدمة تحسين إمكانية الوصول
 * توفر وظائف وأدوات لتحسين إمكانية الوصول في التطبيق
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  // إعدادات إمكانية الوصول الافتراضية
  private settings = {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    focusVisible: true
  };

  constructor() {
    this.loadSettings();
    this.applySettings();
    this.setupEventListeners();
  }

  /**
   * تحميل إعدادات إمكانية الوصول من التخزين المحلي
   */
  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('accessibility_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
      
      // التحقق من تفضيلات النظام
      this.checkSystemPreferences();
    } catch (error) {
      console.error('فشل في تحميل إعدادات إمكانية الوصول:', error);
    }
  }

  /**
   * التحقق من تفضيلات النظام لإمكانية الوصول
   */
  private checkSystemPreferences(): void {
    // التحقق من تفضيل التباين العالي
    const prefersContrast = window.matchMedia('(prefers-contrast: more)');
    if (prefersContrast.matches) {
      this.settings.highContrast = true;
    }

    // التحقق من تفضيل تقليل الحركة
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      this.settings.reducedMotion = true;
    }
  }

  /**
   * تطبيق إعدادات إمكانية الوصول على المستند
   */
  private applySettings(): void {
    // تطبيق وضع التباين العالي
    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }

    // تطبيق وضع النص الكبير
    if (this.settings.largeText) {
      document.body.classList.add('large-text-mode');
    } else {
      document.body.classList.remove('large-text-mode');
    }

    // تطبيق وضع تقليل الحركة
    if (this.settings.reducedMotion) {
      document.body.classList.add('reduced-motion-mode');
    } else {
      document.body.classList.remove('reduced-motion-mode');
    }

    // تطبيق وضع قارئ الشاشة
    if (this.settings.screenReader) {
      document.body.classList.add('screen-reader-mode');
    } else {
      document.body.classList.remove('screen-reader-mode');
    }

    // تطبيق وضع التركيز المرئي
    if (this.settings.focusVisible) {
      document.body.classList.add('focus-visible-mode');
    } else {
      document.body.classList.remove('focus-visible-mode');
    }
  }

  /**
   * إعداد مستمعي الأحداث
   */
  private setupEventListeners(): void {
    // مستمع لتغييرات تفضيل التباين
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: more)');
    contrastMediaQuery.addEventListener('change', (e) => {
      this.settings.highContrast = e.matches;
      this.saveAndApplySettings();
    });

    // مستمع لتغييرات تفضيل تقليل الحركة
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMediaQuery.addEventListener('change', (e) => {
      this.settings.reducedMotion = e.matches;
      this.saveAndApplySettings();
    });

    // إضافة مستمع لأحداث التركيز
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * معالجة حدث التركيز
   * @param event حدث التركيز
   */
  private handleFocusIn(event: FocusEvent): void {
    if (!this.settings.focusVisible) return;
    
    const target = event.target as HTMLElement;
    if (target) {
      // إضافة فئة للعنصر المركز عليه
      target.classList.add('focus-visible');
      
      // إزالة الفئة عند فقدان التركيز
      const handleBlur = () => {
        target.classList.remove('focus-visible');
        target.removeEventListener('blur', handleBlur);
      };
      
      target.addEventListener('blur', handleBlur);
    }
  }

  /**
   * معالجة أحداث المفاتيح
   * @param event حدث المفاتيح
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // تنفيذ اختصارات لوحة المفاتيح لإمكانية الوصول
    // Alt + A لفتح قائمة إمكانية الوصول
    if (event.altKey && event.key === 'a') {
      event.preventDefault();
      this.toggleAccessibilityMenu();
    }
  }

  /**
   * تبديل قائمة إمكانية الوصول
   */
  private toggleAccessibilityMenu(): void {
    // التحقق من وجود قائمة إمكانية الوصول
    let accessibilityMenu = document.getElementById('accessibility-menu');
    
    if (accessibilityMenu) {
      // إذا كانت القائمة موجودة، قم بتبديل حالة العرض
      accessibilityMenu.style.display = accessibilityMenu.style.display === 'none' ? 'block' : 'none';
    } else {
      // إنشاء قائمة إمكانية الوصول
      this.createAccessibilityMenu();
    }
  }

  /**
   * إنشاء قائمة إمكانية الوصول
   */
  private createAccessibilityMenu(): void {
    const menu = document.createElement('div');
    menu.id = 'accessibility-menu';
    menu.className = 'accessibility-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-labelledby', 'accessibility-title');
    
    menu.innerHTML = `
      <div class="accessibility-header">
        <h2 id="accessibility-title">إعدادات إمكانية الوصول</h2>
        <button class="close-button" aria-label="إغلاق">&times;</button>
      </div>
      <div class="accessibility-options">
        <div class="option">
          <label for="high-contrast">وضع التباين العالي</label>
          <input type="checkbox" id="high-contrast" ${this.settings.highContrast ? 'checked' : ''}>
        </div>
        <div class="option">
          <label for="large-text">وضع النص الكبير</label>
          <input type="checkbox" id="large-text" ${this.settings.largeText ? 'checked' : ''}>
        </div>
        <div class="option">
          <label for="reduced-motion">تقليل الحركة</label>
          <input type="checkbox" id="reduced-motion" ${this.settings.reducedMotion ? 'checked' : ''}>
        </div>
        <div class="option">
          <label for="screen-reader">وضع قارئ الشاشة</label>
          <input type="checkbox" id="screen-reader" ${this.settings.screenReader ? 'checked' : ''}>
        </div>
        <div class="option">
          <label for="focus-visible">إبراز التركيز</label>
          <input type="checkbox" id="focus-visible" ${this.settings.focusVisible ? 'checked' : ''}>
        </div>
      </div>
    `;
    
    // إضافة أنماط CSS
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-menu {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        width: 350px;
        max-width: 90vw;
        direction: rtl;
      }
      
      .accessibility-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #eee;
      }
      
      .accessibility-header h2 {
        margin: 0;
        font-size: 18px;
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }
      
      .accessibility-options {
        padding: 16px;
      }
      
      .option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .option label {
        font-size: 16px;
        color: #333;
      }
      
      .option input[type="checkbox"] {
        width: 20px;
        height: 20px;
      }
      
      /* أنماط وضع التباين العالي */
      .high-contrast-mode {
        filter: contrast(1.5);
      }
      
      /* أنماط وضع النص الكبير */
      .large-text-mode {
        font-size: 120% !important;
      }
      
      /* أنماط وضع تقليل الحركة */
      .reduced-motion-mode * {
        animation-duration: 0.001s !important;
        transition-duration: 0.001s !important;
      }
      
      /* أنماط وضع قارئ الشاشة */
      .screen-reader-mode .sr-only {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: normal !important;
        border: 1px solid #333 !important;
        background-color: #f5f5f5 !important;
        color: #333 !important;
        display: block !important;
        padding: 8px !important;
        margin-bottom: 8px !important;
      }
      
      /* أنماط وضع إبراز التركيز */
      .focus-visible-mode :focus {
        outline: 3px solid #3f51b5 !important;
        outline-offset: 2px !important;
      }
      
      .focus-visible {
        outline: 3px solid #3f51b5 !important;
        outline-offset: 2px !important;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(menu);
    
    // إضافة مستمعي الأحداث
    const closeButton = menu.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      menu.style.display = 'none';
    });
    
    // مستمعي أحداث خيارات إمكانية الوصول
    const highContrastCheckbox = document.getElementById('high-contrast') as HTMLInputElement;
    highContrastCheckbox.addEventListener('change', () => {
      this.toggleHighContrast(highContrastCheckbox.checked);
    });
    
    const largeTextCheckbox = document.getElementById('large-text') as HTMLInputElement;
    largeTextCheckbox.addEventListener('change', () => {
      this.toggleLargeText(largeTextCheckbox.checked);
    });
    
    const reducedMotionCheckbox = document.getElementById('reduced-motion') as HTMLInputElement;
    reducedMotionCheckbox.addEventListener('change', () => {
      this.toggleReducedMotion(reducedMotionCheckbox.checked);
    });
    
    const screenReaderCheckbox = document.getElementById('screen-reader') as HTMLInputElement;
    screenReaderCheckbox.addEventListener('change', () => {
      this.toggleScreenReader(screenReaderCheckbox.checked);
    });
    
    const focusVisibleCheckbox = document.getElementById('focus-visible') as HTMLInputElement;
    focusVisibleCheckbox.addEventListener('change', () => {
      this.toggleFocusVisible(focusVisibleCheckbox.checked);
    });
  }

  /**
   * تبديل وضع التباين العالي
   * @param enabled تمكين أو تعطيل
   */
  public toggleHighContrast(enabled: boolean): void {
    this.settings.highContrast = enabled;
    this.saveAndApplySettings();
  }

  /**
   * تبديل وضع النص الكبير
   * @param enabled تمكين أو تعطيل
   */
  public toggleLargeText(enabled: boolean): void {
    this.settings.largeText = enabled;
    this.saveAndApplySettings();
  }

  /**
   * تبديل وضع تقليل الحركة
   * @param enabled تمكين أو تعطيل
   */
  public toggleReducedMotion(enabled: boolean): void {
    this.settings.reducedMotion = enabled;
    this.saveAndApplySettings();
  }

  /**
   * تبديل وضع قارئ الشاشة
   * @param enabled تمكين أو تعطيل
   */
  public toggleScreenReader(enabled: boolean): void {
    this.settings.screenReader = enabled;
    this.saveAndApplySettings();
  }

  /**
   * تبديل وضع إبراز التركيز
   * @param enabled تمكين أو تعطيل
   */
  public toggleFocusVisible(enabled: boolean): void {
    this.settings.focusVisible = enabled;
    this.saveAndApplySettings();
  }

  /**
   * حفظ وتطبيق الإعدادات
   */
  private saveAndApplySettings(): void {
    try {
      localStorage.setItem('accessibility_settings', JSON.stringify(this.settings));
      this.applySettings();
    } catch (error) {
      console.error('فشل في حفظ إعدادات إمكانية الوصول:', error);
    }
  }

  /**
   * إضافة نص للقراءة الشاشية فقط
   * @param element العنصر المراد إضافة النص إليه
   * @param text النص للقراءة الشاشية
   */
  public addScreenReaderText(element: HTMLElement, text: string): void {
    const srElement = document.createElement('span');
    srElement.className = 'sr-only';
    srElement.textContent = text;
    element.appendChild(srElement);
  }

  /**
   * تحسين إمكانية الوصول للجداول
   * @param tableElement عنصر الجدول
   * @param caption وصف الجدول
   * @param summary ملخص الجدول
   */
  public enhanceTableAccessibility(tableElement: HTMLTableElement, caption: string, summary?: string): void {
    // إضافة وصف للجدول
    let captionElement = tableElement.querySelector('caption');
    if (!captionElement) {
      captionElement = document.createElement('caption');
      tableElement.prepend(captionElement);
    }
    captionElement.textContent = caption;
    
    // إضافة ملخص للجدول
    if (summary) {
      tableElement.setAttribute('summary', summary);
    }
    
    // التأكد من وجود رؤوس للجدول
    const headerRow = tableElement.querySelector('thead tr');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th');
      headerCells.forEach((cell, index) => {
        cell.setAttribute('scope', 'col');
        cell.setAttribute('id', `col-${index}`);
      });
      
      // ربط خلايا الجدول برؤوسها
      const bodyRows = tableElement.querySelectorAll('tbody tr');
      bodyRows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, colIndex) => {
          cell.setAttribute('headers', `col-${colIndex}`);
        });
      });
    }
  }

  /**
   * تحسين إمكانية الوصول للنماذج
   * @param formElement عنصر النموذج
   */
  public enhanceFormAccessibility(formElement: HTMLFormElement): void {
    // التأكد من وجود تسميات لجميع حقول الإدخال
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach((input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, index) => {
      // التحقق من وجود تسمية مرتبطة
      const inputId = input.id || `input-${index}`;
      input.id = inputId;
      
      let label = document.querySelector(`label[for="${inputId}"]`);
      if (!label) {
        // البحث عن تسمية محتملة في العنصر الأب
        const parentLabel = input.closest('label');
        if (!parentLabel) {
          // إنشاء تسمية جديدة
          label = document.createElement('label');
          label.setAttribute('for', inputId);
          label.textContent = input.placeholder || `حقل ${index + 1}`;
          input.parentNode.insertBefore(label, input);
        }
      }
      
      // إضافة سمات ARIA
      if (input.required) {
        input.setAttribute('aria-required', 'true');
      }
      
      if (input.getAttribute('aria-describedby') === null && input.getAttribute('aria-labelledby') === null) {
        // البحث عن نص المساعدة
        const helpText = input.parentElement.querySelector('.help-text, .hint, .description');
        if (helpText) {
          const helpId = helpText.id || `help-${inputId}`;
          helpText.id = helpId;
          input.setAttribute('aria-describedby', helpId);
        }
      }
    });
    
    // تحسين رسائل الخطأ
    const errorMessages = formElement.querySelectorAll('.error-message, .invalid-feedback');
    errorMessages.forEach((errorMessage, index) => {
      const errorId = errorMessage.id || `error-${index}`;
      errorMessage.id = errorId;
      errorMessage.setAttribute('role', 'alert');
      errorMessage.setAttribute('aria-live', 'assertive');
      
      // البحث عن حقل الإدخال المرتبط
      const input = errorMessage.parentElement.querySelector('input, select, textarea');
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-errormessage', errorId);
      }
    });
  }

  /**
   * إضافة زر تخطي التنقل
   * @param targetId معرف العنصر المستهدف
   */
  public addSkipNavigationLink(targetId: string): void {
    // التحقق من وجود زر تخطي التنقل
    if (document.getElementById('skip-navigation')) {
      return;
    }
    
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-navigation';
    skipLink.href = `#${targetId}`;
    skipLink.textContent = 'تخطي إلى المحتوى الرئيسي';
    skipLink.className = 'skip-navigation';
    
    // إضافة أنماط CSS
    const style = document.createElement('style');
    style.textContent = `
      .skip-navigation {
        position: absolute;
        top: -40px;
        left: 0;
        background-color: #3f51b5;
        color: white;
        padding: 8px 16px;
        z-index: 9999;
        text-decoration: none;
        transition: top 0.3s;
      }
      
      .skip-navigation:focus {
        top: 0;
      }
    `;
    
    document.head.appendChild(style);
    document.body.prepend(skipLink);
  }

  /**
   * الحصول على إعدادات إمكانية الوصول الحالية
   * @returns إعدادات إمكانية الوصول
   */
  public getSettings(): any {
    return { ...this.settings };
  }
}
