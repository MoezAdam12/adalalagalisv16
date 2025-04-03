import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
  private apiUrl = `${environment.apiUrl}/contracts`;

  constructor(private http: HttpClient) { }

  getContracts(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  getContractById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createContract(contract: any): Observable<any> {
    return this.http.post(this.apiUrl, contract);
  }

  updateContract(id: string, contract: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, contract);
  }

  deleteContract(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getContractTemplates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates`);
  }

  getContractTemplate(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates/${id}`);
  }

  createContractTemplate(template: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/templates`, template);
  }

  updateContractTemplate(id: string, template: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/templates/${id}`, template);
  }

  deleteContractTemplate(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/templates/${id}`);
  }

  getContractPayments(contractId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${contractId}/payments`);
  }

  addContractPayment(contractId: string, payment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${contractId}/payments`, payment);
  }

  updateContractPayment(contractId: string, paymentId: string, payment: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${contractId}/payments/${paymentId}`, payment);
  }

  deleteContractPayment(contractId: string, paymentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${contractId}/payments/${paymentId}`);
  }

  generateContractPdf(contractId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${contractId}/pdf`, { responseType: 'blob' });
  }

  getContractVersions(contractId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${contractId}/versions`);
  }

  getContractVersion(contractId: string, versionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${contractId}/versions/${versionId}`);
  }
}
