import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

/**
 * خدمة تحسين تجربة الأجهزة المحمولة
 * توفر وظائف وأدوات لتحسين تجربة المستخدم على الأجهزة المحمولة
 */
@Injectable({
  providedIn: 'root'
})
export class MobileExperienceService {
  // مراقبة نقاط التوقف للشاشة
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  // مراقبة الشاشات الصغيرة (الهواتف)
  isPhone$: Observable<boolean> = this.breakpointObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small
  ]).pipe(
    map(result => result.matches),
    shareReplay()
  );

  // مراقبة الشاشات المتوسطة (الأجهزة اللوحية)
  isTablet$: Observable<boolean> = this.breakpointObserver.observe([
    Breakpoints.Medium
  ]).pipe(
    map(result => result.matches),
    shareReplay()
  );

  // مراقبة الشاشات الكبيرة (أجهزة الكمبيوتر)
  isDesktop$: Observable<boolean> = this.breakpointObserver.observe([
    Breakpoints.Large,
    Breakpoints.XLarge
  ]).pipe(
    map(result => result.matches),
    shareReplay()
  );

  // مراقبة اتجاه الشاشة
  isPortrait$: Observable<boolean> = this.breakpointObserver.observe('(orientation: portrait)')
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  // حالة اللمس
  private isTouchDevice: boolean;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.detectTouchDevice();
    this.setupTouchOptimizations();
    this.setupViewportMetaTag();
    this.setupEventListeners();
  }

  /**
   * اكتشاف ما إذا كان الجهاز يدعم اللمس
   */
  private detectTouchDevice(): void {
    this.isTouchDevice = (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator as any).msMaxTouchPoints > 0);
    
    if (this.isTouchDevice) {
      document.body.classList.add('touch-device');
    }
  }

  /**
   * إعداد تحسينات اللمس
   */
  private setupTouchOptimizations(): void {
    if (!this.isTouchDevice) return;

    // إضافة أنماط CSS لتحسين تجربة اللمس
    const style = document.createElement('style');
    style.textContent = `
      /* زيادة حجم عناصر التفاعل للأجهزة اللمسية */
      .touch-device button,
      .touch-device .mat-button,
      .touch-device .mat-raised-button,
      .touch-device .mat-icon-button,
      .touch-device .mat-stroked-button,
      .touch-device .mat-flat-button,
      .touch-device .mat-fab,
      .touch-device .mat-mini-fab {
        min-height: 44px;
        min-width: 44px;
      }
      
      .touch-device .mat-icon-button {
        padding: 12px;
      }
      
      .touch-device input,
      .touch-device select,
      .touch-device textarea,
      .touch-device .mat-form-field {
        font-size: 16px; /* منع تكبير النص التلقائي في iOS */
      }
      
      .touch-device .clickable-area {
        padding: 12px;
      }
      
      /* زيادة المسافة بين العناصر القابلة للنقر */
      .touch-device .touch-spacing > * {
        margin-bottom: 8px;
      }
      
      /* تحسين التمرير */
      .touch-device .scrollable-area {
        -webkit-overflow-scrolling: touch;
        overflow-y: auto;
      }
      
      /* تعطيل تأثيرات التحويم */
      .touch-device .disable-hover:hover {
        background-color: inherit !important;
        color: inherit !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * إعداد وسم التعريف للعرض
   */
  private setupViewportMetaTag(): void {
    // التحقق من وجود وسم التعريف للعرض
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      // إنشاء وسم التعريف للعرض إذا لم يكن موجودًا
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    
    // تعيين محتوى وسم التعريف للعرض
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    
    // إضافة وسم التعريف للألوان
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    
    themeMeta.setAttribute('content', '#3f51b5');
  }

  /**
   * إعداد مستمعي الأحداث
   */
  private setupEventListeners(): void {
    if (this.isTouchDevice) {
      // تحسين التفاعل مع العناصر القابلة للنقر
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
      
      // معالجة تغيير اتجاه الشاشة
      window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    }
    
    // معالجة تغيير حجم النافذة
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * معالجة بدء اللمس
   * @param event حدث بدء اللمس
   */
  private handleTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    
    // إضافة فئة للعنصر الملموس
    if (target && this.isClickableElement(target)) {
      target.classList.add('touch-active');
    }
  }

  /**
   * معالجة انتهاء اللمس
   * @param event حدث انتهاء اللمس
   */
  private handleTouchEnd(event: TouchEvent): void {
    // إزالة فئة اللمس النشط من جميع العناصر
    document.querySelectorAll('.touch-active').forEach(element => {
      element.classList.remove('touch-active');
    });
  }

  /**
   * معالجة تغيير اتجاه الشاشة
   * @param event حدث تغيير اتجاه الشاشة
   */
  private handleOrientationChange(event: Event): void {
    // إعادة تعيين التمرير إلى أعلى الصفحة
    window.scrollTo(0, 0);
    
    // إرسال حدث مخصص لتغيير اتجاه الشاشة
    const orientationEvent = new CustomEvent('app-orientation-change', {
      detail: {
        isPortrait: window.matchMedia('(orientation: portrait)').matches
      }
    });
    
    window.dispatchEvent(orientationEvent);
  }

  /**
   * معالجة تغيير حجم النافذة
   * @param event حدث تغيير حجم النافذة
   */
  private handleResize(event: Event): void {
    // إرسال حدث مخصص لتغيير حجم النافذة
    const resizeEvent = new CustomEvent('app-resize', {
      detail: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    window.dispatchEvent(resizeEvent);
  }

  /**
   * التحقق مما إذا كان العنصر قابلاً للنقر
   * @param element العنصر المراد التحقق منه
   * @returns هل العنصر قابل للنقر
   */
  private isClickableElement(element: HTMLElement): boolean {
    const clickableTagNames = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
    const clickableRoles = ['button', 'link', 'checkbox', 'radio', 'menuitem', 'tab', 'switch'];
    
    // التحقق من اسم العنصر
    if (clickableTagNames.includes(element.tagName)) {
      return true;
    }
    
    // التحقق من دور العنصر
    const role = element.getAttribute('role');
    if (role && clickableRoles.includes(role)) {
      return true;
    }
    
    // التحقق من وجود مستمع أحداث النقر
    if (element.hasAttribute('ng-click') || element.hasAttribute('(click)') || element.onclick) {
      return true;
    }
    
    // التحقق من الفئات
    const classList = element.classList;
    if (classList.contains('clickable') || classList.contains('mat-button') || 
        classList.contains('mat-icon-button') || classList.contains('mat-raised-button') ||
        classList.contains('mat-flat-button') || classList.contains('mat-stroked-button') ||
        classList.contains('mat-fab') || classList.contains('mat-mini-fab')) {
      return true;
    }
    
    return false;
  }

  /**
   * التحقق مما إذا كان الجهاز يدعم اللمس
   * @returns هل الجهاز يدعم اللمس
   */
  public isTouchEnabled(): boolean {
    return this.isTouchDevice;
  }

  /**
   * تطبيق تحسينات الأجهزة المحمولة على العنصر
   * @param element العنصر المراد تحسينه
   */
  public enhanceMobileElement(element: HTMLElement): void {
    if (!element) return;
    
    // إضافة فئة للمساعدة في تحديد العناصر القابلة للنقر
    if (this.isClickableElement(element)) {
      element.classList.add('clickable-area');
    }
    
    // تحسين التمرير
    if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
      element.classList.add('scrollable-area');
    }
    
    // تحسين المسافة بين العناصر القابلة للنقر
    if (element.children.length > 1) {
      let hasClickableChildren = false;
      
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement;
        if (this.isClickableElement(child)) {
          hasClickableChildren = true;
          break;
        }
      }
      
      if (hasClickableChildren) {
        element.classList.add('touch-spacing');
      }
    }
  }

  /**
   * تطبيق تحسينات الأجهزة المحمولة على جميع العناصر في الصفحة
   */
  public enhanceAllMobileElements(): void {
    if (!this.isTouchDevice) return;
    
    // تحسين الأزرار
    document.querySelectorAll('button, .mat-button, .mat-raised-button, .mat-icon-button, .mat-stroked-button, .mat-flat-button, .mat-fab, .mat-mini-fab').forEach(element => {
      this.enhanceMobileElement(element as HTMLElement);
    });
    
    // تحسين عناصر النموذج
    document.querySelectorAll('input, select, textarea, .mat-form-field').forEach(element => {
      this.enhanceMobileElement(element as HTMLElement);
    });
    
    // تحسين الروابط
    document.querySelectorAll('a').forEach(element => {
      this.enhanceMobileElement(element as HTMLElement);
    });
    
    // تحسين العناصر القابلة للتمرير
    document.querySelectorAll('.scrollable, .mat-sidenav-content, .mat-dialog-content, .mat-tab-body-content').forEach(element => {
      this.enhanceMobileElement(element as HTMLElement);
    });
  }

  /**
   * تطبيق تحسينات الإيماءات اللمسية
   * @param element العنصر المراد تحسينه
   * @param options خيارات الإيماءات
   */
  public applyTouchGestures(element: HTMLElement, options: {
    swipe?: boolean,
    pinch?: boolean,
    rotate?: boolean,
    tap?: boolean,
    doubleTap?: boolean,
    longPress?: boolean
  } = {}): void {
    if (!this.isTouchDevice || !element) return;
    
    // تنفيذ إيماءات اللمس الأساسية
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;
    
    // مستمع بدء اللمس
    element.addEventListener('touchstart', (event: TouchEvent) => {
      if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });
    
    // مستمع انتهاء اللمس
    element.addEventListener('touchend', (event: TouchEvent) => {
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // اكتشاف النقر
      if (options.tap && Math.abs(touchEndX - touchStartX) < 10 && Math.abs(touchEndY - touchStartY) < 10 && touchDuration < 300) {
        // اكتشاف النقر المزدوج
        if (options.doubleTap && touchEndTime - lastTapTime < 300) {
          const doubleTapEvent = new CustomEvent('doubletap', {
            detail: { x: touchEndX, y: touchEndY }
          });
          element.dispatchEvent(doubleTapEvent);
          lastTapTime = 0; // إعادة تعيين وقت النقر الأخير
        } else {
          const tapEvent = new CustomEvent('tap', {
            detail: { x: touchEndX, y: touchEndY }
          });
          element.dispatchEvent(tapEvent);
          lastTapTime = touchEndTime;
        }
      }
      
      // اكتشاف الضغط الطويل
      if (options.longPress && Math.abs(touchEndX - touchStartX) < 10 && Math.abs(touchEndY - touchStartY) < 10 && touchDuration >= 500) {
        const longPressEvent = new CustomEvent('longpress', {
          detail: { x: touchEndX, y: touchEndY, duration: touchDuration }
        });
        element.dispatchEvent(longPressEvent);
      }
      
      // اكتشاف التمرير السريع
      if (options.swipe) {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 50 && touchDuration < 300) {
          let direction = '';
          
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // التمرير السريع أفقي
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            // التمرير السريع رأسي
            direction = deltaY > 0 ? 'down' : 'up';
          }
          
          const swipeEvent = new CustomEvent('swipe', {
            detail: { direction, distance, deltaX, deltaY }
          });
          element.dispatchEvent(swipeEvent);
        }
      }
    }, { passive: true });
    
    // تنفيذ إيماءات متقدمة (القرص والتدوير) إذا تم تمكينها
    if (options.pinch || options.rotate) {
      let initialDistance = 0;
      let initialAngle = 0;
      
      // مستمع بدء اللمس للإيماءات المتقدمة
      element.addEventListener('touchstart', (event: TouchEvent) => {
        if (event.touches.length === 2) {
          // حساب المسافة الأولية بين نقطتي اللمس
          const dx = event.touches[0].clientX - event.touches[1].clientX;
          const dy = event.touches[0].clientY - event.touches[1].clientY;
          initialDistance = Math.sqrt(dx * dx + dy * dy);
          
          // حساب الزاوية الأولية بين نقطتي اللمس
          initialAngle = Math.atan2(dy, dx);
        }
      }, { passive: true });
      
      // مستمع تحرك اللمس للإيماءات المتقدمة
      element.addEventListener('touchmove', (event: TouchEvent) => {
        if (event.touches.length === 2) {
          // حساب المسافة الحالية بين نقطتي اللمس
          const dx = event.touches[0].clientX - event.touches[1].clientX;
          const dy = event.touches[0].clientY - event.touches[1].clientY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          
          // اكتشاف القرص
          if (options.pinch) {
            const scale = currentDistance / initialDistance;
            const pinchEvent = new CustomEvent('pinch', {
              detail: { scale, initialDistance, currentDistance }
            });
            element.dispatchEvent(pinchEvent);
          }
          
          // اكتشاف التدوير
          if (options.rotate) {
            const currentAngle = Math.atan2(dy, dx);
            let rotation = (currentAngle - initialAngle) * (180 / Math.PI);
            
            // تطبيع الزاوية
            if (rotation < 0) {
              rotation += 360;
            }
            
            const rotateEvent = new CustomEvent('rotate', {
              detail: { rotation, initialAngle: initialAngle * (180 / Math.PI), currentAngle: currentAngle * (180 / Math.PI) }
            });
            element.dispatchEvent(rotateEvent);
          }
        }
      }, { passive: true });
    }
  }

  /**
   * تحسين أداء التمرير على الأجهزة المحمولة
   * @param element العنصر المراد تحسينه
   */
  public enhanceScrolling(element: HTMLElement): void {
    if (!element) return;
    
    // إضافة فئة التمرير السلس
    element.classList.add('smooth-scroll');
    
    // إضافة أنماط CSS للتمرير السلس
    const style = document.createElement('style');
    style.textContent = `
      .smooth-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        overscroll-behavior: contain;
      }
      
      .smooth-scroll::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      .smooth-scroll::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      
      .smooth-scroll::-webkit-scrollbar-track {
        background-color: rgba(0, 0, 0, 0.05);
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * تحسين أداء الصور على الأجهزة المحمولة
   */
  public enhanceImages(): void {
    // إضافة سمة loading="lazy" لجميع الصور
    document.querySelectorAll('img:not([loading])').forEach((img: HTMLImageElement) => {
      img.loading = 'lazy';
    });
    
    // تحسين الصور باستخدام srcset للأجهزة المحمولة
    document.querySelectorAll('img[data-mobile-src]:not([srcset])').forEach((img: HTMLImageElement) => {
      const mobileSrc = img.getAttribute('data-mobile-src');
      const desktopSrc = img.src;
      
      if (mobileSrc) {
        img.srcset = `${mobileSrc} 480w, ${desktopSrc} 1080w`;
        img.sizes = '(max-width: 600px) 480px, 1080px';
      }
    });
  }

  /**
   * تحسين أداء الفيديو على الأجهزة المحمولة
   */
  public enhanceVideos(): void {
    // تحسين الفيديوهات للأجهزة المحمولة
    document.querySelectorAll('video').forEach((video: HTMLVideoElement) => {
      // تعطيل التشغيل التلقائي على الأجهزة المحمولة
      if (this.isTouchDevice) {
        video.autoplay = false;
      }
      
      // إضافة سمة playsinline
      video.setAttribute('playsinline', '');
      
      // إضافة سمة preload="metadata"
      if (!video.hasAttribute('preload')) {
        video.preload = 'metadata';
      }
      
      // إضافة عناصر تحكم إذا لم تكن موجودة
      if (!video.hasAttribute('controls')) {
        video.controls = true;
      }
    });
  }

  /**
   * تحسين أداء الخرائط على الأجهزة المحمولة
   * @param mapElement عنصر الخريطة
   */
  public enhanceMaps(mapElement: HTMLElement): void {
    if (!mapElement) return;
    
    // إضافة فئة للخريطة
    mapElement.classList.add('mobile-optimized-map');
    
    // إضافة أنماط CSS للخرائط
    const style = document.createElement('style');
    style.textContent = `
      .mobile-optimized-map {
        touch-action: pan-x pan-y;
        height: 300px;
        max-height: 50vh;
      }
      
      @media (min-width: 768px) {
        .mobile-optimized-map {
          height: 400px;
          max-height: 60vh;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * تحسين أداء النماذج على الأجهزة المحمولة
   * @param formElement عنصر النموذج
   */
  public enhanceForms(formElement: HTMLFormElement): void {
    if (!formElement) return;
    
    // تحسين حقول الإدخال
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach((input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
      // تعيين نوع لوحة المفاتيح المناسب
      if (input instanceof HTMLInputElement) {
        if (input.type === 'text' && input.name.toLowerCase().includes('email')) {
          input.type = 'email';
        } else if (input.type === 'text' && (input.name.toLowerCase().includes('phone') || input.name.toLowerCase().includes('tel'))) {
          input.type = 'tel';
        } else if (input.type === 'text' && input.name.toLowerCase().includes('search')) {
          input.type = 'search';
        } else if (input.type === 'text' && (input.name.toLowerCase().includes('url') || input.name.toLowerCase().includes('website'))) {
          input.type = 'url';
        }
        
        // إضافة سمة autocomplete
        if (input.name.toLowerCase().includes('name')) {
          input.autocomplete = 'name';
        } else if (input.name.toLowerCase().includes('email')) {
          input.autocomplete = 'email';
        } else if (input.name.toLowerCase().includes('phone') || input.name.toLowerCase().includes('tel')) {
          input.autocomplete = 'tel';
        } else if (input.name.toLowerCase().includes('address')) {
          input.autocomplete = 'street-address';
        } else if (input.name.toLowerCase().includes('city')) {
          input.autocomplete = 'address-level2';
        } else if (input.name.toLowerCase().includes('zip') || input.name.toLowerCase().includes('postal')) {
          input.autocomplete = 'postal-code';
        } else if (input.name.toLowerCase().includes('country')) {
          input.autocomplete = 'country';
        }
      }
      
      // تعيين حجم الخط لمنع التكبير التلقائي في iOS
      input.style.fontSize = '16px';
    });
    
    // تحسين أزرار النموذج
    const buttons = formElement.querySelectorAll('button, [type="submit"], [type="reset"], [type="button"]');
    buttons.forEach((button: HTMLButtonElement) => {
      button.style.minHeight = '44px';
      button.style.minWidth = '44px';
    });
  }

  /**
   * تحسين أداء القوائم على الأجهزة المحمولة
   * @param menuElement عنصر القائمة
   */
  public enhanceMenus(menuElement: HTMLElement): void {
    if (!menuElement) return;
    
    // إضافة فئة للقائمة
    menuElement.classList.add('mobile-optimized-menu');
    
    // إضافة أنماط CSS للقوائم
    const style = document.createElement('style');
    style.textContent = `
      .mobile-optimized-menu {
        max-height: 80vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      .mobile-optimized-menu li,
      .mobile-optimized-menu a,
      .mobile-optimized-menu button {
        min-height: 44px;
        display: flex;
        align-items: center;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * تحسين أداء الجداول على الأجهزة المحمولة
   * @param tableElement عنصر الجدول
   */
  public enhanceTables(tableElement: HTMLTableElement): void {
    if (!tableElement) return;
    
    // إضافة فئة للجدول
    tableElement.classList.add('mobile-optimized-table');
    
    // إضافة أنماط CSS للجداول
    const style = document.createElement('style');
    style.textContent = `
      .mobile-optimized-table {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        display: block;
      }
      
      @media (max-width: 767px) {
        .mobile-optimized-table thead {
          display: none;
        }
        
        .mobile-optimized-table tbody,
        .mobile-optimized-table tr {
          display: block;
          width: 100%;
        }
        
        .mobile-optimized-table tr {
          margin-bottom: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px;
        }
        
        .mobile-optimized-table td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        
        .mobile-optimized-table td:last-child {
          border-bottom: none;
        }
        
        .mobile-optimized-table td:before {
          content: attr(data-label);
          font-weight: bold;
          margin-left: 8px;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // إضافة سمات data-label للخلايا
    const headerCells = tableElement.querySelectorAll('thead th');
    const headerTexts = Array.from(headerCells).map(cell => cell.textContent);
    
    const rows = tableElement.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (index < headerTexts.length) {
          cell.setAttribute('data-label', headerTexts[index]);
        }
      });
    });
  }
}
