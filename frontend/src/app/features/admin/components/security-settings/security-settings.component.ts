import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SecuritySettingsService } from '../../../../core/services/security-settings.service';

@Component({
  selector: 'app-security-settings',
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.scss']
})
export class SecuritySettingsComponent implements OnInit {
  securityForm: FormGroup;
  ipWhitelistForm: FormGroup;
  passwordTestForm: FormGroup;
  activeSessions: any[] = [];
  loading = false;
  error = '';
  success = '';
  ipError = '';
  ipSuccess = '';
  passwordTestResult: any = null;
  activeTab = 'password';
  
  constructor(
    private fb: FormBuilder,
    private securitySettingsService: SecuritySettingsService
  ) {
    this.securityForm = this.fb.group({
      // Password policy
      password_min_length: [8, [Validators.required, Validators.min(6), Validators.max(128)]],
      password_require_uppercase: [true],
      password_require_lowercase: [true],
      password_require_numbers: [true],
      password_require_symbols: [true],
      password_expiry_days: [90, [Validators.required, Validators.min(0)]],
      password_history_count: [5, [Validators.required, Validators.min(0)]],
      
      // Two-factor authentication
      mfa_enabled: [false],
      mfa_required: [false],
      mfa_methods: this.fb.group({
        app: [true],
        sms: [true],
        email: [true]
      }),
      
      // Session settings
      session_timeout_minutes: [30, [Validators.required, Validators.min(1)]],
      session_inactivity_timeout_minutes: [15, [Validators.required, Validators.min(0)]],
      session_absolute_timeout_hours: [24, [Validators.required, Validators.min(0)]],
      session_concurrent_max: [5, [Validators.required, Validators.min(1)]],
      
      // Login security
      max_login_attempts: [5, [Validators.required, Validators.min(1)]],
      lockout_duration_minutes: [30, [Validators.required, Validators.min(1)]],
      
      // API security
      api_rate_limit_enabled: [true],
      api_rate_limit_requests: [100, [Validators.required, Validators.min(1)]],
      api_rate_limit_window_minutes: [15, [Validators.required, Validators.min(1)]],
      
      // Audit settings
      audit_log_enabled: [true],
      audit_log_retention_days: [90, [Validators.required, Validators.min(1)]],
      
      // CORS settings
      cors_enabled: [true],
      
      // Additional security settings
      security_headers_enabled: [true],
      content_security_policy_enabled: [false]
    });
    
    this.ipWhitelistForm = this.fb.group({
      ip_whitelist_enabled: [false],
      ip_whitelist: ['']
    });
    
    this.passwordTestForm = this.fb.group({
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSecuritySettings();
    this.loadActiveSessions();
  }

  loadSecuritySettings(): void {
    this.loading = true;
    this.error = '';
    
    this.securitySettingsService.getSecuritySettings().subscribe(
      (response) => {
        if (response && response.data) {
          const settings = response.data;
          
          // Update form with existing settings
          this.securityForm.patchValue({
            password_min_length: settings.password_min_length,
            password_require_uppercase: settings.password_require_uppercase,
            password_require_lowercase: settings.password_require_lowercase,
            password_require_numbers: settings.password_require_numbers,
            password_require_symbols: settings.password_require_symbols,
            password_expiry_days: settings.password_expiry_days,
            password_history_count: settings.password_history_count,
            mfa_enabled: settings.mfa_enabled,
            mfa_required: settings.mfa_required,
            mfa_methods: settings.mfa_methods,
            session_timeout_minutes: settings.session_timeout_minutes,
            session_inactivity_timeout_minutes: settings.session_inactivity_timeout_minutes,
            session_absolute_timeout_hours: settings.session_absolute_timeout_hours,
            session_concurrent_max: settings.session_concurrent_max,
            max_login_attempts: settings.max_login_attempts,
            lockout_duration_minutes: settings.lockout_duration_minutes,
            api_rate_limit_enabled: settings.api_rate_limit_enabled,
            api_rate_limit_requests: settings.api_rate_limit_requests,
            api_rate_limit_window_minutes: settings.api_rate_limit_window_minutes,
            audit_log_enabled: settings.audit_log_enabled,
            audit_log_retention_days: settings.audit_log_retention_days,
            cors_enabled: settings.cors_enabled,
            security_headers_enabled: settings.security_headers_enabled,
            content_security_policy_enabled: settings.content_security_policy_enabled
          });
          
          // Update IP whitelist form
          this.ipWhitelistForm.patchValue({
            ip_whitelist_enabled: settings.ip_whitelist_enabled,
            ip_whitelist: settings.ip_whitelist ? settings.ip_whitelist.join('\n') : ''
          });
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load security settings:', error);
        this.error = 'فشل في تحميل إعدادات الأمان. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  loadActiveSessions(): void {
    this.securitySettingsService.getActiveSessions().subscribe(
      (response) => {
        if (response && response.data) {
          this.activeSessions = response.data;
        }
      },
      (error) => {
        console.error('Failed to load active sessions:', error);
      }
    );
  }

  onSubmit(): void {
    if (this.securityForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.securityForm.controls).forEach(key => {
        const control = this.securityForm.get(key);
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(subKey => {
            control.get(subKey)?.markAsTouched();
          });
        } else {
          control?.markAsTouched();
        }
      });
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const settingsData = this.securityForm.value;
    
    this.securitySettingsService.updateSecuritySettings(settingsData).subscribe(
      (response) => {
        this.success = 'تم تحديث إعدادات الأمان بنجاح';
        this.loading = false;
      },
      (error) => {
        console.error('Failed to update security settings:', error);
        this.error = error.message || 'فشل في تحديث إعدادات الأمان. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  resetSettings(): void {
    if (confirm('هل أنت متأكد من رغبتك في إعادة تعيين جميع إعدادات الأمان إلى القيم الافتراضية؟')) {
      this.loading = true;
      this.error = '';
      this.success = '';
      
      this.securitySettingsService.resetSecuritySettings().subscribe(
        (response) => {
          this.success = 'تم إعادة تعيين إعدادات الأمان إلى القيم الافتراضية بنجاح';
          this.loading = false;
          this.loadSecuritySettings();
        },
        (error) => {
          console.error('Failed to reset security settings:', error);
          this.error = error.message || 'فشل في إعادة تعيين إعدادات الأمان. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  updateIPWhitelist(): void {
    if (this.ipWhitelistForm.invalid) {
      Object.keys(this.ipWhitelistForm.controls).forEach(key => {
        this.ipWhitelistForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.ipError = '';
    this.ipSuccess = '';
    
    const ipWhitelistEnabled = this.ipWhitelistForm.get('ip_whitelist_enabled')?.value;
    const ipWhitelistText = this.ipWhitelistForm.get('ip_whitelist')?.value;
    
    // Convert text area to array of IPs
    const ipWhitelist = ipWhitelistText
      ? ipWhitelistText.split('\n').map((ip: string) => ip.trim()).filter((ip: string) => ip)
      : [];
    
    this.securitySettingsService.updateIPWhitelist({
      ip_whitelist_enabled: ipWhitelistEnabled,
      ip_whitelist: ipWhitelist
    }).subscribe(
      (response) => {
        this.ipSuccess = 'تم تحديث قائمة عناوين IP المسموح بها بنجاح';
        this.loading = false;
      },
      (error) => {
        console.error('Failed to update IP whitelist:', error);
        this.ipError = error.message || 'فشل في تحديث قائمة عناوين IP المسموح بها. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  testPassword(): void {
    if (this.passwordTestForm.invalid) {
      this.passwordTestForm.get('password')?.markAsTouched();
      return;
    }
    
    const password = this.passwordTestForm.get('password')?.value;
    
    this.securitySettingsService.testPasswordPolicy(password).subscribe(
      (response) => {
        if (response && response.data) {
          this.passwordTestResult = response.data;
        }
      },
      (error) => {
        console.error('Failed to test password:', error);
      }
    );
  }
  
  terminateSession(sessionId: string): void {
    if (confirm('هل أنت متأكد من رغبتك في إنهاء هذه الجلسة؟')) {
      this.securitySettingsService.terminateSession(sessionId).subscribe(
        (response) => {
          this.loadActiveSessions();
        },
        (error) => {
          console.error('Failed to terminate session:', error);
        }
      );
    }
  }
  
  terminateAllSessions(): void {
    if (confirm('هل أنت متأكد من رغبتك في إنهاء جميع الجلسات النشطة؟')) {
      this.securitySettingsService.terminateAllSessions().subscribe(
        (response) => {
          this.loadActiveSessions();
        },
        (error) => {
          console.error('Failed to terminate all sessions:', error);
        }
      );
    }
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
