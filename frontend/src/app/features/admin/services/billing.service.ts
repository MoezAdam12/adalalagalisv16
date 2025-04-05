import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all subscription tiers
   */
  getSubscriptionTiers(params: any = {}): Observable<any> {
    return this.apiService.get('/billing/tiers', params);
  }

  /**
   * Get subscription tier by ID
   */
  getSubscriptionTierById(id: string): Observable<any> {
    return this.apiService.get(`/billing/tiers/${id}`);
  }

  /**
   * Create a new subscription tier
   */
  createSubscriptionTier(tierData: any): Observable<any> {
    return this.apiService.post('/billing/tiers', tierData);
  }

  /**
   * Update an existing subscription tier
   */
  updateSubscriptionTier(id: string, tierData: any): Observable<any> {
    return this.apiService.put(`/billing/tiers/${id}`, tierData);
  }

  /**
   * Delete a subscription tier
   */
  deleteSubscriptionTier(id: string): Observable<any> {
    return this.apiService.delete(`/billing/tiers/${id}`);
  }

  /**
   * Get tenant's current subscription
   */
  getTenantSubscription(): Observable<any> {
    return this.apiService.get('/billing/subscription');
  }

  /**
   * Get tenant's subscription history
   */
  getTenantSubscriptionHistory(): Observable<any> {
    return this.apiService.get('/billing/subscription/history');
  }

  /**
   * Subscribe tenant to a tier
   */
  subscribeTenant(subscriptionData: any): Observable<any> {
    return this.apiService.post('/billing/subscribe', subscriptionData);
  }

  /**
   * Cancel tenant subscription
   */
  cancelSubscription(data: any): Observable<any> {
    return this.apiService.post('/billing/subscription/cancel', data);
  }

  /**
   * Get tenant invoices
   */
  getTenantInvoices(params: any = {}): Observable<any> {
    return this.apiService.get('/billing/invoices', params);
  }

  /**
   * Get invoice by ID
   */
  getInvoiceById(id: string): Observable<any> {
    return this.apiService.get(`/billing/invoices/${id}`);
  }

  /**
   * Get tenant payment methods
   */
  getTenantPaymentMethods(): Observable<any> {
    return this.apiService.get('/billing/payment-methods');
  }

  /**
   * Add a new payment method
   */
  addPaymentMethod(paymentMethodData: any): Observable<any> {
    return this.apiService.post('/billing/payment-methods', paymentMethodData);
  }

  /**
   * Update an existing payment method
   */
  updatePaymentMethod(id: string, paymentMethodData: any): Observable<any> {
    return this.apiService.put(`/billing/payment-methods/${id}`, paymentMethodData);
  }

  /**
   * Delete a payment method
   */
  deletePaymentMethod(id: string): Observable<any> {
    return this.apiService.delete(`/billing/payment-methods/${id}`);
  }
}
