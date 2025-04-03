// frontend/src/app/features/financial/services/account.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/api/financial/accounts`;

  constructor(private http: HttpClient) { }

  /**
   * Get all accounts
   * @param params - Query parameters for filtering
   */
  getAccounts(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  /**
   * Get chart of accounts (hierarchical structure)
   */
  getChartOfAccounts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chart`);
  }

  /**
   * Get account by ID
   * @param id - Account ID
   */
  getAccount(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Get account balance
   * @param id - Account ID
   * @param params - Query parameters for date range
   */
  getAccountBalance(id: string, params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/balance`, { params });
  }

  /**
   * Create new account
   * @param accountData - Account data
   */
  createAccount(accountData: any): Observable<any> {
    return this.http.post(this.apiUrl, accountData);
  }

  /**
   * Update account
   * @param id - Account ID
   * @param accountData - Updated account data
   */
  updateAccount(id: string, accountData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, accountData);
  }

  /**
   * Delete account
   * @param id - Account ID
   */
  deleteAccount(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
