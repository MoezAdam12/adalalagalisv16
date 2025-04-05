import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all languages
   */
  getLanguages(params: any = {}): Observable<any> {
    return this.apiService.get('/languages', params);
  }

  /**
   * Get language by ID
   */
  getLanguageById(id: string): Observable<any> {
    return this.apiService.get(`/languages/${id}`);
  }

  /**
   * Create new language
   */
  createLanguage(languageData: any): Observable<any> {
    return this.apiService.post('/languages', languageData);
  }

  /**
   * Update language
   */
  updateLanguage(id: string, languageData: any): Observable<any> {
    return this.apiService.put(`/languages/${id}`, languageData);
  }

  /**
   * Delete language
   */
  deleteLanguage(id: string): Observable<any> {
    return this.apiService.delete(`/languages/${id}`);
  }

  /**
   * Set language as default
   */
  setDefaultLanguage(id: string): Observable<any> {
    return this.apiService.post(`/languages/${id}/set-default`, {});
  }

  /**
   * Get available language text directions
   */
  getLanguageTextDirections(): Observable<any> {
    return this.apiService.get('/languages/options/text-directions');
  }

  /**
   * Get common languages
   */
  getCommonLanguages(): Observable<any> {
    return this.apiService.get('/languages/common/languages');
  }

  /**
   * Import common language
   */
  importCommonLanguage(code: string): Observable<any> {
    return this.apiService.post('/languages/common/import', { code });
  }

  /**
   * Update language sort order
   */
  updateLanguageSortOrder(languages: any[]): Observable<any> {
    return this.apiService.post('/languages/sort-order', { languages });
  }
}
