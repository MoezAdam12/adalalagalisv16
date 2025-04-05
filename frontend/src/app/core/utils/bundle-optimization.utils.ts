/**
 * @file bundle-optimization.utils.ts
 * @description أدوات مساعدة لتحسين حجم الحزمة
 * توفر هذه الأدوات وظائف لتحسين حجم الحزمة من خلال تقنيات مثل تقسيم الكود وتهذيب الشجرة
 */

import { Injectable } from '@angular/core';

/**
 * خدمة تحسين حجم الحزمة
 * توفر وظائف لتحسين حجم الحزمة وتقليل وقت التحميل
 */
@Injectable({
  providedIn: 'root'
})
export class BundleOptimizationUtils {
  
  constructor() {}
  
  /**
   * تحليل حجم الحزمة
   * يقوم بتحليل حجم الحزمة وطباعة معلومات عن الحجم في وحدة التحكم
   */
  public analyzeBundleSize(): void {
    if (typeof window !== 'undefined') {
      // الحصول على جميع عناصر النص البرمجي في الصفحة
      const scripts = document.querySelectorAll('script');
      
      let totalSize = 0;
      const bundleInfo: { name: string, size: number }[] = [];
      
      // حساب حجم كل نص برمجي
      scripts.forEach(script => {
        if (script.src) {
          this.fetchResourceSize(script.src).then(size => {
            const name = script.src.split('/').pop() || script.src;
            bundleInfo.push({ name, size });
            totalSize += size;
            
            console.log(`[BundleAnalyzer] Script: ${name}, Size: ${this.formatSize(size)}`);
          });
        }
      });
      
      // الحصول على جميع أوراق الأنماط في الصفحة
      const styles = document.querySelectorAll('link[rel="stylesheet"]');
      
      // حساب حجم كل ورقة أنماط
      styles.forEach(style => {
        if (style.href) {
          this.fetchResourceSize(style.href).then(size => {
            const name = style.href.split('/').pop() || style.href;
            bundleInfo.push({ name, size });
            totalSize += size;
            
            console.log(`[BundleAnalyzer] Style: ${name}, Size: ${this.formatSize(size)}`);
          });
        }
      });
      
      // طباعة إجمالي الحجم بعد ثانية واحدة
      setTimeout(() => {
        console.log(`[BundleAnalyzer] Total bundle size: ${this.formatSize(totalSize)}`);
        
        // ترتيب الحزم حسب الحجم
        bundleInfo.sort((a, b) => b.size - a.size);
        
        // طباعة أكبر 5 حزم
        console.log('[BundleAnalyzer] Largest bundles:');
        bundleInfo.slice(0, 5).forEach((bundle, index) => {
          console.log(`${index + 1}. ${bundle.name}: ${this.formatSize(bundle.size)}`);
        });
      }, 1000);
    }
  }
  
  /**
   * الحصول على حجم المورد
   * @param url رابط المورد
   * @returns وعد مع حجم المورد بالبايت
   */
  private fetchResourceSize(url: string): Promise<number> {
    return fetch(url, { method: 'HEAD' })
      .then(response => {
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : 0;
      })
      .catch(() => 0);
  }
  
  /**
   * تنسيق الحجم
   * @param bytes الحجم بالبايت
   * @returns الحجم المنسق (بايت، كيلوبايت، ميجابايت)
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * تحسين استيراد المكتبات
   * يوفر إرشادات لتحسين استيراد المكتبات لتقليل حجم الحزمة
   * @param libraryName اسم المكتبة
   * @returns إرشادات تحسين الاستيراد
   */
  public getOptimizedImportGuide(libraryName: string): string {
    const guides: { [key: string]: string } = {
      'lodash': 'import { map } from "lodash/map"; // استيراد دوال محددة بدلاً من المكتبة بأكملها',
      'moment': 'import moment from "moment/moment"; // استيراد الوظائف الأساسية فقط\n// استخدم date-fns بدلاً من moment للحصول على حجم أصغر',
      'rxjs': 'import { map } from "rxjs/operators"; // استيراد المشغلات المحددة فقط\nimport { Observable } from "rxjs"; // استيراد الكائنات المحددة فقط',
      'angular': 'import { Component } from "@angular/core"; // استيراد الديكوريتورات المحددة فقط',
      'material': 'import { MatButtonModule } from "@angular/material/button"; // استيراد الوحدات المحددة فقط'
    };
    
    return guides[libraryName] || `لا توجد إرشادات محددة لـ ${libraryName}. استخدم استيراد محدد للدوال والكائنات التي تحتاجها فقط.`;
  }
  
