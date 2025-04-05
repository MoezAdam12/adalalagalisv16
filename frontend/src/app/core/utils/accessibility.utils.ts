/**
 * أدوات مساعدة لتحسين إمكانية الوصول
 * 
 * هذا الملف يوفر مجموعة من الأدوات المساعدة لتحسين إمكانية الوصول في التطبيق،
 * بما في ذلك إدارة سمات ARIA، وتحسين التنقل بلوحة المفاتيح، وتحسين قارئات الشاشة.
 */

/**
 * إضافة سمات ARIA إلى العنصر
 * @param element العنصر المراد إضافة سمات ARIA إليه
 * @param attributes سمات ARIA المراد إضافتها
 */
export function addAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
  if (!element) return;
  
  Object.entries(attributes).forEach(([key, value]) => {
    const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
    element.setAttribute(ariaKey, value);
  });
}

/**
 * إضافة سمة role إلى العنصر
 * @param element العنصر المراد إضافة سمة role إليه
 * @param role قيمة سمة role
 */
export function setRole(element: HTMLElement, role: string): void {
  if (!element) return;
  
  element.setAttribute('role', role);
}

/**
 * إضافة نص بديل للصورة
 * @param imgElement عنصر الصورة
 * @param altText النص البديل
 */
export function setImageAltText(imgElement: HTMLImageElement, altText: string): void {
  if (!imgElement) return;
  
  imgElement.alt = altText;
}

/**
 * إضافة تسمية للعنصر
 * @param element العنصر المراد إضافة تسمية له
 * @param labelText نص التسمية
 * @param labelledBy معرف العنصر الذي يحتوي على التسمية
 */
export function setElementLabel(element: HTMLElement, labelText?: string, labelledBy?: string): void {
  if (!element) return;
  
  if (labelText) {
    element.setAttribute('aria-label', labelText);
  }
  
  if (labelledBy) {
    element.setAttribute('aria-labelledby', labelledBy);
  }
}

/**
 * إضافة وصف للعنصر
 * @param element العنصر المراد إضافة وصف له
 * @param description نص الوصف
 * @param describedBy معرف العنصر الذي يحتوي على الوصف
 */
export function setElementDescription(element: HTMLElement, description?: string, describedBy?: string): void {
  if (!element) return;
  
  if (description) {
    element.setAttribute('aria-describedby', description);
  }
  
  if (describedBy) {
    element.setAttribute('aria-describedby', describedBy);
  }
}

/**
 * تعيين حالة العنصر (مخفي، معطل، إلخ)
 * @param element العنصر المراد تعيين حالته
 * @param state حالة العنصر
 * @param value قيمة الحالة
 */
export function setElementState(element: HTMLElement, state: 'hidden' | 'disabled' | 'expanded' | 'selected' | 'checked', value: boolean): void {
  if (!element) return;
  
  element.setAttribute(`aria-${state}`, value.toString());
}

/**
 * إضافة اختصار لوحة المفاتيح للعنصر
 * @param element العنصر المراد إضافة اختصار لوحة المفاتيح له
 * @param key مفتاح الاختصار
 */
export function setAccessKey(element: HTMLElement, key: string): void {
  if (!element) return;
  
  element.setAttribute('accesskey', key);
}

/**
 * تعيين ترتيب التنقل بلوحة المفاتيح
 * @param element العنصر المراد تعيين ترتيب التنقل له
 * @param tabIndex ترتيب التنقل
 */
export function setTabIndex(element: HTMLElement, tabIndex: number): void {
  if (!element) return;
  
  element.tabIndex = tabIndex;
}

/**
 * إضافة مستمع لأحداث لوحة المفاتيح
 * @param element العنصر المراد إضافة مستمع له
 * @param callback دالة رد الاتصال
 */
export function addKeyboardListener(element: HTMLElement, callback: (event: KeyboardEvent) => void): void {
  if (!element) return;
  
  element.addEventListener('keydown', callback);
}

/**
 * التحقق من تباين الألوان
 * @param foreground لون النص
 * @param background لون الخلفية
 * @returns نسبة التباين
 */
