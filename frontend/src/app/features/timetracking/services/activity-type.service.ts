import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivityTypeService {
  private apiUrl = `${environment.apiUrl}/api/timetracking/activity-types`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Create a new activity type
   * @param activityTypeData Activity type data
   * @returns Observable with created activity type
   */
  createActivityType(activityTypeData: any): Observable<any> {
    return this.http.post(this.apiUrl, activityTypeData);
  }
  
  /**
   * Get activity types with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with activity types
   */
  getActivityTypes(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(this.apiUrl, { params: httpParams });
  }
  
  /**
   * Get a single activity type by ID
   * @param id Activity type ID
   * @returns Observable with activity type
   */
  getActivityType(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Update an activity type
   * @param id Activity type ID
   * @param activityTypeData Updated activity type data
   * @returns Observable with updated activity type
   */
  updateActivityType(id: string, activityTypeData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, activityTypeData);
  }
  
  /**
   * Delete an activity type
   * @param id Activity type ID
   * @returns Observable with deletion result
   */
  deleteActivityType(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
