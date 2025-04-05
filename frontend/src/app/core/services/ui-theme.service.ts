import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class UIThemeService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all UI themes
   */
  getUIThemes(): Observable<any> {
    return this.apiService.get('/ui-themes');
  }

  /**
   * Get UI theme by ID
   */
  getUIThemeById(id: string): Observable<any> {
    return this.apiService.get(`/ui-themes/${id}`);
  }

  /**
   * Get active UI theme
   */
  getActiveUITheme(): Observable<any> {
    return this.apiService.get('/ui-themes/active');
  }

  /**
   * Create a new UI theme
   */
  createUITheme(themeData: any): Observable<any> {
    return this.apiService.post('/ui-themes', themeData);
  }

  /**
   * Update an existing UI theme
   */
  updateUITheme(id: string, themeData: any): Observable<any> {
    return this.apiService.put(`/ui-themes/${id}`, themeData);
  }

  /**
   * Delete a UI theme
   */
  deleteUITheme(id: string): Observable<any> {
    return this.apiService.delete(`/ui-themes/${id}`);
  }

  /**
   * Set UI theme as active
   */
  setActiveUITheme(id: string): Observable<any> {
    return this.apiService.put(`/ui-themes/${id}/activate`, {});
  }

  /**
   * Upload logo for UI theme
   */
  uploadLogo(id: string, type: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.apiService.postFormData(`/ui-themes/${id}/upload/${type}`, formData);
  }

  /**
   * Generate CSS for UI theme
   */
  generateCSS(id: string): Observable<any> {
    return this.apiService.get(`/ui-themes/${id}/css`);
  }

  /**
   * Create default UI theme
   */
  createDefaultUITheme(): Observable<any> {
    return this.apiService.post('/ui-themes/default', {});
  }

  /**
   * Apply theme to application
   */
  applyTheme(theme: any): void {
    // Create a style element
    let styleElement = document.getElementById('app-theme');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'app-theme';
      document.head.appendChild(styleElement);
    }
    
    // Generate CSS variables
    const css = `
      :root {
        --primary-color: ${theme.primary_color};
        --secondary-color: ${theme.secondary_color};
        --text-color: ${theme.text_color};
        --text-light-color: ${theme.text_light_color};
        --background-color: ${theme.background_color};
        --background-light-color: ${theme.background_light_color};
        --sidebar-color: ${theme.sidebar_color || '#ffffff'};
        --header-color: ${theme.header_color || '#ffffff'};
        --button-border-radius: ${theme.button_border_radius || '4px'};
        --font-family: ${theme.font_family || 'Roboto, "Helvetica Neue", sans-serif'};
        --font-size-base: ${theme.font_size_base || '14px'};
      }
      
      body {
        font-family: var(--font-family);
        font-size: var(--font-size-base);
        color: var(--text-color);
        background-color: var(--background-light-color);
      }
      
      .btn-primary {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        border-radius: var(--button-border-radius);
      }
      
      .btn-secondary {
        background-color: var(--secondary-color);
        border-color: var(--secondary-color);
        border-radius: var(--button-border-radius);
      }
      
      .app-header {
        background-color: var(--header-color);
      }
      
      .app-sidebar {
        background-color: var(--sidebar-color);
      }
      
      .card {
        background-color: var(--background-color);
        color: var(--text-color);
      }
      
      /* Custom CSS */
      ${theme.custom_css || ''}
    `;
    
    // Set the CSS content
    styleElement.textContent = css;
    
    // Update favicon if available
    if (theme.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = theme.favicon_url;
      }
    }
  }
}
