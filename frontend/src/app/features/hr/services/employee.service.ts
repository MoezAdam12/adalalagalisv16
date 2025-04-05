import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/api/hr/employees`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Create a new employee
   * @param employeeData Employee data
   * @returns Observable with created employee
   */
  createEmployee(employeeData: any): Observable<any> {
    return this.http.post(this.apiUrl, employeeData);
  }
  
  /**
   * Get employees with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with employees
   */
  getEmployees(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(this.apiUrl, { params: httpParams });
  }
  
  /**
   * Get a single employee by ID
   * @param id Employee ID
   * @returns Observable with employee
   */
  getEmployee(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Update an employee
   * @param id Employee ID
   * @param employeeData Updated employee data
   * @returns Observable with updated employee
   */
  updateEmployee(id: string, employeeData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, employeeData);
  }
  
  /**
   * Delete an employee
   * @param id Employee ID
   * @returns Observable with deletion result
   */
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Get employee dashboard data
   * @param id Employee ID
   * @returns Observable with employee dashboard data
   */
  getEmployeeDashboard(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/dashboard`);
  }
  
  /**
   * Get employees by department
   * @param department Department name
   * @returns Observable with employees in the department
   */
  getEmployeesByDepartment(department: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/department/${department}`);
  }
  
  /**
   * Get employees by manager
   * @param managerId Manager ID
   * @returns Observable with employees under the manager
   */
  getEmployeesByManager(managerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/manager/${managerId}`);
  }
  
  /**
   * Get employees with contracts ending soon
   * @param days Days threshold
   * @returns Observable with employees with contracts ending soon
   */
  getEmployeesWithContractsEndingSoon(days: number = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/contracts-ending-soon`, {
      params: { days: days.toString() }
    });
  }
  
  /**
   * Search employees
   * @param term Search term
   * @returns Observable with matching employees
   */
  searchEmployees(term: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search`, {
      params: { term }
    });
  }
}