export function checkColorContrast(foreground: string, background: string): number {
  // تحويل الألوان إلى قيم RGB
  const getRGB = (color: string) => {
    // إذا كان اللون بتنسيق hex
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return [r, g, b];
    }
    
    // إذا كان اللون بتنسيق rgb
    if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
      }
    }
    
    return [0, 0, 0];
  };
  
  const [r1, g1, b1] = getRGB(foreground);
  const [r2, g2, b2] = getRGB(background);
  
  // حساب السطوع
  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  
  // حساب نسبة التباين
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return Math.round(ratio * 100) / 100;
}

/**
 * التحقق من توافق نسبة التباين مع معايير WCAG
 * @param ratio نسبة التباين
 * @param level مستوى التوافق (AA أو AAA)
 * @param isLargeText هل النص كبير
 * @returns هل نسبة التباين متوافقة
 */
export function isContrastRatioCompliant(ratio: number, level: 'AA' | 'AAA', isLargeText: boolean): boolean {
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } else {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

/**
 * إضافة تلميح للعنصر
 * @param element العنصر المراد إضافة تلميح له
 * @param tooltipText نص التلميح
 */
export function addTooltip(element: HTMLElement, tooltipText: string): void {
  if (!element) return;
  
  element.setAttribute('title', tooltipText);
}

/**
 * تحسين التنقل بلوحة المفاتيح للقوائم
 * @param menuElement عنصر القائمة
 * @param itemSelector محدد عناصر القائمة
 */
export function enhanceMenuKeyboardNavigation(menuElement: HTMLElement, itemSelector: string): void {
  if (!menuElement) return;
  
  const items = Array.from(menuElement.querySelectorAll(itemSelector)) as HTMLElement[];
  
  items.forEach((item, index) => {
    item.tabIndex = index === 0 ? 0 : -1;
    
    item.addEventListener('keydown', (event) => {
      let nextIndex = -1;
      
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = (index + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = (index - 1 + items.length) % items.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = items.length - 1;
          break;
      }
      
      if (nextIndex !== -1) {
        items[index].tabIndex = -1;
        items[nextIndex].tabIndex = 0;
        items[nextIndex].focus();
        event.preventDefault();
      }
    });
  });
}

/**
 * إضافة دعم للإيماءات اللمسية
 * @param element العنصر المراد إضافة دعم الإيماءات له
 * @param callbacks دوال رد الاتصال للإيماءات المختلفة
 */
export function addTouchGestureSupport(element: HTMLElement, callbacks: {
  tap?: (event: TouchEvent) => void;
  doubleTap?: (event: TouchEvent) => void;
  swipeLeft?: (event: TouchEvent) => void;
  swipeRight?: (event: TouchEvent) => void;
  swipeUp?: (event: TouchEvent) => void;
  swipeDown?: (event: TouchEvent) => void;
  pinch?: (event: TouchEvent, scale: number) => void;
  rotate?: (event: TouchEvent, rotation: number) => void;
}): void {
  if (!element) return;
  
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let lastTapTime = 0;
  let touchStartTime = 0;
  
  element.addEventListener('touchstart', (event) => {
    touchStartTime = new Date().getTime();
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  });
  
  element.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    
    const touchEndTime = new Date().getTime();
    const touchDuration = touchEndTime - touchStartTime;
    const touchDistance = Math.sqrt(
      Math.pow(touchEndX - touchStartX, 2) + 
      Math.pow(touchEndY - touchStartY, 2)
    );
    
    // التعرف على النقر
    if (touchDistance < 10 && touchDuration < 300) {
      const currentTime = new Date().getTime();
      const tapTimeDiff = currentTime - lastTapTime;
      
      if (tapTimeDiff < 300 && callbacks.doubleTap) {
        callbacks.doubleTap(event);
        lastTapTime = 0;
      } else {
        if (callbacks.tap) {
          callbacks.tap(event);
        }
        lastTapTime = currentTime;
      }
    }
    
    // التعرف على السحب
    if (touchDistance > 50 && touchDuration < 300) {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // سحب أفقي
        if (deltaX > 0 && callbacks.swipeRight) {
          callbacks.swipeRight(event);
        } else if (deltaX < 0 && callbacks.swipeLeft) {
          callbacks.swipeLeft(event);
        }
      } else {
        // سحب رأسي
        if (deltaY > 0 && callbacks.swipeDown) {
          callbacks.swipeDown(event);
        } else if (deltaY < 0 && callbacks.swipeUp) {
          callbacks.swipeUp(event);
        }
      }
    }
  });
  
  // دعم التكبير/التصغير والتدوير
  if (callbacks.pinch || callbacks.rotate) {
    let initialDistance = 0;
    let initialAngle = 0;
    
    element.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // حساب المسافة الأولية
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        // حساب الزاوية الأولية
        initialAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );
      }
    });
    
    element.addEventListener('touchmove', (event) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // حساب المسافة الحالية
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        // حساب الزاوية الحالية
        const currentAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );
        
        // التعرف على التكبير/التصغير
        if (callbacks.pinch) {
          const scale = currentDistance / initialDistance;
          callbacks.pinch(event, scale);
        }
        
        // التعرف على التدوير
        if (callbacks.rotate) {
          const rotation = (currentAngle - initialAngle) * (180 / Math.PI);
          callbacks.rotate(event, rotation);
        }
        
        event.preventDefault();
      }
    });
  }
}

