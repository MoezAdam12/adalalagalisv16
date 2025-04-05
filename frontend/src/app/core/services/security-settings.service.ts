import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SecuritySettingsService {
  constructor(private apiService: ApiService) {}

  /**
   * Get security settings
   */
  getSecuritySettings(): Observable<any> {
    return this.apiService.get('/security-settings');
  }

  /**
   * Update security settings
   */
  updateSecuritySettings(settingsData: any): Observable<any> {
    return this.apiService.put('/security-settings', settingsData);
  }

  /**
   * Reset security settings to defaults
   */
  resetSecuritySettings(): Observable<any> {
    return this.apiService.post('/security-settings/reset', {});
  }

  /**
   * Test password against policy
   */
  testPasswordPolicy(password: string): Observable<any> {
    return this.apiService.post('/security-settings/test-password', { password });
  }

  /**
   * Get active user sessions
   */
  getActiveSessions(userId?: string): Observable<any> {
    const params: any = {};
    if (userId) {
      params.user_id = userId;
    }
    return this.apiService.get('/security-settings/sessions', params);
  }

  /**
   * Terminate user session
   */
  terminateSession(sessionId: string): Observable<any> {
    return this.apiService.delete(`/security-settings/sessions/${sessionId}`);
  }

  /**
   * Terminate all user sessions
   */
  terminateAllSessions(userId?: string): Observable<any> {
    const params: any = {};
    if (userId) {
      params.user_id = userId;
    }
    return this.apiService.delete('/security-settings/sessions', params);
  }

  /**
   * Update IP whitelist
   */
  updateIPWhitelist(data: { ip_whitelist: string[], ip_whitelist_enabled: boolean }): Observable<any> {
    return this.apiService.put('/security-settings/ip-whitelist', data);
  }
}
