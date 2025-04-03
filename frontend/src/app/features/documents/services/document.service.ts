import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { 
  Document, 
  DocumentVersion, 
  DocumentCategory, 
  DocumentSearchParams,
  DocumentShareSettings,
  DocumentAnalysisResult
} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) { }

  // Get all documents
  getAllDocuments(params?: DocumentSearchParams): Observable<Document[]> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.query) httpParams = httpParams.set('query', params.query);
      if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom.toISOString());
      if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo.toISOString());
      if (params.createdBy) httpParams = httpParams.set('createdBy', params.createdBy);
      if (params.fileType) httpParams = httpParams.set('fileType', params.fileType);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);
      if (params.tags && params.tags.length > 0) {
        params.tags.forEach(tag => {
          httpParams = httpParams.append('tags', tag);
        });
      }
    }

    return this.http.get<Document[]>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get document by ID
  getDocumentById(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create new document with file upload
  createDocument(formData: FormData): Observable<Document> {
    return this.http.post<Document>(this.apiUrl, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update document metadata
  updateDocument(id: string, document: Partial<Document>): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}`, document)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update document file
  updateDocumentFile(id: string, formData: FormData): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}/file`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete document
  deleteDocument(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get document versions
  getDocumentVersions(id: string): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(`${this.apiUrl}/${id}/versions`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get specific document version
  getDocumentVersion(id: string, versionId: string): Observable<DocumentVersion> {
    return this.http.get<DocumentVersion>(`${this.apiUrl}/${id}/versions/${versionId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Download document
  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Share document (generate shareable link)
  shareDocument(id: string, settings: DocumentShareSettings): Observable<{ shareableLink: string }> {
    return this.http.post<{ shareableLink: string }>(`${this.apiUrl}/${id}/share`, settings)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get document categories
  getDocumentCategories(): Observable<DocumentCategory[]> {
    return this.http.get<DocumentCategory[]>(`${this.apiUrl}/categories`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create document category
  createDocumentCategory(category: Partial<DocumentCategory>): Observable<DocumentCategory> {
    return this.http.post<DocumentCategory>(`${this.apiUrl}/categories`, category)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Search documents
  searchDocuments(searchParams: DocumentSearchParams): Observable<Document[]> {
    let httpParams = new HttpParams();
    
    if (searchParams.query) httpParams = httpParams.set('query', searchParams.query);
    if (searchParams.categoryId) httpParams = httpParams.set('categoryId', searchParams.categoryId);
    if (searchParams.status) httpParams = httpParams.set('status', searchParams.status);
    if (searchParams.dateFrom) httpParams = httpParams.set('dateFrom', searchParams.dateFrom.toISOString());
    if (searchParams.dateTo) httpParams = httpParams.set('dateTo', searchParams.dateTo.toISOString());
    if (searchParams.page) httpParams = httpParams.set('page', searchParams.page.toString());
    if (searchParams.limit) httpParams = httpParams.set('limit', searchParams.limit.toString());
    if (searchParams.tags && searchParams.tags.length > 0) {
      searchParams.tags.forEach(tag => {
        httpParams = httpParams.append('tags', tag);
      });
    }

    return this.http.get<Document[]>(`${this.apiUrl}/search`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  // OCR document
  ocrDocument(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/ocr`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Analyze document using ML service
  analyzeDocument(id: string): Observable<DocumentAnalysisResult> {
    return this.http.post<DocumentAnalysisResult>(`${environment.apiUrl}/ml/analyze-document`, { documentId: id })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Error handling
  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
