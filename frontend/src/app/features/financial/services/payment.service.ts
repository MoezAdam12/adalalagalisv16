// frontend/src/app/features/financial/services/payment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api/financial/payments`;

  constructor(private http: HttpClient) { }

  /**
   * Get all payments
   * @param params - Query parameters for filtering
   */
  getPayments(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  /**
   * Get payment by ID
   * @param id - Payment ID
   */
  getPayment(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new payment
   * @param paymentData - Payment data
   */
  createPayment(paymentData: any): Observable<any> {
    return this.http.post(this.apiUrl, paymentData);
  }

  /**
   * Apply payment to invoices
   * @param id - Payment ID
   * @param invoiceApplications - Invoice applications data
   */
  applyPayment(id: string, invoiceApplications: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/apply`, { invoice_applications: invoiceApplications });
  }

  /**
   * Delete payment
   * @param id - Payment ID
   */
  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Remove payment application
   * @param id - Payment ID
   * @param applicationId - Payment application ID
   */
  removeApplication(id: string, applicationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/applications/${applicationId}`);
  }
}
