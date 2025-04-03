import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BillingRateService {
  private apiUrl = `${environment.apiUrl}/api/timetracking/billing-rates`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Create a new billing rate
   * @param billingRateData Billing rate data
   * @returns Observable with created billing rate
   */
  createBillingRate(billingRateData: any): Observable<any> {
    return this.http.post(this.apiUrl, billingRateData);
  }
  
  /**
   * Get billing rates with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with billing rates
   */
  getBillingRates(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(this.apiUrl, { params: httpParams });
  }
  
  /**
   * Get a single billing rate by ID
   * @param id Billing rate ID
   * @returns Observable with billing rate
   */
  getBillingRate(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Update a billing rate
   * @param id Billing rate ID
   * @param billingRateData Updated billing rate data
   * @returns Observable with updated billing rate
   */
  updateBillingRate(id: string, billingRateData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, billingRateData);
  }
  
  /**
   * Delete a billing rate
   * @param id Billing rate ID
   * @returns Observable with deletion result
   */
  deleteBillingRate(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Find applicable billing rate based on parameters
   * @param params Query parameters for finding applicable rate
   * @returns Observable with applicable billing rate
   */
  findApplicableRate(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(`${environment.apiUrl}/api/timetracking/applicable-rate`, { params: httpParams });
  }
}
