import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class EmailTemplateService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all email templates
   */
  getEmailTemplates(params: any = {}): Observable<any> {
    return this.apiService.get('/email-templates', params);
  }

  /**
   * Get email template by ID
   */
  getEmailTemplateById(id: string): Observable<any> {
    return this.apiService.get(`/email-templates/${id}`);
  }

  /**
   * Create new email template
   */
  createEmailTemplate(templateData: any): Observable<any> {
    return this.apiService.post('/email-templates', templateData);
  }

  /**
   * Update email template
   */
  updateEmailTemplate(id: string, templateData: any): Observable<any> {
    return this.apiService.put(`/email-templates/${id}`, templateData);
  }

  /**
   * Delete email template
   */
  deleteEmailTemplate(id: string): Observable<any> {
    return this.apiService.delete(`/email-templates/${id}`);
  }

  /**
   * Set template as default
   */
  setDefaultTemplate(id: string): Observable<any> {
    return this.apiService.post(`/email-templates/${id}/set-default`, {});
  }

  /**
   * Preview email template with test data
   */
  previewEmailTemplate(id: string, testData: any = {}): Observable<any> {
    return this.apiService.post(`/email-templates/${id}/preview`, { test_data: testData });
  }

  /**
   * Get available email template categories
   */
  getEmailTemplateCategories(): Observable<any> {
    return this.apiService.get('/email-templates/options/categories');
  }

  /**
   * Get system email templates
   */
  getSystemEmailTemplates(): Observable<any> {
    return this.apiService.get('/email-templates/system/templates');
  }

  /**
   * Import system email template
   */
  importSystemTemplate(code: string): Observable<any> {
    return this.apiService.post('/email-templates/system/import', { code });
  }
}
