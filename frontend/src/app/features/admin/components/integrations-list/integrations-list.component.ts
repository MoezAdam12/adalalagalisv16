import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExternalIntegrationsService } from '../../services/external-integrations.service';

@Component({
  selector: 'app-integrations-list',
  templateUrl: './integrations-list.component.html',
  styleUrls: ['./integrations-list.component.scss']
})
export class IntegrationsListComponent implements OnInit {
  integrations: any[] = [];
  availableProviders: any = {};
  selectedType: string = '';
  loading = false;
  error = '';
  success = '';
  
  constructor(
    private externalIntegrationsService: ExternalIntegrationsService
  ) {}

  ngOnInit(): void {
    this.loadIntegrations();
    this.loadAvailableProviders();
  }

  loadIntegrations(): void {
    this.loading = true;
    this.error = '';
    
    this.externalIntegrationsService.getIntegrations().subscribe(
      (response) => {
        if (response && response.data) {
          this.integrations = response.data;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load integrations:', error);
        this.error = 'فشل في تحميل التكاملات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  loadAvailableProviders(): void {
    this.externalIntegrationsService.getAvailableProviders().subscribe(
      (response) => {
        if (response && response.data) {
          this.availableProviders = response.data;
        }
      },
      (error) => {
        console.error('Failed to load available providers:', error);
      }
    );
  }
  
  filterByType(type: string): void {
    this.selectedType = type;
    this.loading = true;
    this.error = '';
    
    this.externalIntegrationsService.getIntegrations(type).subscribe(
      (response) => {
        if (response && response.data) {
          this.integrations = response.data;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load integrations:', error);
        this.error = 'فشل في تحميل التكاملات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  testIntegration(integration: any): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.externalIntegrationsService.testIntegration(integration.id).subscribe(
      (response) => {
        if (response && response.success) {
          this.success = `تم اختبار التكامل بنجاح: ${response.message}`;
        } else {
          this.error = `فشل اختبار التكامل: ${response.message}`;
        }
        this.loading = false;
        this.loadIntegrations();
      },
      (error) => {
        console.error('Failed to test integration:', error);
        this.error = error.message || 'فشل في اختبار التكامل. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  syncIntegration(integration: any): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.externalIntegrationsService.syncIntegration(integration.id).subscribe(
      (response) => {
        if (response && response.success) {
          this.success = `تم مزامنة التكامل بنجاح: ${response.message}`;
        } else {
          this.error = `فشل مزامنة التكامل: ${response.message}`;
        }
        this.loading = false;
        this.loadIntegrations();
      },
      (error) => {
        console.error('Failed to sync integration:', error);
        this.error = error.message || 'فشل في مزامنة التكامل. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  deleteIntegration(integration: any): void {
    if (confirm(`هل أنت متأكد من رغبتك في حذف التكامل "${integration.name}"؟`)) {
      this.loading = true;
      this.error = '';
      this.success = '';
      
      this.externalIntegrationsService.deleteIntegration(integration.id).subscribe(
        (response) => {
          this.success = 'تم حذف التكامل بنجاح';
          this.loading = false;
          this.loadIntegrations();
        },
        (error) => {
          console.error('Failed to delete integration:', error);
          this.error = error.message || 'فشل في حذف التكامل. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  toggleIntegrationStatus(integration: any): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const updatedData = {
      is_enabled: !integration.is_enabled
    };
    
    this.externalIntegrationsService.updateIntegration(integration.id, updatedData).subscribe(
      (response) => {
        this.success = `تم ${response.data.is_enabled ? 'تفعيل' : 'تعطيل'} التكامل بنجاح`;
        this.loading = false;
        this.loadIntegrations();
      },
      (error) => {
        console.error('Failed to update integration status:', error);
        this.error = error.message || 'فشل في تحديث حالة التكامل. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  getIntegrationTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'storage': 'تخزين',
      'accounting': 'محاسبة',
      'payment': 'دفع',
      'sms': 'رسائل نصية',
      'email': 'بريد إلكتروني',
      'calendar': 'تقويم',
      'other': 'أخرى'
    };
    
    return typeLabels[type] || type;
  }
  
  getIntegrationStatusLabel(isEnabled: boolean): string {
    return isEnabled ? 'مفعل' : 'معطل';
  }
  
  getIntegrationStatusClass(isEnabled: boolean): string {
    return isEnabled ? 'bg-success' : 'bg-secondary';
  }
  
  getSyncStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'failed': 'فشل'
    };
    
    return statusLabels[status] || status;
  }
  
  getSyncStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-warning',
      'in_progress': 'bg-info',
      'completed': 'bg-success',
      'failed': 'bg-danger'
    };
    
    return statusClasses[status] || 'bg-secondary';
  }
}
