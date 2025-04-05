import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * خدمة تجربة الأجهزة المحمولة
 * توفر وظائف وإعدادات لتحسين تجربة المستخدم على الأجهزة المحمولة
 */
@Injectable({
  providedIn: 'root'
})
export class MobileExperienceService {
  // إعدادات تجربة الأجهزة المحمولة الافتراضية
  private defaultSettings = {
    enableTouchGestures: true,
    enablePinchZoom: true,
    enableSwipe: true,
    enableDoubleTap: true,
    enableLongPress: true,
    touchFeedback: true,
    largeTargets: true,
    optimizeForSmallScreens: true,
    adaptiveLayout: true,
    bottomNavigation: true
  };

  // موضوع سلوكي لإعدادات تجربة الأجهزة المحمولة
  private mobileSettingsSubject = new BehaviorSubject<any>(this.loadSettings());
  
  // ملاحظة قابلة للمراقبة للإعدادات
  public mobileSettings$ = this.mobileSettingsSubject.asObservable();

  // حالة الجهاز المحمول
  private _isMobileDevice: boolean;
  private _isTabletDevice: boolean;
  private _screenWidth: number;
  private _screenHeight: number;
  private _orientation: 'portrait' | 'landscape';

  constructor() {
    // تحديد نوع الجهاز
    this.detectDeviceType();
    
    // تطبيق الإعدادات عند بدء التشغيل
    this.applySettings(this.mobileSettingsSubject.value);
    
    // الاستماع لتغييرات حجم النافذة واتجاهها
    this.listenToWindowChanges();
  }

  /**
   * تحديث إعدادات تجربة الأجهزة المحمولة
   * @param settings الإعدادات المراد تحديثها
   */
  updateSettings(settings: Partial<typeof this.defaultSettings>): void {
    const currentSettings = this.mobileSettingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    
    // حفظ الإعدادات الجديدة
    this.saveSettings(newSettings);
    
    // تحديث الموضوع السلوكي
    this.mobileSettingsSubject.next(newSettings);
    
    // تطبيق الإعدادات الجديدة
    this.applySettings(newSettings);
  }

  /**
   * تحميل إعدادات تجربة الأجهزة المحمولة من التخزين المحلي
   * @returns إعدادات تجربة الأجهزة المحمولة
   */
  private loadSettings(): typeof this.defaultSettings {
    try {
      const savedSettings = localStorage.getItem('mobileSettings');
      return savedSettings ? { ...this.defaultSettings, ...JSON.parse(savedSettings) } : this.defaultSettings;
    } catch (error) {
      console.error('فشل تحميل إعدادات تجربة الأجهزة المحمولة:', error);
      return this.defaultSettings;
    }
  }