/**
 * تحسين تجربة المستخدم على الأجهزة المحمولة
 * @param element العنصر المراد تحسين تجربته على الأجهزة المحمولة
 */
export function enhanceMobileExperience(element: HTMLElement): void {
  if (!element) return;
  
  // زيادة حجم مناطق النقر
  const clickableElements = element.querySelectorAll('button, a, [role="button"], [role="link"]');
  clickableElements.forEach((el) => {
    const clickableElement = el as HTMLElement;
    if (clickableElement.style.minHeight !== 'auto') {
      clickableElement.style.minHeight = '44px';
    }
    if (clickableElement.style.minWidth !== 'auto') {
      clickableElement.style.minWidth = '44px';
    }
    
    // إضافة تباعد مناسب
    if (getComputedStyle(clickableElement).padding === '0px') {
      clickableElement.style.padding = '8px';
    }
  });
  
  // تحسين حجم الخط للقراءة على الأجهزة المحمولة
  const textElements = element.querySelectorAll('p, span, div, label, input, textarea, select');
  textElements.forEach((el) => {
    const textElement = el as HTMLElement;
    const fontSize = parseInt(getComputedStyle(textElement).fontSize);
    if (fontSize < 16) {
      textElement.style.fontSize = '16px';
    }
  });
}

/**
 * إضافة دعم للوضع المظلم
 * @param darkModeEnabled هل الوضع المظلم مفعل
 */
export function toggleDarkMode(darkModeEnabled: boolean): void {
  const root = document.documentElement;
  
  if (darkModeEnabled) {
    root.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-mode');
  }
}

/**
 * إضافة دعم للتكبير/التصغير
 * @param element العنصر المراد إضافة دعم التكبير/التصغير له
 */
export function addZoomSupport(element: HTMLElement): void {
  if (!element) return;
  
  let scale = 1;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;
  const SCALE_STEP = 0.1;
  
  // إضافة مستمع لعجلة الماوس
  element.addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
      
      // تحديد اتجاه التكبير/التصغير
      const delta = event.deltaY > 0 ? -1 : 1;
      
      // تحديث المقياس
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + (delta * SCALE_STEP)));
      
      // تطبيق المقياس
      element.style.transform = `scale(${scale})`;
    }
  });
}

/**
 * إضافة دعم للتباين العالي
 * @param highContrastEnabled هل وضع التباين العالي مفعل
 */
export function toggleHighContrast(highContrastEnabled: boolean): void {
  const root = document.documentElement;
  
  if (highContrastEnabled) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}

/**
 * إضافة دعم للقراءة من اليمين إلى اليسار
 * @param isRTL هل اتجاه القراءة من اليمين إلى اليسار
 */
export function setTextDirection(isRTL: boolean): void {
  const root = document.documentElement;
  
  if (isRTL) {
    root.setAttribute('dir', 'rtl');
  } else {
    root.setAttribute('dir', 'ltr');
  }
}
