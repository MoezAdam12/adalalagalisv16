import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all notification templates
   */
  getNotificationTemplates(params: any = {}): Observable<any> {
    return this.apiService.get('/notifications/templates', params);
  }

  /**
   * Get notification template by ID
   */
  getNotificationTemplateById(id: string): Observable<any> {
    return this.apiService.get(`/notifications/templates/${id}`);
  }

  /**
   * Create a new notification template
   */
  createNotificationTemplate(templateData: any): Observable<any> {
    return this.apiService.post('/notifications/templates', templateData);
  }

  /**
   * Update an existing notification template
   */
  updateNotificationTemplate(id: string, templateData: any): Observable<any> {
    return this.apiService.put(`/notifications/templates/${id}`, templateData);
  }

  /**
   * Delete a notification template
   */
  deleteNotificationTemplate(id: string): Observable<any> {
    return this.apiService.delete(`/notifications/templates/${id}`);
  }

  /**
   * Get user notifications
   */
  getUserNotifications(params: any = {}): Observable<any> {
    return this.apiService.get('/notifications/user', params);
  }

  /**
   * Create a notification
   */
  createNotification(notificationData: any): Observable<any> {
    return this.apiService.post('/notifications', notificationData);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(id: string): Observable<any> {
    return this.apiService.put(`/notifications/${id}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead(): Observable<any> {
    return this.apiService.put('/notifications/read-all', {});
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: string): Observable<any> {
    return this.apiService.delete(`/notifications/${id}`);
  }

  /**
   * Get user notification settings
   */
  getUserNotificationSettings(): Observable<any> {
    return this.apiService.get('/notifications/settings');
  }

  /**
   * Update user notification settings
   */
  updateUserNotificationSettings(settingsData: any): Observable<any> {
    return this.apiService.post('/notifications/settings', settingsData);
  }

  /**
   * Get email configuration
   */
  getEmailConfig(): Observable<any> {
    return this.apiService.get('/notifications/email-config');
  }

  /**
   * Update email configuration
   */
  updateEmailConfig(configData: any): Observable<any> {
    return this.apiService.post('/notifications/email-config', configData);
  }

  /**
   * Test email configuration
   */
  testEmailConfig(testData: any): Observable<any> {
    return this.apiService.post('/notifications/email-config/test', testData);
  }
}
