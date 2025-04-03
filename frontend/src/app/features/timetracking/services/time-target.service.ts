import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeTargetService {
  private apiUrl = `${environment.apiUrl}/api/timetracking/time-targets`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Create a new time target
   * @param timeTargetData Time target data
   * @returns Observable with created time target
   */
  createTimeTarget(timeTargetData: any): Observable<any> {
    return this.http.post(this.apiUrl, timeTargetData);
  }
  
  /**
   * Create monthly time targets
   * @param monthlyTargetData Monthly target data
   * @returns Observable with created monthly targets
   */
  createMonthlyTargets(monthlyTargetData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/monthly`, monthlyTargetData);
  }
  
  /**
   * Get time targets with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with time targets
   */
  getTimeTargets(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(this.apiUrl, { params: httpParams });
  }
  
  /**
   * Get a single time target by ID
   * @param id Time target ID
   * @returns Observable with time target
   */
  getTimeTarget(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Update a time target
   * @param id Time target ID
   * @param timeTargetData Updated time target data
   * @returns Observable with updated time target
   */
  updateTimeTarget(id: string, timeTargetData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, timeTargetData);
  }
  
  /**
   * Delete a time target
   * @param id Time target ID
   * @returns Observable with deletion result
   */
  deleteTimeTarget(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Get time target progress
   * @param id Time target ID
   * @returns Observable with time target progress
   */
  getTimeTargetProgress(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/progress`);
  }
  
  /**
   * Get active time target for a user
   * @param userId User ID
   * @param date Optional date to check (defaults to current date)
   * @returns Observable with active time target
   */
  getActiveTimeTarget(userId: string, date?: string): Observable<any> {
    let params = new HttpParams().set('user_id', userId);
    
    if (date) {
      params = params.set('date', date);
    }
    
    return this.http.get(`${environment.apiUrl}/api/timetracking/active-time-target`, { params });
  }
}
