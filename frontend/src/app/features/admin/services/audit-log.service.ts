import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  constructor(private apiService: ApiService) {}

  /**
   * Get audit logs with filtering and pagination
   */
  getAuditLogs(params: any = {}): Observable<any> {
    return this.apiService.get('/audit-logs', params);
  }

  /**
   * Get audit log by ID
   */
  getAuditLogById(id: string): Observable<any> {
    return this.apiService.get(`/audit-logs/${id}`);
  }

  /**
   * Get audit log statistics
   */
  getAuditLogStats(params: any = {}): Observable<any> {
    return this.apiService.get('/audit-logs/stats/summary', params);
  }

  /**
   * Create a manual audit log entry
   */
  createAuditLog(auditLogData: any): Observable<any> {
    return this.apiService.post('/audit-logs', auditLogData);
  }

  /**
   * Get available audit log actions
   */
  getAuditLogActions(): Observable<any> {
    return this.apiService.get('/audit-logs/options/actions');
  }

  /**
   * Get available audit log entity types
   */
  getAuditLogEntityTypes(): Observable<any> {
    return this.apiService.get('/audit-logs/options/entity-types');
  }

  /**
   * Get available audit log statuses
   */
  getAuditLogStatuses(): Observable<any> {
    return this.apiService.get('/audit-logs/options/statuses');
  }

  /**
   * Get available audit log severities
   */
  getAuditLogSeverities(): Observable<any> {
    return this.apiService.get('/audit-logs/options/severities');
  }

  /**
   * Get export URL for audit logs CSV
   */
  getExportUrl(params: any = {}): string {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return `${this.apiService.getApiBaseUrl()}/audit-logs/export/csv${queryString ? '?' + queryString : ''}`;
  }
}
