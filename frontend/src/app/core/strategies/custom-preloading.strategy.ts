import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  private preloadedModules: Set<string> = new Set<string>();

  /**
   * استراتيجية التحميل المسبق المخصصة
   * @param route المسار
   * @param load دالة التحميل
   * @returns Observable للتحميل المسبق
   */
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // تحميل الوحدات ذات الأولوية العالية مسبقًا
    if (route.data && route.data['preload'] === true) {
      this.preloadedModules.add(route.path);
      return load();
    }

    // تحميل الوحدات المستخدمة بشكل متكرر مسبقًا عندما يكون المستخدم خاملًا
    if (route.data && route.data['preloadWhenIdle'] === true) {
      return this.preloadWhenIdle(route, load);
    }

    // تحميل الوحدات المستخدمة بشكل متكرر مسبقًا عندما تكون الشبكة سريعة
    if (route.data && route.data['preloadOnGoodNetwork'] === true) {
      return this.preloadOnGoodNetwork(route, load);
    }

    // عدم التحميل المسبق للوحدات الأخرى
    return of(null);
  }

  /**
   * التحميل المسبق عندما يكون المستخدم خاملًا
   * @param route المسار
   * @param load دالة التحميل
   * @returns Observable للتحميل المسبق
   */
  private preloadWhenIdle(route: Route, load: () => Observable<any>): Observable<any> {
    if ('requestIdleCallback' in window) {
      return new Observable(observer => {
        (window as any).requestIdleCallback(() => {
          this.preloadedModules.add(route.path);
          const loadObservable = load();
          loadObservable.subscribe(observer);
        }, { timeout: 10000 });
      });
    } else {
      // استخدام setTimeout كبديل لـ requestIdleCallback
      return new Observable(observer => {
        setTimeout(() => {
          this.preloadedModules.add(route.path);
          const loadObservable = load();
          loadObservable.subscribe(observer);
        }, 5000);
      });
    }
  }

  /**
   * التحميل المسبق عندما تكون الشبكة سريعة
   * @param route المسار
   * @param load دالة التحميل
   * @returns Observable للتحميل المسبق
   */
  private preloadOnGoodNetwork(route: Route, load: () => Observable<any>): Observable<any> {
    // التحقق من سرعة الاتصال
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      
      // تحميل مسبق فقط على الشبكات السريعة (4g أو wifi)
      if (connection.effectiveType === '4g' || connection.type === 'wifi') {
        this.preloadedModules.add(route.path);
        return load();
      }
    }
    
    return of(null);
  }

  /**
   * التحقق مما إذا كانت الوحدة قد تم تحميلها مسبقًا
   * @param path مسار الوحدة
   * @returns هل تم تحميل الوحدة مسبقًا
   */
  isModulePreloaded(path: string): boolean {
    return this.preloadedModules.has(path);
  }

  /**
   * الحصول على قائمة الوحدات المحملة مسبقًا
   * @returns قائمة الوحدات المحملة مسبقًا
   */
  getPreloadedModules(): string[] {
    return Array.from(this.preloadedModules);
  }
}
