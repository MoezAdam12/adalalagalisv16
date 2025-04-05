/**
 * @file lazy-loading.utils.ts
 * @description أدوات مساعدة للتحميل البطيء للمكونات
 * توفر هذه الأدوات وظائف لتحسين أوقات التحميل الأولية من خلال تحميل المكونات بشكل بطيء
 */

import { NgModuleFactory, Type, Injector, NgModuleRef } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * واجهة لتكوين التحميل البطيء
 */
export interface LazyLoadConfig {
  path: string;
  loadChildren: () => Promise<Type<any> | NgModuleFactory<any>>;
}

/**
 * أدوات مساعدة للتحميل البطيء
 */
export class LazyLoadingUtils {
  
  /**
   * تحميل وحدة بشكل بطيء
   * @param path مسار الوحدة
   * @param loadChildren دالة تحميل الوحدة
   * @returns Observable مع مرجع الوحدة
   */
  public static lazyLoadModule(
    path: string,
    loadChildren: () => Promise<Type<any> | NgModuleFactory<any>>,
    injector: Injector
  ): Observable<NgModuleRef<any>> {
    return from(loadChildren()).pipe(
      map((moduleOrFactory) => {
        if (moduleOrFactory instanceof NgModuleFactory) {
          // إذا كان المصنع جاهزًا (AOT)
          return moduleOrFactory.create(injector);
        } else {
          // إذا كان النوع (JIT)
          throw new Error('JIT compilation is not supported in production mode');
        }
      })
    );
  }
  
  /**
   * إنشاء تكوين التحميل البطيء
   * @param path مسار الوحدة
   * @param modulePath مسار ملف الوحدة
   * @param moduleName اسم الوحدة
   * @returns تكوين التحميل البطيء
   */
  public static createLazyLoadConfig(
    path: string,
    modulePath: string,
    moduleName: string
  ): LazyLoadConfig {
    return {
      path,
      loadChildren: () => import(`${modulePath}`).then(m => m[moduleName])
    };
  }
  
  /**
   * تحميل مكون بشكل بطيء
   * @param componentPath مسار ملف المكون
   * @param componentName اسم المكون
   * @returns وعد مع المكون
   */
  public static lazyLoadComponent<T>(
    componentPath: string,
    componentName: string
  ): Promise<Type<T>> {
    return import(`${componentPath}`).then(m => m[componentName]);
  }
  
  /**
   * تحميل مسبق للوحدات
   * @param configs قائمة بتكوينات التحميل البطيء
   */
  public static preloadLazyModules(configs: LazyLoadConfig[]): void {
    // تحميل الوحدات في الخلفية بعد تحميل الصفحة
    window.addEventListener('load', () => {
      setTimeout(() => {
        configs.forEach(config => {
          // تحميل الوحدة في الخلفية
          config.loadChildren().then(() => {
            console.log(`[LazyLoading] Preloaded module: ${config.path}`);
          }).catch(error => {
            console.error(`[LazyLoading] Error preloading module: ${config.path}`, error);
          });
        });
      }, 1000); // تأخير التحميل المسبق لمدة ثانية واحدة بعد تحميل الصفحة
    });
  }
  
  /**
   * تحميل مسبق للمكونات
   * @param componentPaths قائمة بمسارات المكونات
   */
  public static preloadComponents(componentPaths: { path: string, name: string }[]): void {
    // تحميل المكونات في الخلفية بعد تحميل الصفحة
    window.addEventListener('load', () => {
      setTimeout(() => {
        componentPaths.forEach(component => {
          // تحميل المكون في الخلفية
          import(`${component.path}`).then(() => {
            console.log(`[LazyLoading] Preloaded component: ${component.name}`);
          }).catch(error => {
            console.error(`[LazyLoading] Error preloading component: ${component.name}`, error);
          });
        });
      }, 2000); // تأخير التحميل المسبق لمدة ثانيتين بعد تحميل الصفحة
    });
  }
  
  /**
   * تحميل بطيء للصور
   * @param imageUrl رابط الصورة
   * @param placeholder رابط صورة بديلة أثناء التحميل
   * @returns وعد مع رابط الصورة المحملة
   */
  public static lazyLoadImage(imageUrl: string, placeholder: string = ''): Promise<string> {
    return new Promise((resolve) => {
      // إنشاء عنصر صورة جديد
      const img = new Image();
      
      // عند اكتمال تحميل الصورة
      img.onload = () => {
        resolve(imageUrl);
      };
      
      // في حالة حدوث خطأ أثناء تحميل الصورة
      img.onerror = () => {
        resolve(placeholder);
      };
      
      // تعيين مصدر الصورة لبدء التحميل
      img.src = imageUrl;
    });
  }
  
  /**
   * تحميل بطيء للنصوص البرمجية
   * @param scriptUrl رابط النص البرمجي
   * @param async تحميل غير متزامن (اختياري، الافتراضي true)
   * @param defer تأجيل التحميل (اختياري، الافتراضي true)
   * @returns وعد يتم حله عند اكتمال تحميل النص البرمجي
   */
  public static lazyLoadScript(scriptUrl: string, async: boolean = true, defer: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      // التحقق مما إذا كان النص البرمجي محملاً بالفعل
      if (document.querySelector(`script[src="${scriptUrl}"]`)) {
        resolve();
        return;
      }
      
      // إنشاء عنصر نص برمجي جديد
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = async;
      script.defer = defer;
      
      // عند اكتمال تحميل النص البرمجي
      script.onload = () => {
        resolve();
      };
      
      // في حالة حدوث خطأ أثناء تحميل النص البرمجي
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${scriptUrl}`));
      };
      
      // إضافة النص البرمجي إلى الصفحة
      document.body.appendChild(script);
    });
  }
  
  /**
   * تحميل بطيء لأوراق الأنماط
   * @param styleUrl رابط ورقة الأنماط
   * @returns وعد يتم حله عند اكتمال تحميل ورقة الأنماط
   */
  public static lazyLoadStyle(styleUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // التحقق مما إذا كانت ورقة الأنماط محملة بالفعل
      if (document.querySelector(`link[href="${styleUrl}"]`)) {
        resolve();
        return;
      }
      
      // إنشاء عنصر رابط جديد
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = styleUrl;
      
      // عند اكتمال تحميل ورقة الأنماط
      link.onload = () => {
        resolve();
      };
      
      // في حالة حدوث خطأ أثناء تحميل ورقة الأنماط
      link.onerror = () => {
        reject(new Error(`Failed to load style: ${styleUrl}`));
      };
      
      // إضافة ورقة الأنماط إلى الصفحة
      document.head.appendChild(link);
    });
  }
}
