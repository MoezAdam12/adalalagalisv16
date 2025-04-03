// frontend/src/app/features/financial/services/invoice.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/api/financial/invoices`;

  constructor(private http: HttpClient) { }

  /**
   * Get all invoices
   * @param params - Query parameters for filtering
   */
  getInvoices(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  /**
   * Get invoice by ID
   * @param id - Invoice ID
   */
  getInvoice(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new invoice
   * @param invoiceData - Invoice data
   */
  createInvoice(invoiceData: any): Observable<any> {
    return this.http.post(this.apiUrl, invoiceData);
  }

  /**
   * Update invoice
   * @param id - Invoice ID
   * @param invoiceData - Updated invoice data
   */
  updateInvoice(id: string, invoiceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, invoiceData);
  }

  /**
   * Delete invoice
   * @param id - Invoice ID
   */
  deleteInvoice(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Send invoice
   * @param id - Invoice ID
   */
  sendInvoice(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/send`, {});
  }

  /**
   * Record payment for invoice
   * @param id - Invoice ID
   * @param amount - Payment amount
   */
  recordPayment(id: string, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/payment`, { amount });
  }

  /**
   * Cancel invoice
   * @param id - Invoice ID
   * @param reason - Cancellation reason
   */
  cancelInvoice(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/cancel`, { reason });
  }
}
