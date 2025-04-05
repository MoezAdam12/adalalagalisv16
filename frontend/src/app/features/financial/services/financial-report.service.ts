// frontend/src/app/features/financial/services/financial-report.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FinancialReportService {
  private apiUrl = `${environment.apiUrl}/api/financial/reports`;

  constructor(private http: HttpClient) { }

  /**
   * Get income statement (profit and loss)
   * @param params - Query parameters for date range and other filters
   */
  getIncomeStatement(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/income-statement`, { params });
  }

  /**
   * Get balance sheet
   * @param params - Query parameters for date and other filters
   */
  getBalanceSheet(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/balance-sheet`, { params });
  }

  /**
   * Get cash flow statement
   * @param params - Query parameters for date range and other filters
   */
  getCashFlowStatement(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/cash-flow`, { params });
  }

  /**
   * Get accounts receivable aging report
   * @param params - Query parameters for date and other filters
   */
  getAccountsReceivableAging(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/ar-aging`, { params });
  }

  /**
   * Get accounts payable aging report
   * @param params - Query parameters for date and other filters
   */
  getAccountsPayableAging(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/ap-aging`, { params });
  }

  /**
   * Get general ledger report
   * @param params - Query parameters for date range, account, and other filters
   */
  getGeneralLedger(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/general-ledger`, { params });
  }

  /**
   * Get trial balance
   * @param params - Query parameters for date and other filters
   */
  getTrialBalance(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/trial-balance`, { params });
  }

  /**
   * Get tax summary report
   * @param params - Query parameters for date range and other filters
   */
  getTaxSummary(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tax-summary`, { params });
  }

  /**
   * Get client profitability report
   * @param params - Query parameters for date range, client, and other filters
   */
  getClientProfitability(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/client-profitability`, { params });
  }

  /**
   * Get case profitability report
   * @param params - Query parameters for date range, case, and other filters
   */
  getCaseProfitability(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/case-profitability`, { params });
  }

  /**
   * Export report to PDF
   * @param reportType - Type of report
   * @param params - Report parameters
   */
  exportReportToPdf(reportType: string, params?: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportType}/export/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Export report to Excel
   * @param reportType - Type of report
   * @param params - Report parameters
   */
  exportReportToExcel(reportType: string, params?: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportType}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }
}
