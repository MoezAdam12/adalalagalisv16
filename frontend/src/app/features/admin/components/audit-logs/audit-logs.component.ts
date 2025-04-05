import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuditLogService } from '../../services/audit-log.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  providers: [DatePipe]
})
export class AuditLogsComponent implements OnInit {
  auditLogs: any[] = [];
  filterForm: FormGroup;
  loading = false;
  error = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  
  // Options for filters
  actionOptions: any[] = [];
  entityTypeOptions: any[] = [];
  statusOptions: any[] = [];
  severityOptions: any[] = [];
  
  // Statistics
  stats: any = null;
  showStats = false;
  
  constructor(
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.filterForm = this.fb.group({
      start_date: [''],
      end_date: [''],
      user_id: [''],
      action: [''],
      entity_type: [''],
      entity_id: [''],
      status: [''],
      severity: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadAuditLogs();
  }
  
  loadFilterOptions(): void {
    // Load actions
    this.auditLogService.getAuditLogActions().subscribe(
      (response) => {
        if (response && response.data) {
          this.actionOptions = response.data;
        }
      },
      (error) => {
        console.error('Failed to load audit log actions:', error);
      }
    );
    
    // Load entity types
    this.auditLogService.getAuditLogEntityTypes().subscribe(
      (response) => {
        if (response && response.data) {
          this.entityTypeOptions = response.data;
        }
      },
      (error) => {
        console.error('Failed to load audit log entity types:', error);
      }
    );
    
    // Load statuses
    this.auditLogService.getAuditLogStatuses().subscribe(
      (response) => {
        if (response && response.data) {
          this.statusOptions = response.data;
        }
      },
      (error) => {
        console.error('Failed to load audit log statuses:', error);
      }
    );
    
    // Load severities
    this.auditLogService.getAuditLogSeverities().subscribe(
      (response) => {
        if (response && response.data) {
          this.severityOptions = response.data;
        }
      },
      (error) => {
        console.error('Failed to load audit log severities:', error);
      }
    );
  }
  
  loadAuditLogs(): void {
    this.loading = true;
    this.error = '';
    
    const params = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Format dates if present
    if (params.start_date) {
      params.start_date = this.formatDate(params.start_date);
    }
    
    if (params.end_date) {
      params.end_date = this.formatDate(params.end_date);
    }
    
    this.auditLogService.getAuditLogs(params).subscribe(
      (response) => {
        if (response && response.data) {
          this.auditLogs = response.data;
          
          if (response.pagination) {
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.total_pages;
          }
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load audit logs:', error);
        this.error = 'فشل في تحميل سجلات التدقيق. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  loadAuditLogStats(): void {
    this.loading = true;
    this.error = '';
    
    const params = {
      ...this.filterForm.value
    };
    
    // Format dates if present
    if (params.start_date) {
      params.start_date = this.formatDate(params.start_date);
    }
    
    if (params.end_date) {
      params.end_date = this.formatDate(params.end_date);
    }
    
    this.auditLogService.getAuditLogStats(params).subscribe(
      (response) => {
        if (response && response.data) {
          this.stats = response.data;
          this.showStats = true;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load audit log statistics:', error);
        this.error = 'فشل في تحميل إحصائيات سجلات التدقيق. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  onFilter(): void {
    this.currentPage = 1;
    this.loadAuditLogs();
  }
  
  resetFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadAuditLogs();
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAuditLogs();
  }
  
  exportToCsv(): void {
    const params = {
      ...this.filterForm.value
    };
    
    // Format dates if present
    if (params.start_date) {
      params.start_date = this.formatDate(params.start_date);
    }
    
    if (params.end_date) {
      params.end_date = this.formatDate(params.end_date);
    }
    
    const exportUrl = this.auditLogService.getExportUrl(params);
    window.open(exportUrl, '_blank');
  }
  
  toggleStats(): void {
    if (!this.showStats) {
      this.loadAuditLogStats();
    } else {
      this.showStats = false;
    }
  }
  
  formatDate(date: any): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
      return date;
    }
    
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  
  getActionLabel(action: string): string {
    const found = this.actionOptions.find(opt => opt.value === action);
    return found ? found.label : action;
  }
  
  getStatusLabel(status: string): string {
    const found = this.statusOptions.find(opt => opt.value === status);
    return found ? found.label : status;
  }
  
  getSeverityLabel(severity: string): string {
    const found = this.severityOptions.find(opt => opt.value === severity);
    return found ? found.label : severity;
  }
  
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'SUCCESS': 'bg-success',
      'FAILURE': 'bg-danger',
      'WARNING': 'bg-warning',
      'INFO': 'bg-info'
    };
    
    return statusClasses[status] || 'bg-secondary';
  }
  
  getSeverityClass(severity: string): string {
    const severityClasses: { [key: string]: string } = {
      'LOW': 'bg-info',
      'MEDIUM': 'bg-warning',
      'HIGH': 'bg-danger',
      'CRITICAL': 'bg-dark'
    };
    
    return severityClasses[severity] || 'bg-secondary';
  }
}
