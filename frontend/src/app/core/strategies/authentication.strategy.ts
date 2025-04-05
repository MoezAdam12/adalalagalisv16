import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationStrategy } from './strategy.interfaces';

/**
 * استراتيجية المصادقة باستخدام JWT
 * تنفيذ لواجهة استراتيجية المصادقة باستخدام رموز JWT
 */
@Injectable({
  providedIn: 'root'
})
export class JwtAuthenticationStrategy implements AuthenticationStrategy {
  /**
   * إنشاء نسخة من استراتيجية المصادقة باستخدام JWT
   * @param http خدمة HttpClient
   */
  constructor(private http: HttpClient) {}

  /**
   * مصادقة المستخدم باستخدام JWT
   * @param credentials بيانات اعتماد المستخدم
   * @returns تدفق رصدي يحتوي على نتيجة المصادقة
   */
  authenticate(credentials: any): Observable<any> {
    return this.http.post('/api/auth/login', credentials);
  }
}

/**
 * استراتيجية المصادقة الثنائية
 * تنفيذ لواجهة استراتيجية المصادقة باستخدام المصادقة الثنائية
 */
@Injectable({
  providedIn: 'root'
})
export class TwoFactorAuthenticationStrategy implements AuthenticationStrategy {
  /**
   * إنشاء نسخة من استراتيجية المصادقة الثنائية
   * @param http خدمة HttpClient
   */
  constructor(private http: HttpClient) {}

  /**
   * مصادقة المستخدم باستخدام المصادقة الثنائية
   * @param credentials بيانات اعتماد المستخدم
   * @returns تدفق رصدي يحتوي على نتيجة المصادقة
   */
  authenticate(credentials: any): Observable<any> {
    return this.http.post('/api/auth/two-factor', credentials);
  }
}

/**
 * خدمة المصادقة
 * توفر واجهة موحدة للمصادقة مع دعم استراتيجيات مختلفة
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  /**
   * استراتيجية المصادقة الحالية
   * @private
   */
  private strategy: AuthenticationStrategy;

  /**
   * إنشاء نسخة من خدمة المصادقة
   * @param jwtStrategy استراتيجية المصادقة باستخدام JWT
   * @param twoFactorStrategy استراتيجية المصادقة الثنائية
   */
  constructor(
    private jwtStrategy: JwtAuthenticationStrategy,
    private twoFactorStrategy: TwoFactorAuthenticationStrategy
  ) {
    // استخدام استراتيجية JWT كاستراتيجية افتراضية
    this.strategy = this.jwtStrategy;
  }

  /**
   * تعيين استراتيجية المصادقة
   * @param strategyType نوع الاستراتيجية
   */
  setStrategy(strategyType: 'jwt' | 'two-factor'): void {
    this.strategy = strategyType === 'jwt' ? this.jwtStrategy : this.twoFactorStrategy;
  }

  /**
   * مصادقة المستخدم باستخدام الاستراتيجية الحالية
   * @param credentials بيانات اعتماد المستخدم
   * @returns تدفق رصدي يحتوي على نتيجة المصادقة
   */
  authenticate(credentials: any): Observable<any> {
    return this.strategy.authenticate(credentials);
  }
}
