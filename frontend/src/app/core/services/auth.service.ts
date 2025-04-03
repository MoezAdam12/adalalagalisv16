import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient, private router: Router) {
    // Load user from local storage on service initialization
    this.loadUserFromStorage();
  }
  
  /**
   * Load user from local storage
   */
  private loadUserFromStorage() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }
  
  /**
   * Get current user value
   */
  public get currentUserValue() {
    return this.currentUserSubject.value;
  }
  
  /**
   * Login user
   * @param email User email
   * @param password User password
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          // Store user details and token in local storage
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Register new user
   * @param userData User registration data
   */
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }
  
  /**
   * Logout user
   */
  logout() {
    // Remove user from local storage
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    
    // Redirect to login page
    this.router.navigate(['/login']);
  }
  
  /**
   * Refresh token
   */
  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {
      refreshToken: this.currentUserValue?.refreshToken
    }).pipe(
      tap(response => {
        // Update stored user with new tokens
        const updatedUser = {
          ...this.currentUserValue,
          token: response.token,
          refreshToken: response.refreshToken
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }
  
  /**
   * Forgot password
   * @param email User email
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }
  
  /**
   * Reset password
   * @param token Reset token
   * @param password New password
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password/${token}`, { password });
  }
  
  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return !!user && !!user.token;
  }
  
  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const user = this.currentUserValue;
    if (!user || !user.token) return true;
    
    try {
      // Token is in format: header.payload.signature
      const payload = user.token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      // Check if token is expired
      return decoded.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  }
  
  /**
   * Check if user has specific role
   * @param role Role to check
   */
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user && user.role === role;
  }
}