  /**
   * تحسين الصور
   * يوفر إرشادات لتحسين الصور لتقليل حجم الحزمة
   * @returns إرشادات تحسين الصور
   */
  public getImageOptimizationGuide(): string {
    return `
    إرشادات تحسين الصور:
    1. استخدم تنسيق WebP للصور حيثما أمكن
    2. قم بضغط الصور قبل استخدامها في التطبيق
    3. استخدم الصور ذات الأحجام المناسبة (تجنب تصغير الصور الكبيرة باستخدام CSS)
    4. استخدم سمة srcset لتوفير صور بأحجام مختلفة للشاشات المختلفة
    5. استخدم التحميل البطيء للصور التي ليست في منطقة العرض الأولية
    `;
  }
  
  /**
   * تحسين الخطوط
   * يوفر إرشادات لتحسين الخطوط لتقليل حجم الحزمة
   * @returns إرشادات تحسين الخطوط
   */
  public getFontOptimizationGuide(): string {
    return `
    إرشادات تحسين الخطوط:
    1. استخدم مجموعات فرعية من الخطوط تحتوي فقط على الأحرف المستخدمة
    2. استخدم تنسيق WOFF2 للخطوط حيثما أمكن
    3. قم بتحميل الخطوط الأساسية فقط في البداية وتأجيل تحميل الخطوط الأخرى
    4. استخدم font-display: swap لتحسين تجربة المستخدم أثناء تحميل الخطوط
    5. ضع في اعتبارك استخدام الخطوط النظامية بدلاً من تحميل خطوط مخصصة إذا أمكن
    `;
  }
  
  /**
   * تحسين CSS
   * يوفر إرشادات لتحسين CSS لتقليل حجم الحزمة
   * @returns إرشادات تحسين CSS
   */
  public getCssOptimizationGuide(): string {
    return `
    إرشادات تحسين CSS:
    1. استخدم CSS المستخدم فقط (PurgeCSS) لإزالة القواعد غير المستخدمة
    2. قم بدمج وضغط ملفات CSS
    3. استخدم متغيرات CSS بدلاً من تكرار القيم
    4. تجنب استخدام @import في CSS لأنه يبطئ التحميل
    5. استخدم أنماط محددة بدلاً من الأنماط العامة
    `;
  }
  
  /**
   * تحسين JavaScript
   * يوفر إرشادات لتحسين JavaScript لتقليل حجم الحزمة
   * @returns إرشادات تحسين JavaScript
   */
  public getJavaScriptOptimizationGuide(): string {
    return `
    إرشادات تحسين JavaScript:
    1. استخدم التحميل البطيء للوحدات والمكونات
    2. قم بتقسيم الكود إلى حزم أصغر
    3. استخدم تهذيب الشجرة لإزالة الكود غير المستخدم
    4. تجنب المكتبات الكبيرة إذا كنت تحتاج فقط إلى وظائف قليلة منها
    5. استخدم الاستيراد الديناميكي للوحدات الكبيرة
    `;
  }
  
  /**
   * تحسين الأداء العام
   * يوفر إرشادات لتحسين الأداء العام للتطبيق
   * @returns إرشادات تحسين الأداء العام
   */
  public getGeneralPerformanceGuide(): string {
    return `
    إرشادات تحسين الأداء العام:
    1. استخدم التخزين المؤقت للبيانات لتقليل طلبات الخادم
    2. قم بتحسين استعلامات قاعدة البيانات
    3. استخدم التخزين المؤقت على مستوى الخادم
    4. استخدم شبكة توصيل المحتوى (CDN) للأصول الثابتة
    5. قم بتحسين First Contentful Paint (FCP) من خلال تحميل المحتوى المهم أولاً
    6. استخدم التحميل المسبق للموارد المهمة
    7. قم بتأجيل تحميل JavaScript غير الضروري
    8. استخدم Web Workers للمهام الثقيلة
    `;
  }
}
