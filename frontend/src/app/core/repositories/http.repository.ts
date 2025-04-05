import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseRepository } from './base.repository';

/**
 * مستودع HTTP العام
 * يوفر تنفيذًا للمستودع الأساسي باستخدام HttpClient
 * @template T نوع الكيان الذي يتعامل معه المستودع
 */
@Injectable()
export class HttpRepository<T> implements BaseRepository<T> {
  /**
   * إنشاء نسخة من مستودع HTTP
   * @param http خدمة HttpClient
   * @param endpoint نقطة النهاية للواجهة البرمجية
   */
  constructor(
    protected http: HttpClient,
    protected endpoint: string
  ) {}

  /**
   * الحصول على جميع الكيانات
   * @returns تدفق رصدي يحتوي على مصفوفة من الكيانات
   */
  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.endpoint);
  }

  /**
   * الحصول على كيان بواسطة المعرف
   * @param id معرف الكيان
   * @returns تدفق رصدي يحتوي على الكيان
   */
  getById(id: number | string): Observable<T> {
    return this.http.get<T>(`${this.endpoint}/${id}`);
  }

  /**
   * إنشاء كيان جديد
   * @param entity الكيان المراد إنشاؤه
   * @returns تدفق رصدي يحتوي على الكيان المنشأ
   */
  create(entity: Partial<T>): Observable<T> {
    return this.http.post<T>(this.endpoint, entity);
  }

  /**
   * تحديث كيان موجود
   * @param id معرف الكيان
   * @param entity الكيان المحدث
   * @returns تدفق رصدي يحتوي على الكيان المحدث
   */
  update(id: number | string, entity: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.endpoint}/${id}`, entity);
  }

  /**
   * حذف كيان
   * @param id معرف الكيان
   * @returns تدفق رصدي يحتوي على قيمة منطقية تشير إلى نجاح العملية
   */
  delete(id: number | string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.endpoint}/${id}`);
  }

  /**
   * البحث عن كيانات
   * @param query معايير البحث
   * @returns تدفق رصدي يحتوي على مصفوفة من الكيانات المطابقة
   */
  search(query: any): Observable<T[]> {
    return this.http.get<T[]>(`${this.endpoint}/search`, { params: query });
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
    return this.http.get<{
      data: T[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.endpoint}`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  /**
   * الحصول على كيانات متعددة بواسطة المعرفات
   * @param ids مصفوفة من المعرفات
   * @returns تدفق رصدي يحتوي على مصفوفة من الكيانات
   */
  getByIds(ids: (number | string)[]): Observable<T[]> {
    return this.http.post<T[]>(`${this.endpoint}/batch`, { ids });
  }
}
