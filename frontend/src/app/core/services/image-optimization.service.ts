import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private supportedFormats: { [key: string]: boolean } = {};
  private connection: any = null;

  constructor() {
    this.detectSupportedFormats();
    this.detectConnectionType();
  }

  /**
   * اكتشاف تنسيقات الصور المدعومة في المتصفح
   */
  private detectSupportedFormats(): void {
    const testFormats = [
      { format: 'webp', mimeType: 'image/webp' },
      { format: 'avif', mimeType: 'image/avif' },
      { format: 'jpeg', mimeType: 'image/jpeg' },
      { format: 'png', mimeType: 'image/png' }
    ];

    testFormats.forEach(({ format, mimeType }) => {
      const image = new Image();
      image.onload = () => {
        this.supportedFormats[format] = true;
      };
      image.onerror = () => {
        this.supportedFormats[format] = false;
      };
      image.src = `data:${mimeType};base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=`;
    });
  }

  /**
   * اكتشاف نوع الاتصال
   */
  private detectConnectionType(): void {
    if ('connection' in navigator && (navigator as any).connection) {
      this.connection = (navigator as any).connection;
      
      // الاستماع لتغييرات الاتصال
      this.connection.addEventListener('change', () => {
        console.log('Connection type changed to', this.connection.effectiveType);
      });
    }
  }

  /**
   * الحصول على أفضل تنسيق صورة مدعوم
   * @returns تنسيق الصورة المفضل
   */
  public getBestSupportedFormat(): string {
    if (this.supportedFormats['avif']) return 'avif';
    if (this.supportedFormats['webp']) return 'webp';
    return 'jpeg';
  }

  /**
   * الحصول على جودة الصورة المناسبة بناءً على نوع الاتصال
   * @returns جودة الصورة (0-100)
   */
  public getAppropriateQuality(): number {
    if (!this.connection) return 85; // جودة افتراضية

    switch (this.connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 60;
      case '3g':
        return 75;
      case '4g':
      default:
        return 85;
    }
  }

  /**
   * الحصول على حجم الصورة المناسب بناءً على نوع الاتصال وحجم الشاشة
   * @param originalWidth العرض الأصلي
   * @param originalHeight الارتفاع الأصلي
   * @returns أبعاد الصورة المناسبة
   */
  public getAppropriateSize(originalWidth: number, originalHeight: number): { width: number, height: number } {
    const screenWidth = window.innerWidth;
    const devicePixelRatio = window.devicePixelRatio || 1;
    let scaleFactor = 1;

    // تحديد عامل القياس بناءً على نوع الاتصال
    if (this.connection) {
      switch (this.connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          scaleFactor = 0.5;
          break;
        case '3g':
          scaleFactor = 0.75;
          break;
        case '4g':
        default:
          scaleFactor = 1;
      }
    }

    // حساب الأبعاد المناسبة
    const targetWidth = Math.min(originalWidth, screenWidth * devicePixelRatio * scaleFactor);
    const aspectRatio = originalHeight / originalWidth;
    const targetHeight = targetWidth * aspectRatio;

    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight)
    };
  }

  /**
   * تحسين مسار الصورة
   * @param imagePath مسار الصورة الأصلي
   * @param width عرض الصورة
   * @param height ارتفاع الصورة
   * @returns مسار الصورة المحسن
   */
  public optimizeImageUrl(imagePath: string, width?: number, height?: number): string {
    // التحقق من وجود خدمة تحسين الصور
    if (!imagePath.includes('/assets/')) {
      // إذا كانت الصورة خارجية، قم بإرجاع المسار الأصلي
      return imagePath;
    }

    const format = this.getBestSupportedFormat();
    const quality = this.getAppropriateQuality();
    
    // إنشاء مسار محسن للصورة
    let optimizedPath = `/api/images/optimize?src=${encodeURIComponent(imagePath)}&format=${format}&quality=${quality}`;
    
    if (width && height) {
      optimizedPath += `&width=${width}&height=${height}`;
    }
    
    return optimizedPath;
  }

  /**
   * تحميل الصور مسبقًا
   * @param imageUrls مصفوفة عناوين URL للصور
   */
  public preloadImages(imageUrls: string[]): void {
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.optimizeImageUrl(url);
      document.head.appendChild(link);
    });
  }

  /**
   * تحميل الصور بشكل كسول
   * @param container حاوية الصور
   */
  public setupLazyLoading(container: HTMLElement): void {
    if ('IntersectionObserver' in window) {
      const lazyImages = container.querySelectorAll('img[data-src]');
      
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-src');
            
            if (src) {
              img.src = this.optimizeImageUrl(src);
              img.removeAttribute('data-src');
            }
            
            imageObserver.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // استخدام طريقة بديلة للمتصفحات القديمة
      this.setupLazyLoadingFallback(container);
    }
  }

  /**
   * طريقة بديلة لتحميل الصور بشكل كسول
   * @param container حاوية الصور
   */
  private setupLazyLoadingFallback(container: HTMLElement): void {
    const lazyImages = container.querySelectorAll('img[data-src]');
    
    const lazyLoad = () => {
      lazyImages.forEach(img => {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.getAttribute('data-src');
        
        if (src && this.isInViewport(imgElement)) {
          imgElement.src = this.optimizeImageUrl(src);
          imgElement.removeAttribute('data-src');
        }
      });
    };
    
    // تنفيذ التحميل الكسول عند التمرير
    window.addEventListener('scroll', lazyLoad);
    window.addEventListener('resize', lazyLoad);
    window.addEventListener('orientationchange', lazyLoad);
    
    // تنفيذ التحميل الأولي
    lazyLoad();
  }

  /**
   * التحقق مما إذا كان العنصر مرئيًا في نافذة العرض
   * @param element العنصر
   * @returns هل العنصر مرئي
   */
  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    
    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * تطبيق تأثير تحميل تدريجي للصور
   * @param img عنصر الصورة
   */
  public applyProgressiveLoading(img: HTMLImageElement): void {
    // إنشاء نسخة منخفضة الدقة من الصورة
    const src = img.getAttribute('src') || '';
    const lowResSrc = this.optimizeImageUrl(src, 20, 20);
    
    // تحميل النسخة منخفضة الدقة أولاً
    const lowResImg = new Image();
    lowResImg.onload = () => {
      img.src = lowResSrc;
      img.classList.add('blur');
      
      // ثم تحميل النسخة عالية الدقة
      const highResImg = new Image();
      highResImg.onload = () => {
        img.src = this.optimizeImageUrl(src);
        img.classList.remove('blur');
      };
      highResImg.src = this.optimizeImageUrl(src);
    };
    lowResImg.src = lowResSrc;
  }
}
