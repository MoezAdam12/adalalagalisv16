import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { 
  Consultation, 
  ConsultationNote, 
  ConsultationAttachment, 
  ConsultationFeedback, 
  ConsultationCategory,
  ConsultationFilter,
  ConsultationStats
} from '../models/consultation.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) { }

  // Consultation CRUD operations
  getAllConsultations(filter?: ConsultationFilter): Observable<Consultation[]> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.clientId) params = params.set('clientId', filter.clientId);
      if (filter.attorneyId) params = params.set('attorneyId', filter.attorneyId);
      if (filter.type) params = params.set('type', filter.type);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.mode) params = params.set('mode', filter.mode);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.startDate) params = params.set('startDate', new Date(filter.startDate).toISOString());
      if (filter.endDate) params = params.set('endDate', new Date(filter.endDate).toISOString());
      if (filter.isPaid !== undefined) params = params.set('isPaid', filter.isPaid.toString());
      if (filter.followUpRequired !== undefined) params = params.set('followUpRequired', filter.followUpRequired.toString());
      if (filter.relatedCaseId) params = params.set('relatedCaseId', filter.relatedCaseId);
      if (filter.tags && filter.tags.length > 0) params = params.set('tags', filter.tags.join(','));
      if (filter.searchText) params = params.set('searchText', filter.searchText);
      if (filter.page !== undefined) params = params.set('page', filter.page.toString());
      if (filter.limit !== undefined) params = params.set('limit', filter.limit.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);
    }
    
    return this.http.get<Consultation[]>(this.apiUrl, { params })
      .pipe(
        catchError(this.handleError<Consultation[]>('getAllConsultations', []))
      );
  }

  getConsultationById(id: string): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<Consultation>('getConsultationById'))
      );
  }

  createConsultation(consultation: Partial<Consultation>): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, consultation)
      .pipe(
        catchError(this.handleError<Consultation>('createConsultation'))
      );
  }

  updateConsultation(id: string, consultation: Partial<Consultation>): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.apiUrl}/${id}`, consultation)
      .pipe(
        catchError(this.handleError<Consultation>('updateConsultation'))
      );
  }

  deleteConsultation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<any>('deleteConsultation'))
      );
  }

  // Consultation status operations
  updateConsultationStatus(id: string, status: string): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(
        catchError(this.handleError<Consultation>('updateConsultationStatus'))
      );
  }

  startConsultation(id: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/start`, {})
      .pipe(
        catchError(this.handleError<Consultation>('startConsultation'))
      );
  }

  completeConsultation(id: string, summary?: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/complete`, { summary })
      .pipe(
        catchError(this.handleError<Consultation>('completeConsultation'))
      );
  }

  cancelConsultation(id: string, reason?: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/cancel`, { reason })
      .pipe(
        catchError(this.handleError<Consultation>('cancelConsultation'))
      );
  }

  rescheduleConsultation(id: string, newDate: Date, reason?: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/reschedule`, { 
      scheduledDate: newDate.toISOString(),
      reason
    })
      .pipe(
        catchError(this.handleError<Consultation>('rescheduleConsultation'))
      );
  }

  // Consultation notes operations
  getConsultationNotes(consultationId: string): Observable<ConsultationNote[]> {
    return this.http.get<ConsultationNote[]>(`${this.apiUrl}/${consultationId}/notes`)
      .pipe(
        catchError(this.handleError<ConsultationNote[]>('getConsultationNotes', []))
      );
  }

  addConsultationNote(consultationId: string, note: Partial<ConsultationNote>): Observable<ConsultationNote> {
    return this.http.post<ConsultationNote>(`${this.apiUrl}/${consultationId}/notes`, note)
      .pipe(
        catchError(this.handleError<ConsultationNote>('addConsultationNote'))
      );
  }

  updateConsultationNote(consultationId: string, noteId: string, note: Partial<ConsultationNote>): Observable<ConsultationNote> {
    return this.http.put<ConsultationNote>(`${this.apiUrl}/${consultationId}/notes/${noteId}`, note)
      .pipe(
        catchError(this.handleError<ConsultationNote>('updateConsultationNote'))
      );
  }

  deleteConsultationNote(consultationId: string, noteId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${consultationId}/notes/${noteId}`)
      .pipe(
        catchError(this.handleError<any>('deleteConsultationNote'))
      );
  }

  // Consultation attachments operations
  getConsultationAttachments(consultationId: string): Observable<ConsultationAttachment[]> {
    return this.http.get<ConsultationAttachment[]>(`${this.apiUrl}/${consultationId}/attachments`)
      .pipe(
        catchError(this.handleError<ConsultationAttachment[]>('getConsultationAttachments', []))
      );
  }

  uploadAttachment(consultationId: string, file: File, description?: string, isPrivate: boolean = false): Observable<ConsultationAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    formData.append('isPrivate', isPrivate.toString());
    
    return this.http.post<ConsultationAttachment>(`${this.apiUrl}/${consultationId}/attachments`, formData)
      .pipe(
        catchError(this.handleError<ConsultationAttachment>('uploadAttachment'))
      );
  }

  downloadAttachment(consultationId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${consultationId}/attachments/${attachmentId}/download`, { responseType: 'blob' })
      .pipe(
        catchError(this.handleError<Blob>('downloadAttachment'))
      );
  }

  deleteAttachment(consultationId: string, attachmentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${consultationId}/attachments/${attachmentId}`)
      .pipe(
        catchError(this.handleError<any>('deleteAttachment'))
      );
  }

  // Consultation feedback operations
  getConsultationFeedback(consultationId: string): Observable<ConsultationFeedback[]> {
    return this.http.get<ConsultationFeedback[]>(`${this.apiUrl}/${consultationId}/feedback`)
      .pipe(
        catchError(this.handleError<ConsultationFeedback[]>('getConsultationFeedback', []))
      );
  }

  submitFeedback(consultationId: string, feedback: Partial<ConsultationFeedback>): Observable<ConsultationFeedback> {
    return this.http.post<ConsultationFeedback>(`${this.apiUrl}/${consultationId}/feedback`, feedback)
      .pipe(
        catchError(this.handleError<ConsultationFeedback>('submitFeedback'))
      );
  }

  // Consultation categories operations
  getConsultationCategories(): Observable<ConsultationCategory[]> {
    return this.http.get<ConsultationCategory[]>(`${this.apiUrl}/categories`)
      .pipe(
        catchError(this.handleError<ConsultationCategory[]>('getConsultationCategories', []))
      );
  }

  // Consultation statistics
  getConsultationStats(startDate?: Date, endDate?: Date, attorneyId?: string): Observable<ConsultationStats> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate.toISOString());
    if (endDate) params = params.set('endDate', endDate.toISOString());
    if (attorneyId) params = params.set('attorneyId', attorneyId);
    
    return this.http.get<ConsultationStats>(`${this.apiUrl}/stats`, { params })
      .pipe(
        catchError(this.handleError<ConsultationStats>('getConsultationStats'))
      );
  }

  // Error handling
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}
