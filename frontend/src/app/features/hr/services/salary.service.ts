import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private apiUrl = `${environment.apiUrl}/api/hr/salaries`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Create a new salary record
   * @param salaryData Salary record data
   * @returns Observable with created salary record
   */
  createSalary(salaryData: any): Observable<any> {
    return this.http.post(this.apiUrl, salaryData);
  }
  
  /**
   * Get salary records with optional filters
   * @param params Query parameters for filtering
   * @returns Observable with salary records
   */
  getSalaries(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return this.http.get(this.apiUrl, { params: httpParams });
  }
  
  /**
   * Get a single salary record by ID
   * @param id Salary record ID
   * @returns Observable with salary record
   */
  getSalary(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Update a salary record
   * @param id Salary record ID
   * @param salaryData Updated salary record data
   * @returns Observable with updated salary record
   */
  updateSalary(id: string, salaryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, salaryData);
  }
  
  /**
   * Delete a salary record
   * @param id Salary record ID
   * @returns Observable with deletion result
   */
  deleteSalary(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Get salary records by employee
   * @param employeeId Employee ID
   * @returns Observable with salary records for the employee
   */
  getSalariesByEmployee(employeeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee/${employeeId}`);
  }
  
  /**
   * Get salary records by month and year
   * @param month Month (1-12)
   * @param year Year
   * @returns Observable with salary records for the specified month and year
   */
  getSalariesByMonthYear(month: number, year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/month-year/${month}/${year}`);
  }
  
  /**
   * Get pending salary payments
   * @returns Observable with pending salary payments
   */
  getPendingSalaries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pending`);
  }
  
  /**
   * Generate monthly salaries for all active employees
   * @param month Month (1-12)
   * @param year Year
   * @returns Observable with generated salary records
   */
  generateMonthlySalaries(month: number, year: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-monthly`, { month, year });
  }
  
  /**
   * Process salary payments
   * @param salaryIds Array of salary record IDs to process
   * @param payment_date Payment date (optional)
   * @returns Observable with processing result
   */
  processSalaryPayments(salaryIds: string[], payment_date?: Date): Observable<any> {
    const payload: any = { salaryIds };
    
    if (payment_date) {
      payload.payment_date = payment_date;
    }
    
    return this.http.post(`${this.apiUrl}/process-payments`, payload);
  }
}
