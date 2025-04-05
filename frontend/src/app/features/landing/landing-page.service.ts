import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LandingPageService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Send contact form data to backend
   * @param formData Contact form data
   */
  submitContactForm(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/contact`, formData);
  }

  /**
   * Subscribe email to newsletter
   * @param email Email address
   */
  subscribeToNewsletter(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/newsletter/subscribe`, { email });
  }

  /**
   * Get pricing plans
   */
  getPricingPlans(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/plans`);
  }

  /**
   * Get testimonials
   */
  getTestimonials(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/testimonials`);
  }

  /**
   * Start free trial
   * @param userData User registration data
   */
  startFreeTrial(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register`, userData);
  }
}
