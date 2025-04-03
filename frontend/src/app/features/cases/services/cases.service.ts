import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CasesService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) { }

  getCases(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  getCaseById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createCase(caseData: any): Observable<any> {
    return this.http.post(this.apiUrl, caseData);
  }

  updateCase(id: string, caseData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, caseData);
  }

  deleteCase(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Case Sessions
  getCaseSessions(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${caseId}/sessions`);
  }

  getCaseSession(caseId: string, sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${caseId}/sessions/${sessionId}`);
  }

  createCaseSession(caseId: string, session: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${caseId}/sessions`, session);
  }

  updateCaseSession(caseId: string, sessionId: string, session: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${caseId}/sessions/${sessionId}`, session);
  }

  deleteCaseSession(caseId: string, sessionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${caseId}/sessions/${sessionId}`);
  }

  // Case Documents
  getCaseDocuments(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${caseId}/documents`);
  }

  getCaseDocument(caseId: string, documentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${caseId}/documents/${documentId}`);
  }

  uploadCaseDocument(caseId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${caseId}/documents`, formData);
  }

  updateCaseDocument(caseId: string, documentId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${caseId}/documents/${documentId}`, formData);
  }

  deleteCaseDocument(caseId: string, documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${caseId}/documents/${documentId}`);
  }

  downloadCaseDocument(caseId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${caseId}/documents/${documentId}/download`, { responseType: 'blob' });
  }

  // Case Statistics
  getCaseStatistics(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${caseId}/statistics`);
  }
}
