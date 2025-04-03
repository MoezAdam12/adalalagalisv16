import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/api/hr/leaves`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Create a new leave request
   * @param leaveData Leave request data
   * @returns Observable with created leave request
   */
  createLeave(leaveData: any): Observable<any> {
    return this.http.post(this.apiUrl, leaveData);
  }
  
  /**
   * Get leave requests with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with leave requests
   */
  getLeaves(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(this.apiUrl, { params: httpParams });
  }
  
  /**
   * Get a single leave request by ID
   * @param id Leave request ID
   * @returns Observable with leave request
   */
  getLeave(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Update a leave request
   * @param id Leave request ID
   * @param leaveData Updated leave request data
   * @returns Observable with updated leave request
   */
  updateLeave(id: string, leaveData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, leaveData);
  }
  
  /**
   * Delete a leave request
   * @param id Leave request ID
   * @returns Observable with deletion result
   */
  deleteLeave(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Get leave requests by employee
   * @param employeeId Employee ID
   * @returns Observable with leave requests for the employee
   */
  getLeavesByEmployee(employeeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee/${employeeId}`);
  }
  
  /**
   * Get leave requests by status
   * @param status Leave request status
   * @returns Observable with leave requests with the specified status
   */
  getLeavesByStatus(status: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${status}`);
  }
  
  /**
   * Get current and upcoming leave requests
   * @returns Observable with current and upcoming leave requests
   */
  getCurrentAndUpcomingLeaves(): Observable<any> {
    return this.http.get(`${this.apiUrl}/current-and-upcoming`);
  }
  
  /**
   * Approve a leave request
   * @param id Leave request ID
   * @returns Observable with approved leave request
   */
  approveLeave(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, {});
  }
  
  /**
   * Reject a leave request
   * @param id Leave request ID
   * @param reason Rejection reason
   * @returns Observable with rejected leave request
   */
  rejectLeave(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, { reason });
  }
}