  /**
   * حفظ إعدادات تجربة الأجهزة المحمولة في التخزين المحلي
   * @param settings إعدادات تجربة الأجهزة المحمولة
   */
  private saveSettings(settings: typeof this.defaultSettings): void {
    try {
      localStorage.setItem('mobileSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('فشل حفظ إعدادات تجربة الأجهزة المحمولة:', error);
    }
  }

  /**
   * تطبيق إعدادات تجربة الأجهزة المحمولة على المستند
   * @param settings إعدادات تجربة الأجهزة المحمولة
   */
  private applySettings(settings: typeof this.defaultSettings): void {
    // تطبيق الإعدادات فقط إذا كان الجهاز محمولاً
    if (!this.isMobileDevice) {
      return;
    }
    
    // تطبيق وضع الأهداف الكبيرة
    if (settings.largeTargets) {
      document.body.classList.add('large-targets-mode');
    } else {
      document.body.classList.remove('large-targets-mode');
    }
    
    // تطبيق وضع التحسين للشاشات الصغيرة
    if (settings.optimizeForSmallScreens) {
      document.body.classList.add('small-screen-optimized');
    } else {
      document.body.classList.remove('small-screen-optimized');
    }
    
    // تطبيق وضع التخطيط التكيفي
    if (settings.adaptiveLayout) {
      document.body.classList.add('adaptive-layout');
    } else {
      document.body.classList.remove('adaptive-layout');
    }
    
    // تطبيق وضع التنقل السفلي
    if (settings.bottomNavigation) {
      document.body.classList.add('bottom-navigation');
    } else {
      document.body.classList.remove('bottom-navigation');
    }
    
    // تعيين متغيرات CSS للتحكم في تجربة اللمس
    document.body.style.setProperty('--touch-feedback-enabled', settings.touchFeedback ? '1' : '0');
  }

  /**
   * تحديد نوع الجهاز
   */
  private detectDeviceType(): void {
    // التحقق من وجود وكيل المستخدم
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // التحقق مما إذا كان الجهاز محمولاً
    this._isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    // التحقق مما إذا كان الجهاز لوحيًا
    this._isTabletDevice = /ipad|android(?!.*mobile)/i.test(userAgent.toLowerCase());
    
    // تحديد أبعاد الشاشة
    this._screenWidth = window.innerWidth;
    this._screenHeight = window.innerHeight;
    
    // تحديد اتجاه الشاشة
    this._orientation = this._screenWidth > this._screenHeight ? 'landscape' : 'portrait';
    
    // إضافة فئات CSS للجسم
    if (this._isMobileDevice) {
      document.body.classList.add('mobile-device');
      
      if (this._isTabletDevice) {
        document.body.classList.add('tablet-device');
      } else {
        document.body.classList.add('phone-device');
      }
      
      document.body.classList.add(`orientation-${this._orientation}`);
    }
  }

  /**
   * الاستماع لتغييرات حجم النافذة واتجاهها
   */
  private listenToWindowChanges(): void {
    window.addEventListener('resize', () => {
      // تحديث أبعاد الشاشة
      this._screenWidth = window.innerWidth;
      this._screenHeight = window.innerHeight;
      
      // تحديث اتجاه الشاشة
      const newOrientation = this._screenWidth > this._screenHeight ? 'landscape' : 'portrait';
      
      if (newOrientation !== this._orientation) {
        this._orientation = newOrientation;
        
        // تحديث فئات CSS
        document.body.classList.remove('orientation-portrait', 'orientation-landscape');
        document.body.classList.add(`orientation-${this._orientation}`);
        
        // إعادة تطبيق الإعدادات
        this.applySettings(this.mobileSettingsSubject.value);
      }
    });
  }

  /**
   * التحقق مما إذا كان الجهاز محمولاً
   */
  get isMobileDevice(): boolean {
    return this._isMobileDevice;
  }

  /**
   * التحقق مما إذا كان الجهاز لوحيًا
   */
  get isTabletDevice(): boolean {
    return this._isTabletDevice;
  }

  /**
   * الحصول على عرض الشاشة
   */
  get screenWidth(): number {
    return this._screenWidth;
  }

  /**
   * الحصول على ارتفاع الشاشة
   */
  get screenHeight(): number {
    return this._screenHeight;
  }

  /**
   * الحصول على اتجاه الشاشة
   */
  get orientation(): 'portrait' | 'landscape' {
    return this._orientation;
  }

  /**
   * التحقق مما إذا كانت الشاشة صغيرة
   */
  get isSmallScreen(): boolean {
    return this._screenWidth < 768;
  }

  /**
   * التحقق مما إذا كانت الشاشة متوسطة
   */
  get isMediumScreen(): boolean {
    return this._screenWidth >= 768 && this._screenWidth < 1024;
  }

  /**
   * التحقق مما إذا كانت الشاشة كبيرة
   */
  get isLargeScreen(): boolean {
    return this._screenWidth >= 1024;
  }

  /**
   * تحسين عنصر للأجهزة المحمولة
   * @param element العنصر المراد تحسينه
   */
  optimizeElementForMobile(element: HTMLElement): void {
    if (!element || !this.isMobileDevice) {
      return;
    }
    
    const settings = this.mobileSettingsSubject.value;
    
    // زيادة حجم العناصر التفاعلية
    if (settings.largeTargets) {
      if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
          element.tagName === 'INPUT' || element.tagName === 'SELECT') {
        element.classList.add('mobile-optimized-target');
      }
    }
    
    // إضافة تأثير اللمس
    if (settings.touchFeedback) {
      element.classList.add('touch-feedback-enabled');
    }
  }

  /**
   * تحسين قائمة للأجهزة المحمولة
   * @param element عنصر القائمة
   */
  optimizeMenuForMobile(element: HTMLElement): void {
    if (!element || !this.isMobileDevice) {
      return;
    }
    
    // تحسين القائمة للأجهزة المحمولة
    element.classList.add('mobile-optimized-menu');
    
    // إضافة تباعد أكبر بين عناصر القائمة
    const menuItems = element.querySelectorAll('li, a, button');
    menuItems.forEach(item => {
      (item as HTMLElement).classList.add('mobile-menu-item');
    });
  }

  /**
   * تحسين نموذج للأجهزة المحمولة
   * @param element عنصر النموذج
   */
  optimizeFormForMobile(element: HTMLElement): void {
    if (!element || !this.isMobileDevice) {
      return;
    }
    
    // تحسين النموذج للأجهزة المحمولة
    element.classList.add('mobile-optimized-form');
    
    // تحسين حقول الإدخال
    const inputFields = element.querySelectorAll('input, select, textarea');
    inputFields.forEach(field => {
      (field as HTMLElement).classList.add('mobile-input-field');
    });
    
    // تحسين أزرار النموذج
    const formButtons = element.querySelectorAll('button, [type="submit"], [type="reset"]');
    formButtons.forEach(button => {
      (button as HTMLElement).classList.add('mobile-form-button');
    });
  }
}
