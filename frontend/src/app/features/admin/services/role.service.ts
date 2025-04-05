import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all roles
   */
  getRoles(params: any = {}): Observable<any> {
    return this.apiService.get('/rbac/roles', params);
  }

  /**
   * Get role by ID
   */
  getRoleById(id: string): Observable<any> {
    return this.apiService.get(`/rbac/roles/${id}`);
  }

  /**
   * Create a new role
   */
  createRole(roleData: any): Observable<any> {
    return this.apiService.post('/rbac/roles', roleData);
  }

  /**
   * Update an existing role
   */
  updateRole(id: string, roleData: any): Observable<any> {
    return this.apiService.put(`/rbac/roles/${id}`, roleData);
  }

  /**
   * Delete a role
   */
  deleteRole(id: string): Observable<any> {
    return this.apiService.delete(`/rbac/roles/${id}`);
  }

  /**
   * Get all permissions
   */
  getPermissions(): Observable<any> {
    return this.apiService.get('/rbac/permissions');
  }
}
