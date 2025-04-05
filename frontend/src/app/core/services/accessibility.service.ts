import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * خدمة إمكانية الوصول
 * توفر وظائف وإعدادات لتحسين إمكانية الوصول في التطبيق
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  // إعدادات إمكانية الوصول الافتراضية
  private defaultSettings = {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    autoFocus: true,
    textToSpeech: false,
    fontFamily: 'default'
  };

  // موضوع سلوكي لإعدادات إمكانية الوصول
  private accessibilitySettingsSubject = new BehaviorSubject<any>(this.loadSettings());
  
  // ملاحظة قابلة للمراقبة للإعدادات
  public accessibilitySettings$ = this.accessibilitySettingsSubject.asObservable();

  constructor() {
    // تطبيق الإعدادات عند بدء التشغيل
    this.applySettings(this.accessibilitySettingsSubject.value);
    
    // الاستماع لتغييرات وسائط prefers-reduced-motion
    this.listenToMediaQueries();
  }

  /**
   * تحديث إعدادات إمكانية الوصول
   * @param settings الإعدادات المراد تحديثها
   */
  updateSettings(settings: Partial<typeof this.defaultSettings>): void {
    const currentSettings = this.accessibilitySettingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    
    // حفظ الإعدادات الجديدة
    this.saveSettings(newSettings);
    
    // تحديث الموضوع السلوكي
    this.accessibilitySettingsSubject.next(newSettings);
    
    // تطبيق الإعدادات الجديدة
    this.applySettings(newSettings);
  }

  /**
   * تحميل إعدادات إمكانية الوصول من التخزين المحلي
   * @returns إعدادات إمكانية الوصول
   */
  private loadSettings(): typeof this.defaultSettings {
    try {
      const savedSettings = localStorage.getItem('accessibilitySettings');
      return savedSettings ? { ...this.defaultSettings, ...JSON.parse(savedSettings) } : this.defaultSettings;
    } catch (error) {
      console.error('فشل تحميل إعدادات إمكانية الوصول:', error);
      return this.defaultSettings;
    }
  }

  /**
   * حفظ إعدادات إمكانية الوصول في التخزين المحلي
   * @param settings إعدادات إمكانية الوصول
   */
  private saveSettings(settings: typeof this.defaultSettings): void {
    try {
      localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('فشل حفظ إعدادات إمكانية الوصول:', error);
    }
  }

  /**
   * تطبيق إعدادات إمكانية الوصول على المستند
   * @param settings إعدادات إمكانية الوصول
   */
  private applySettings(settings: typeof this.defaultSettings): void {
    // تطبيق وضع التباين العالي
    if (settings.highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
    
    // تطبيق وضع النص الكبير
    if (settings.largeText) {
      document.body.classList.add('large-text-mode');
    } else {
      document.body.classList.remove('large-text-mode');
    }
    
    // تطبيق وضع تقليل الحركة
    if (settings.reducedMotion) {
      document.body.classList.add('reduced-motion-mode');
    } else {
      document.body.classList.remove('reduced-motion-mode');
    }
    
    // تطبيق وضع التنقل بلوحة المفاتيح
    if (settings.keyboardNavigation) {
      document.body.classList.add('keyboard-navigation-mode');
    } else {
      document.body.classList.remove('keyboard-navigation-mode');
    }
    
    // تطبيق عائلة الخط
    document.body.style.setProperty('--accessibility-font-family', this.getFontFamily(settings.fontFamily));
  }

  /**
   * الحصول على عائلة الخط المناسبة
   * @param fontFamily اسم عائلة الخط
   * @returns قيمة CSS لعائلة الخط
   */
  private getFontFamily(fontFamily: string): string {
    switch (fontFamily) {
      case 'dyslexic':
        return '"OpenDyslexic", "Noto Sans Arabic", sans-serif';
      case 'readable':
        return '"Verdana", "Noto Sans Arabic", sans-serif';
      case 'monospace':
        return '"Courier New", "Noto Sans Arabic", monospace';
      default:
        return '"Noto Sans Arabic", "Arial", sans-serif';
    }
  }

  /**
   * الاستماع لتغييرات وسائط CSS
   */
  private listenToMediaQueries(): void {
    // الاستماع لتفضيل تقليل الحركة
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotionChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        this.updateSettings({ reducedMotion: true });
      }
    };
    
    // التحقق من الحالة الأولية
    handleReducedMotionChange(reducedMotionQuery);
    
    // الاستماع للتغييرات
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    
    // الاستماع لتفضيل التباين العالي
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleHighContrastChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        this.updateSettings({ highContrast: true });
      }
    };
    
    // التحقق من الحالة الأولية
    handleHighContrastChange(highContrastQuery);
    
    // الاستماع للتغييرات
    highContrastQuery.addEventListener('change', handleHighContrastChange);
  }

  /**
   * إعلان رسالة لقارئات الشاشة
   * @param message الرسالة المراد إعلانها
   * @param priority أولوية الرسالة (polite أو assertive)
   */
  announceForScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    // التحقق من تمكين قارئ الشاشة
    if (!this.accessibilitySettingsSubject.value.screenReader) {
      return;
    }
    
    // إنشاء عنصر live region إذا لم يكن موجودًا
    let liveRegion = document.getElementById(`accessibility-announce-${priority}`);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = `accessibility-announce-${priority}`;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.classList.add('sr-only'); // إخفاء العنصر بصريًا
      document.body.appendChild(liveRegion);
    }
    
    // تحديث محتوى العنصر لإعلان الرسالة
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }

  /**
   * تحويل النص إلى كلام
   * @param text النص المراد تحويله إلى كلام
   * @param options خيارات النطق
   */
  speak(text: string, options: SpeechSynthesisUtterance = new SpeechSynthesisUtterance()): void {
    // التحقق من تمكين تحويل النص إلى كلام
    if (!this.accessibilitySettingsSubject.value.textToSpeech) {
      return;
    }
    
    // التحقق من دعم تحويل النص إلى كلام
    if (!('speechSynthesis' in window)) {
      console.warn('تحويل النص إلى كلام غير مدعوم في هذا المتصفح');
      return;
    }
    
    // إيقاف أي كلام حالي
    window.speechSynthesis.cancel();
    
    // تعيين النص
    options.text = text;
    
    // تعيين اللغة إذا لم يتم تعيينها
    if (!options.lang) {
      options.lang = document.documentElement.lang || 'ar-SA';
    }
    
    // نطق النص
    window.speechSynthesis.speak(options);
  }

  /**
   * التركيز على عنصر مع إعلان اختياري
   * @param element العنصر المراد التركيز عليه
   * @param announcement إعلان اختياري لقارئات الشاشة
   */
  focusElement(element: HTMLElement, announcement?: string): void {
    if (element) {
      // التركيز على العنصر
      element.focus();
      
      // إعلان للقارئات إذا تم توفير إعلان
      if (announcement) {
        this.announceForScreenReader(announcement);
      }
    }
  }

  /**
   * إضافة مؤشر تركيز مرئي إلى العنصر
   * @param element العنصر المراد إضافة مؤشر التركيز إليه
   */
  addFocusIndicator(element: HTMLElement): void {
    if (element) {
      element.classList.add('focus-visible');
      
      // إزالة الفئة عند فقدان التركيز
      const onBlur = () => {
        element.classList.remove('focus-visible');
        element.removeEventListener('blur', onBlur);
      };
      
      element.addEventListener('blur', onBlur);
    }
  }
}
