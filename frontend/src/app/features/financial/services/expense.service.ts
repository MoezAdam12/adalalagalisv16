// frontend/src/app/features/financial/services/expense.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/api/financial/expenses`;

  constructor(private http: HttpClient) { }

  /**
   * Get all expenses
   * @param params - Query parameters for filtering
   */
  getExpenses(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  /**
   * Get expense by ID
   * @param id - Expense ID
   */
  getExpense(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new expense
   * @param expenseData - Expense data
   */
  createExpense(expenseData: any): Observable<any> {
    return this.http.post(this.apiUrl, expenseData);
  }

  /**
   * Update expense
   * @param id - Expense ID
   * @param expenseData - Updated expense data
   */
  updateExpense(id: string, expenseData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, expenseData);
  }

  /**
   * Delete expense
   * @param id - Expense ID
   */
  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Approve expense
   * @param id - Expense ID
   */
  approveExpense(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * Reject expense
   * @param id - Expense ID
   * @param reason - Rejection reason
   */
  rejectExpense(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * Mark expense as paid
   * @param id - Expense ID
   * @param paymentData - Payment data
   */
  markAsPaid(id: string, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/mark-paid`, paymentData);
  }
}
