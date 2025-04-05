import { BehaviorSubject, Observable } from 'rxjs';

/**
 * الفئة الأساسية للواجهة
 * توفر واجهة بسيطة للتفاعل مع النظام المعقد
 * @template T نوع الكيان الذي تتعامل معه الواجهة
 */
export abstract class BaseFacade<T> {
  /**
   * موضوع سلوكي لتخزين حالة الكيانات
   * @protected
   */
  protected entities$ = new BehaviorSubject<T[]>([]);
  
  /**
   * موضوع سلوكي لتخزين حالة الكيان المحدد
   * @protected
   */
  protected selectedEntity$ = new BehaviorSubject<T | null>(null);
  
  /**
   * موضوع سلوكي لتخزين حالة التحميل
   * @protected
   */
  protected loading$ = new BehaviorSubject<boolean>(false);
  
  /**
   * موضوع سلوكي لتخزين حالة الخطأ
   * @protected
   */
  protected error$ = new BehaviorSubject<string | null>(null);

  /**
   * الحصول على تدفق رصدي للكيانات
   * @returns تدفق رصدي يحتوي على مصفوفة من الكيانات
   */
  getEntities(): Observable<T[]> {
    return this.entities$.asObservable();
  }

  /**
   * الحصول على تدفق رصدي للكيان المحدد
   * @returns تدفق رصدي يحتوي على الكيان المحدد
   */
  getSelectedEntity(): Observable<T | null> {
    return this.selectedEntity$.asObservable();
  }

  /**
   * الحصول على تدفق رصدي لحالة التحميل
   * @returns تدفق رصدي يحتوي على حالة التحميل
   */
  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /**
   * الحصول على تدفق رصدي لحالة الخطأ
   * @returns تدفق رصدي يحتوي على رسالة الخطأ
   */
  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * تحميل جميع الكيانات
   * @abstract
   */
  abstract loadAll(): void;

  /**
   * تحميل كيان بواسطة المعرف
   * @param id معرف الكيان
   * @abstract
   */
  abstract loadById(id: number | string): void;

  /**
   * إنشاء كيان جديد
   * @param entity الكيان المراد إنشاؤه
   * @abstract
   */
  abstract create(entity: Partial<T>): void;

  /**
   * تحديث كيان موجود
   * @param id معرف الكيان
   * @param entity الكيان المحدث
   * @abstract
   */
  abstract update(id: number | string, entity: Partial<T>): void;

  /**
   * حذف كيان
   * @param id معرف الكيان
   * @abstract
   */
  abstract delete(id: number | string): void;

  /**
   * تحديد كيان
   * @param entity الكيان المراد تحديده
   */
  selectEntity(entity: T | null): void {
    this.selectedEntity$.next(entity);
  }

  /**
   * تعيين حالة التحميل
   * @param loading حالة التحميل
   * @protected
   */
  protected setLoading(loading: boolean): void {
    this.loading$.next(loading);
  }

  /**
   * تعيين حالة الخطأ
   * @param error رسالة الخطأ
   * @protected
   */
  protected setError(error: string | null): void {
    this.error$.next(error);
  }
}
