// frontend/src/app/features/financial/services/journal-entry.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JournalEntryService {
  private apiUrl = `${environment.apiUrl}/api/financial/journal-entries`;

  constructor(private http: HttpClient) { }

  /**
   * Get all journal entries
   * @param params - Query parameters for filtering
   */
  getJournalEntries(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  /**
   * Get journal entry by ID
   * @param id - Journal entry ID
   */
  getJournalEntry(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new journal entry
   * @param entryData - Journal entry data
   */
  createJournalEntry(entryData: any): Observable<any> {
    return this.http.post(this.apiUrl, entryData);
  }

  /**
   * Update journal entry
   * @param id - Journal entry ID
   * @param entryData - Updated journal entry data
   */
  updateJournalEntry(id: string, entryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, entryData);
  }

  /**
   * Delete journal entry
   * @param id - Journal entry ID
   */
  deleteJournalEntry(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Post journal entry
   * @param id - Journal entry ID
   */
  postJournalEntry(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/post`, {});
  }

  /**
   * Void journal entry
   * @param id - Journal entry ID
   * @param reason - Void reason
   */
  voidJournalEntry(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/void`, { reason });
  }
}
