import { Observable } from 'rxjs';
import { BaseRepository } from '../repositories/base.repository';

/**
 * الفئة الأساسية للخدمة
 * توفر منطق الأعمال للتعامل مع الكيانات
 * @template T نوع الكيان الذي تتعامل معه الخدمة
 */
export abstract class BaseService<T> {
  /**
   * إنشاء نسخة من الخدمة الأساسية
   * @param repository المستودع المستخدم للوصول إلى البيانات
   */
  constructor(protected repository: BaseRepository<T>) {}

  /**
   * الحصول على جميع الكيانات
   * @returns تدفق رصدي يحتوي على مصفوفة من الكيانات
   */
  getAll(): Observable<T[]> {
    return this.repository.getAll();
  }

  /**
   * الحصول على كيان بواسطة المعرف
   * @param id معرف الكيان
   * @returns تدفق رصدي يحتوي على الكيان
   */
  getById(id: number | string): Observable<T> {
    return this.repository.getById(id);
  }

  /**
   * إنشاء كيان جديد
   * @param entity الكيان المراد إنشاؤه
   * @returns تدفق رصدي يحتوي على الكيان المنشأ
   */
  create(entity: Partial<T>): Observable<T> {
    // يمكن إضافة منطق التحقق من الصحة هنا قبل الإنشاء
    return this.repository.create(entity);
  }

  /**
   * تحديث كيان موجود
   * @param id معرف الكيان
   * @param entity الكيان المحدث
   * @returns تدفق رصدي يحتوي على الكيان المحدث
   */
  update(id: number | string, entity: Partial<T>): Observable<T> {
    // يمكن إضافة منطق التحقق من الصحة هنا قبل التحديث
    return this.repository.update(id, entity);
  }

  /**
   * حذف كيان
   * @param id معرف الكيان
   * @returns تدفق رصدي يحتوي على قيمة منطقية تشير إلى نجاح العملية
   */
  delete(id: number | string): Observable<boolean> {
    // يمكن إضافة منطق التحقق من الصلاحيات هنا قبل الحذف
    return this.repository.delete(id);
  }

  /**
   * البحث عن كيانات
   * @param query معايير البحث
   * @returns تدفق رصدي يحتوي على مصفوفة من الكيانات المطابقة
   */
  search(query: any): Observable<T[]> {
    // يمكن إضافة منطق معالجة الاستعلام هنا
    return this.repository.search(query);
  }

  /**
   * الحصول على كيانات مع تصفح الصفحات
   * @param page رقم الصفحة
   * @param limit عدد العناصر في الصفحة
   * @returns تدفق رصدي يحتوي على نتيجة التصفح
   */
  getPaginated(page: number, limit: number): Observable<{
    data: T[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.repository.getPaginated(page, limit);
  }

  /**
   * الحصول على كيانات متعددة بواسطة المعرفات
   * @param ids مصفوفة من المعرفات
   * @returns تدفق رصدي يحتوي على مصفوفة من الكيانات
   */
  getByIds(ids: (number | string)[]): Observable<T[]> {
    return this.repository.getByIds(ids);
  }
}
