import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private apiUrl = `${environment.apiUrl}/api/timetracking/time-entries`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Create a new time entry
   * @param timeEntryData Time entry data
   * @returns Observable with created time entry
   */
  createTimeEntry(timeEntryData: any): Observable<any> {
    return this.http.post(this.apiUrl, timeEntryData);
  }
  
  /**
   * Get time entries with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with time entries
   */
  getTimeEntries(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(this.apiUrl, { params: httpParams });
  }
  
  /**
   * Get a single time entry by ID
   * @param id Time entry ID
   * @returns Observable with time entry
   */
  getTimeEntry(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Update a time entry
   * @param id Time entry ID
   * @param timeEntryData Updated time entry data
   * @returns Observable with updated time entry
   */
  updateTimeEntry(id: string, timeEntryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, timeEntryData);
  }
  
  /**
   * Delete a time entry
   * @param id Time entry ID
   * @returns Observable with deletion result
   */
  deleteTimeEntry(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Get time entries summary with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with time entries summary
   */
  getTimeEntriesSummary(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(`${this.apiUrl}-summary`, { params: httpParams });
  }
}
