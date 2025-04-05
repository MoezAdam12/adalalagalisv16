import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskComment, 
  TaskAttachment,
  TaskCategory,
  TaskSearchParams,
  TaskAssignment,
  TaskStatistics,
  TaskTemplate,
  TaskWorkflow
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) { }

  // Get all tasks
  getAllTasks(params?: TaskSearchParams): Observable<Task[]> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.query) httpParams = httpParams.set('query', params.query);
      if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
      if (params.assignedTo) httpParams = httpParams.set('assignedTo', params.assignedTo);
      if (params.createdBy) httpParams = httpParams.set('createdBy', params.createdBy);
      if (params.dueDateFrom) httpParams = httpParams.set('dueDateFrom', params.dueDateFrom.toISOString());
      if (params.dueDateTo) httpParams = httpParams.set('dueDateTo', params.dueDateTo.toISOString());
      if (params.createdDateFrom) httpParams = httpParams.set('createdDateFrom', params.createdDateFrom.toISOString());
      if (params.createdDateTo) httpParams = httpParams.set('createdDateTo', params.createdDateTo.toISOString());
      if (params.hasAttachments !== undefined) httpParams = httpParams.set('hasAttachments', params.hasAttachments.toString());
      if (params.hasRelatedDocuments !== undefined) httpParams = httpParams.set('hasRelatedDocuments', params.hasRelatedDocuments.toString());
      if (params.hasRelatedConsultations !== undefined) httpParams = httpParams.set('hasRelatedConsultations', params.hasRelatedConsultations.toString());
      if (params.isOverdue !== undefined) httpParams = httpParams.set('isOverdue', params.isOverdue.toString());
      if (params.isCompleted !== undefined) httpParams = httpParams.set('isCompleted', params.isCompleted.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);
      
      // Handle arrays
      if (params.status && Array.isArray(params.status)) {
        params.status.forEach(status => {
          httpParams = httpParams.append('status', status);
        });
      } else if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      
      if (params.priority && Array.isArray(params.priority)) {
        params.priority.forEach(priority => {
          httpParams = httpParams.append('priority', priority);
        });
      } else if (params.priority) {
        httpParams = httpParams.set('priority', params.priority);
      }
      
      if (params.tags && params.tags.length > 0) {
        params.tags.forEach(tag => {
          httpParams = httpParams.append('tags', tag);
        });
      }
    }

    return this.http.get<Task[]>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get task by ID
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create new task
  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update task
  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete task
  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update task status
  updateTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Assign task
  assignTask(assignment: TaskAssignment): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${assignment.taskId}/assign`, assignment)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Add comment to task
  addComment(taskId: string, comment: Partial<TaskComment>): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/${taskId}/comments`, comment)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get task comments
  getTaskComments(taskId: string): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/${taskId}/comments`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Add attachment to task
  addAttachment(taskId: string, formData: FormData): Observable<TaskAttachment> {
    return this.http.post<TaskAttachment>(`${this.apiUrl}/${taskId}/attachments`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get task attachments
  getTaskAttachments(taskId: string): Observable<TaskAttachment[]> {
    return this.http.get<TaskAttachment[]>(`${this.apiUrl}/${taskId}/attachments`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Download attachment
  downloadAttachment(taskId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${taskId}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get task categories
  getTaskCategories(): Observable<TaskCategory[]> {
    return this.http.get<TaskCategory[]>(`${this.apiUrl}/categories`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create task category
  createTaskCategory(category: Partial<TaskCategory>): Observable<TaskCategory> {
    return this.http.post<TaskCategory>(`${this.apiUrl}/categories`, category)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get task statistics
  getTaskStatistics(userId?: string, dateFrom?: Date, dateTo?: Date): Observable<TaskStatistics> {
    let httpParams = new HttpParams();
    
    if (userId) httpParams = httpParams.set('userId', userId);
    if (dateFrom) httpParams = httpParams.set('dateFrom', dateFrom.toISOString());
    if (dateTo) httpParams = httpParams.set('dateTo', dateTo.toISOString());

    return this.http.get<TaskStatistics>(`${this.apiUrl}/statistics`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get task templates
  getTaskTemplates(): Observable<TaskTemplate[]> {
    return this.http.get<TaskTemplate[]>(`${this.apiUrl}/templates`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create task from template
  createTaskFromTemplate(templateId: string, customData?: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/templates/${templateId}/create`, customData || {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get task workflows
  getTaskWorkflows(): Observable<TaskWorkflow[]> {
    return this.http.get<TaskWorkflow[]>(`${this.apiUrl}/workflows`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Move task to workflow stage
  moveTaskToStage(taskId: string, stageId: string, comment?: string): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${taskId}/workflow/move`, { stageId, comment })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Search tasks
  searchTasks(searchParams: TaskSearchParams): Observable<Task[]> {
    let httpParams = new HttpParams();
    
    if (searchParams.query) httpParams = httpParams.set('query', searchParams.query);
    if (searchParams.categoryId) httpParams = httpParams.set('categoryId', searchParams.categoryId);
    if (searchParams.assignedTo) httpParams = httpParams.set('assignedTo', searchParams.assignedTo);
    if (searchParams.page) httpParams = httpParams.set('page', searchParams.page.toString());
    if (searchParams.limit) httpParams = httpParams.set('limit', searchParams.limit.toString());
    
    // Handle arrays
    if (searchParams.status && Array.isArray(searchParams.status)) {
      searchParams.status.forEach(status => {
        httpParams = httpParams.append('status', status);
      });
    } else if (searchParams.status) {
      httpParams = httpParams.set('status', searchParams.status);
    }
    
    if (searchParams.priority && Array.isArray(searchParams.priority)) {
      searchParams.priority.forEach(priority => {
        httpParams = httpParams.append('priority', priority);
      });
    } else if (searchParams.priority) {
      httpParams = httpParams.set('priority', searchParams.priority);
    }

    return this.http.get<Task[]>(`${this.apiUrl}/search`, { params: httpParams })
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
