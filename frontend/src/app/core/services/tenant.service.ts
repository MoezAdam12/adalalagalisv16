import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) { }

  /**
   * Get tenant information by subdomain
   * @param subdomain The tenant's subdomain
   */
  getTenantBySubdomain(subdomain: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-subdomain/${subdomain}`);
  }

  /**
   * Get current tenant settings
   */
  getCurrentTenantSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings/current`);
  }

  /**
   * Update current tenant settings
   * @param settings The settings to update
   */
  updateCurrentTenantSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/current`, settings);
  }

  /**
   * Get all tenants (super admin only)
   */
  getAllTenants(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  /**
   * Create a new tenant (super admin only)
   * @param tenant The tenant data
   */
  createTenant(tenant: any): Observable<any> {
    return this.http.post(this.apiUrl, tenant);
  }

  /**
   * Update a tenant (super admin only)
   * @param id The tenant ID
   * @param tenant The tenant data
   */
  updateTenant(id: string, tenant: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, tenant);
  }

  /**
   * Delete a tenant (super admin only)
   * @param id The tenant ID
   */
  deleteTenant(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Extract tenant information from hostname
   * @param hostname The hostname to extract from
   */
  extractTenantFromHostname(hostname: string): string | null {
    if (!hostname) return null;
    
    // Remove port if present
    const host = hostname.split(':')[0];
    
    // Split by dots
    const parts = host.split('.');
    
    // If it's localhost or IP address, return null
    if (parts.length <= 1 || parts[0] === 'localhost' || !isNaN(Number(parts[0]))) {
      return null;
    }
    
    // If it's a subdomain like api.example.com or www.example.com, ignore
    if (parts[0] === 'api' || parts[0] === 'www') {
      return null;
    }
    
    // Return the subdomain
    return parts[0];
  }
}
