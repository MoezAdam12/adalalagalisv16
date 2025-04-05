// frontend/src/app/features/financial/services/expense-category.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseCategoryService {
  private apiUrl = `${environment.apiUrl}/api/financial/expense-categories`;

  constructor(private http: HttpClient) { }

  /**
   * Get all expense categories
   * @param params - Query parameters for filtering
   */
  getExpenseCategories(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  /**
   * Get expense category by ID
   * @param id - Expense category ID
   */
  getExpenseCategory(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new expense category
   * @param categoryData - Expense category data
   */
  createExpenseCategory(categoryData: any): Observable<any> {
    return this.http.post(this.apiUrl, categoryData);
  }

  /**
   * Update expense category
   * @param id - Expense category ID
   * @param categoryData - Updated expense category data
   */
  updateExpenseCategory(id: string, categoryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, categoryData);
  }

  /**
   * Delete expense category
   * @param id - Expense category ID
   */
  deleteExpenseCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
