import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) { }

  getClients(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  getClientById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createClient(client: any): Observable<any> {
    return this.http.post(this.apiUrl, client);
  }

  updateClient(id: string, client: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Client Cases
  getClientCases(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${clientId}/cases`);
  }

  // Client Contracts
  getClientContracts(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${clientId}/contracts`);
  }

  // Client Documents
  getClientDocuments(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${clientId}/documents`);
  }

  uploadClientDocument(clientId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${clientId}/documents`, formData);
  }

  deleteClientDocument(clientId: string, documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${clientId}/documents/${documentId}`);
  }

  downloadClientDocument(clientId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${clientId}/documents/${documentId}/download`, { responseType: 'blob' });
  }

  // Client Statistics
  getClientStatistics(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${clientId}/statistics`);
  }
}
