import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all users with pagination and filtering
   */
  getUsers(params: any = {}): Observable<any> {
    return this.apiService.get('/users', params);
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<any> {
    return this.apiService.get(`/users/${id}`);
  }

  /**
   * Create a new user
   */
  createUser(userData: any): Observable<any> {
    return this.apiService.post('/users', userData);
  }

  /**
   * Update an existing user
   */
  updateUser(id: string, userData: any): Observable<any> {
    return this.apiService.put(`/users/${id}`, userData);
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): Observable<any> {
    return this.apiService.delete(`/users/${id}`);
  }

  /**
   * Change user password
   */
  changePassword(id: string, password: string): Observable<any> {
    return this.apiService.put(`/users/${id}/password`, { password });
  }

  /**
   * Update user notification preferences
   */
  updateNotificationPreferences(id: string, preferences: any): Observable<any> {
    return this.apiService.put(`/users/${id}/notification-preferences`, preferences);
  }

  /**
   * Update user UI preferences
   */
  updateUIPreferences(id: string, preferences: any): Observable<any> {
    return this.apiService.put(`/users/${id}/ui-preferences`, preferences);
  }
}
