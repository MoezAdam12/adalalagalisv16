import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ExternalIntegrationsService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all integrations
   */
  getIntegrations(type?: string, provider?: string): Observable<any> {
    const params: any = {};
    if (type) {
      params.type = type;
    }
    if (provider) {
      params.provider = provider;
    }
    return this.apiService.get('/external-integrations', params);
  }

  /**
   * Get integration by ID
   */
  getIntegrationById(id: string): Observable<any> {
    return this.apiService.get(`/external-integrations/${id}`);
  }

  /**
   * Create new integration
   */
  createIntegration(integrationData: any): Observable<any> {
    return this.apiService.post('/external-integrations', integrationData);
  }

  /**
   * Update integration
   */
  updateIntegration(id: string, integrationData: any): Observable<any> {
    return this.apiService.put(`/external-integrations/${id}`, integrationData);
  }

  /**
   * Delete integration
   */
  deleteIntegration(id: string): Observable<any> {
    return this.apiService.delete(`/external-integrations/${id}`);
  }

  /**
   * Test integration connection
   */
  testIntegration(id: string): Observable<any> {
    return this.apiService.post(`/external-integrations/${id}/test`, {});
  }

  /**
   * Sync integration data
   */
  syncIntegration(id: string): Observable<any> {
    return this.apiService.post(`/external-integrations/${id}/sync`, {});
  }

  /**
   * Get available integration providers
   */
  getAvailableProviders(): Observable<any> {
    return this.apiService.get('/external-integrations/providers/available');
  }

  /**
   * Get OAuth authorization URL
   */
  getOAuthUrl(type: string, provider: string): Observable<any> {
    return this.apiService.get('/external-integrations/oauth/url', { type, provider });
  }

  /**
   * Handle OAuth callback
   */
  handleOAuthCallback(code: string, state: string, type: string, provider: string): Observable<any> {
    return this.apiService.post('/external-integrations/oauth/callback', { code, state, type, provider });
  }
}
