import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkOptimizationService {
  private networkInfo: any = null;
  private isOffline: boolean = false;
  private isSlowConnection: boolean = false;

  constructor() {
    this.detectNetworkConditions();
    this.setupNetworkListeners();
  }

  /**
   * اكتشاف حالة الشبكة
   */
  private detectNetworkConditions(): void {
    // التحقق من حالة الاتصال
    this.isOffline = !navigator.onLine;

    // الحصول على معلومات الشبكة إذا كانت متاحة
    if ('connection' in navigator && (navigator as any).connection) {
      this.networkInfo = (navigator as any).connection;
      this.isSlowConnection = this.isConnectionSlow();
    }

    console.log('Network conditions:', {
      isOffline: this.isOffline,
      isSlowConnection: this.isSlowConnection,
      networkInfo: this.networkInfo ? {
        effectiveType: this.networkInfo.effectiveType,
        downlink: this.networkInfo.downlink,
        rtt: this.networkInfo.rtt,
        saveData: this.networkInfo.saveData
      } : 'Not available'
    });
  }

  /**
   * إعداد مستمعي أحداث الشبكة
   */
  private setupNetworkListeners(): void {
    // الاستماع لتغييرات حالة الاتصال
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.onNetworkStatusChange();
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.onNetworkStatusChange();
    });

    // الاستماع لتغييرات معلومات الشبكة
    if (this.networkInfo) {
      this.networkInfo.addEventListener('change', () => {
        this.isSlowConnection = this.isConnectionSlow();
        this.onNetworkStatusChange();
      });
    }
  }

  /**
   * التحقق مما إذا كان الاتصال بطيئًا
   * @returns هل الاتصال بطيء
   */
  private isConnectionSlow(): boolean {
    if (!this.networkInfo) return false;

    // اعتبار الاتصال بطيئًا إذا كان نوع الاتصال الفعال 2g أو slow-2g
    const slowEffectiveTypes = ['slow-2g', '2g'];
    if (slowEffectiveTypes.includes(this.networkInfo.effectiveType)) {
      return true;
    }

    // اعتبار الاتصال بطيئًا إذا كانت سرعة التنزيل أقل من 0.5 ميجابت/ثانية
    if (this.networkInfo.downlink < 0.5) {
      return true;
    }

    // اعتبار الاتصال بطيئًا إذا كان وقت الذهاب والعودة أكبر من 500 مللي ثانية
    if (this.networkInfo.rtt > 500) {
      return true;
    }

    // اعتبار الاتصال بطيئًا إذا كان وضع توفير البيانات مفعلًا
    if (this.networkInfo.saveData) {
      return true;
    }

    return false;
  }

  /**
   * معالجة تغيير حالة الشبكة
   */
  private onNetworkStatusChange(): void {
    console.log('Network status changed:', {
      isOffline: this.isOffline,
      isSlowConnection: this.isSlowConnection
    });

    // تطبيق الإعدادات المناسبة بناءً على حالة الشبكة
    if (this.isOffline) {
      this.applyOfflineMode();
    } else if (this.isSlowConnection) {
      this.applyLowBandwidthMode();
    } else {
      this.applyNormalMode();
    }

    // إرسال إشعار بتغيير حالة الشبكة
    this.dispatchNetworkStatusEvent();
  }

  /**
   * تطبيق وضع عدم الاتصال
   */
  private applyOfflineMode(): void {
    // إضافة فئة CSS للجسم
    document.body.classList.add('offline-mode');
    document.body.classList.remove('low-bandwidth-mode');

    // عرض إشعار عدم الاتصال
    this.showOfflineNotification();
  }

  /**
   * تطبيق وضع النطاق الترددي المنخفض
   */
  private applyLowBandwidthMode(): void {
    // إضافة فئة CSS للجسم
    document.body.classList.add('low-bandwidth-mode');
    document.body.classList.remove('offline-mode');

    // تقليل جودة الصور وتعطيل الرسوم المتحركة
    this.optimizeForLowBandwidth();
  }

  /**
   * تطبيق الوضع العادي
   */
  private applyNormalMode(): void {
    // إزالة فئات CSS
    document.body.classList.remove('offline-mode', 'low-bandwidth-mode');

    // استعادة الإعدادات العادية
    this.restoreNormalSettings();
  }

  /**
   * عرض إشعار عدم الاتصال
   */
  private showOfflineNotification(): void {
    // التحقق من وجود إشعار عدم الاتصال
    let offlineNotification = document.getElementById('offline-notification');
    
    if (!offlineNotification) {
      // إنشاء إشعار عدم الاتصال
      offlineNotification = document.createElement('div');
      offlineNotification.id = 'offline-notification';
      offlineNotification.className = 'offline-notification';
      offlineNotification.innerHTML = `
        <div class="offline-notification-content">
          <i class="fas fa-wifi-slash"></i>
          <span>أنت غير متصل بالإنترنت. بعض الميزات قد لا تعمل بشكل صحيح.</span>
        </div>
      `;
      
      // إضافة أنماط CSS
      const style = document.createElement('style');
      style.textContent = `
        .offline-notification {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          background-color: #f44336;
          color: white;
          text-align: center;
          padding: 10px;
          z-index: 9999;
        }
        .offline-notification-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(offlineNotification);
    } else {
      // إظهار الإشعار إذا كان موجودًا
      offlineNotification.style.display = 'block';
    }
  }

  /**
   * تحسين للنطاق الترددي المنخفض
   */
  private optimizeForLowBandwidth(): void {
    // تقليل جودة الصور
    const images = document.querySelectorAll('img:not([data-low-bandwidth-applied])');
    images.forEach((img: HTMLImageElement) => {
      // حفظ المصدر الأصلي
      if (!img.hasAttribute('data-original-src')) {
        img.setAttribute('data-original-src', img.src);
      }
      
      // تطبيق نسخة منخفضة الجودة إذا كانت متاحة
      const lowQualitySrc = img.getAttribute('data-low-quality-src');
      if (lowQualitySrc) {
        img.src = lowQualitySrc;
      }
      
      // وضع علامة على الصورة
      img.setAttribute('data-low-bandwidth-applied', 'true');
    });
    
    // تعطيل الرسوم المتحركة غير الضرورية
    document.body.classList.add('reduce-animations');
    
    // تأجيل تحميل المحتوى غير الضروري
    this.deferNonEssentialContent();
  }

  /**
   * استعادة الإعدادات العادية
   */
  private restoreNormalSettings(): void {
    // استعادة جودة الصور الأصلية
    const images = document.querySelectorAll('img[data-low-bandwidth-applied]');
    images.forEach((img: HTMLImageElement) => {
      const originalSrc = img.getAttribute('data-original-src');
      if (originalSrc) {
        img.src = originalSrc;
      }
      
      img.removeAttribute('data-low-bandwidth-applied');
    });
    
    // إعادة تمكين الرسوم المتحركة
    document.body.classList.remove('reduce-animations');
    
    // إخفاء إشعار عدم الاتصال
    const offlineNotification = document.getElementById('offline-notification');
    if (offlineNotification) {
      offlineNotification.style.display = 'none';
    }
    
    // تحميل المحتوى المؤجل
    this.loadDeferredContent();
  }

  /**
   * تأجيل تحميل المحتوى غير الضروري
   */
  private deferNonEssentialContent(): void {
    // تأجيل تحميل الصور غير المرئية
    const lazyImages = document.querySelectorAll('img[data-src]:not([data-essential="true"])');
    lazyImages.forEach((img: HTMLImageElement) => {
      // إزالة المصدر لمنع التحميل
      if (!img.hasAttribute('data-original-src')) {
        img.setAttribute('data-original-src', img.src);
      }
      img.removeAttribute('src');
    });
    
    // تأجيل تحميل الفيديوهات
    const videos = document.querySelectorAll('video:not([data-essential="true"])');
    videos.forEach((video: HTMLVideoElement) => {
      video.pause();
      video.preload = 'none';
    });
  }

  /**
   * تحميل المحتوى المؤجل
   */
  private loadDeferredContent(): void {
    // تحميل الصور المؤجلة
    const lazyImages = document.querySelectorAll('img[data-original-src]:not([src])');
    lazyImages.forEach((img: HTMLImageElement) => {
      const originalSrc = img.getAttribute('data-original-src');
      if (originalSrc) {
        img.src = originalSrc;
      }
    });
    
    // استئناف تحميل الفيديوهات
    const videos = document.querySelectorAll('video[preload="none"]:not([data-essential="true"])');
    videos.forEach((video: HTMLVideoElement) => {
      video.preload = 'metadata';
    });
  }

  /**
   * إرسال حدث تغيير حالة الشبكة
   */
  private dispatchNetworkStatusEvent(): void {
    const event = new CustomEvent('networkStatusChange', {
      detail: {
        isOffline: this.isOffline,
        isSlowConnection: this.isSlowConnection,
        networkInfo: this.networkInfo ? {
          effectiveType: this.networkInfo.effectiveType,
          downlink: this.networkInfo.downlink,
          rtt: this.networkInfo.rtt,
          saveData: this.networkInfo.saveData
        } : null
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * الحصول على حالة الشبكة الحالية
   * @returns حالة الشبكة
   */
  public getNetworkStatus(): { isOffline: boolean, isSlowConnection: boolean, networkInfo: any } {
    return {
      isOffline: this.isOffline,
      isSlowConnection: this.isSlowConnection,
      networkInfo: this.networkInfo ? {
        effectiveType: this.networkInfo.effectiveType,
        downlink: this.networkInfo.downlink,
        rtt: this.networkInfo.rtt,
        saveData: this.networkInfo.saveData
      } : null
    };
  }

  /**
   * التحقق مما إذا كان المستخدم في وضع عدم الاتصال
   * @returns هل المستخدم في وضع عدم الاتصال
   */
  public isUserOffline(): boolean {
    return this.isOffline;
  }

  /**
   * التحقق مما إذا كان المستخدم على اتصال بطيء
   * @returns هل المستخدم على اتصال بطيء
   */
  public isUserOnSlowConnection(): boolean {
    return this.isSlowConnection;
  }

  /**
   * التحقق مما إذا كان المستخدم في وضع توفير البيانات
   * @returns هل المستخدم في وضع توفير البيانات
   */
  public isDataSaverEnabled(): boolean {
    return this.networkInfo ? this.networkInfo.saveData : false;
  }
}
