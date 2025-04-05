import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-email-settings',
  templateUrl: './email-settings.component.html',
  styleUrls: ['./email-settings.component.scss']
})
export class EmailSettingsComponent implements OnInit {
  emailConfigForm: FormGroup;
  testEmailForm: FormGroup;
  loading = false;
  testLoading = false;
  error = '';
  success = '';
  testError = '';
  testSuccess = '';
  providers = [
    { value: 'smtp', label: 'SMTP Server' },
    { value: 'sendgrid', label: 'SendGrid' },
    { value: 'mailgun', label: 'Mailgun' },
    { value: 'ses', label: 'Amazon SES' }
  ];
  encryptionTypes = [
    { value: 'tls', label: 'TLS' },
    { value: 'ssl', label: 'SSL' },
    { value: 'none', label: 'None' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.emailConfigForm = this.fb.group({
      provider: ['smtp', Validators.required],
      host: ['', Validators.required],
      port: [587, [Validators.required, Validators.pattern('^[0-9]*$')]],
      username: ['', Validators.required],
      password: [''],
      from_email: ['', [Validators.required, Validators.email]],
      from_name: ['', Validators.required],
      reply_to: ['', Validators.email],
      encryption: ['tls'],
      api_key: [''],
      api_secret: ['']
    });
    
    this.testEmailForm = this.fb.group({
      recipient_email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadEmailConfig();
    this.onProviderChange();
  }

  loadEmailConfig(): void {
    this.loading = true;
    this.error = '';
    
    this.notificationService.getEmailConfig().subscribe(
      (response) => {
        if (response && response.data) {
          const config = response.data;
          
          // Update form with existing config
          this.emailConfigForm.patchValue({
            provider: config.provider,
            host: config.host,
            port: config.port,
            username: config.username,
            from_email: config.from_email,
            from_name: config.from_name,
            reply_to: config.reply_to || '',
            encryption: config.encryption || 'tls'
          });
          
          // Trigger provider change to show/hide fields
          this.onProviderChange();
        }
        this.loading = false;
      },
      (error) => {
        if (error.status !== 404) {
          console.error('Failed to load email configuration:', error);
          this.error = 'فشل في تحميل إعدادات البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
        }
        this.loading = false;
      }
    );
  }

  onProviderChange(): void {
    const provider = this.emailConfigForm.get('provider')?.value;
    
    // Reset validation based on provider
    if (provider === 'smtp') {
      this.emailConfigForm.get('host')?.setValidators([Validators.required]);
      this.emailConfigForm.get('port')?.setValidators([Validators.required, Validators.pattern('^[0-9]*$')]);
      this.emailConfigForm.get('username')?.setValidators([Validators.required]);
      this.emailConfigForm.get('api_key')?.clearValidators();
      this.emailConfigForm.get('api_secret')?.clearValidators();
    } else {
      this.emailConfigForm.get('host')?.clearValidators();
      this.emailConfigForm.get('port')?.clearValidators();
      this.emailConfigForm.get('username')?.clearValidators();
      
      if (provider === 'sendgrid' || provider === 'mailgun') {
        this.emailConfigForm.get('api_key')?.setValidators([Validators.required]);
      } else {
        this.emailConfigForm.get('api_key')?.clearValidators();
      }
      
      if (provider === 'mailgun') {
        this.emailConfigForm.get('api_secret')?.setValidators([Validators.required]);
      } else {
        this.emailConfigForm.get('api_secret')?.clearValidators();
      }
    }
    
    // Update validation
    this.emailConfigForm.get('host')?.updateValueAndValidity();
    this.emailConfigForm.get('port')?.updateValueAndValidity();
    this.emailConfigForm.get('username')?.updateValueAndValidity();
    this.emailConfigForm.get('api_key')?.updateValueAndValidity();
    this.emailConfigForm.get('api_secret')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.emailConfigForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.emailConfigForm.controls).forEach(key => {
        this.emailConfigForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const configData = { ...this.emailConfigForm.value };
    
    // Only include password if provided (to avoid overwriting with empty string)
    if (!configData.password) {
      delete configData.password;
    }
    
    // Only include API key if provided
    if (!configData.api_key) {
      delete configData.api_key;
    }
    
    // Only include API secret if provided
    if (!configData.api_secret) {
      delete configData.api_secret;
    }
    
    this.notificationService.updateEmailConfig(configData).subscribe(
      (response) => {
        this.success = 'تم تحديث إعدادات البريد الإلكتروني بنجاح';
        this.loading = false;
      },
      (error) => {
        console.error('Failed to update email configuration:', error);
        this.error = error.message || 'فشل في تحديث إعدادات البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }

  testEmailConfig(): void {
    if (this.testEmailForm.invalid) {
      this.testEmailForm.get('recipient_email')?.markAsTouched();
      return;
    }
    
    this.testLoading = true;
    this.testError = '';
    this.testSuccess = '';
    
    const testData = this.testEmailForm.value;
    
    this.notificationService.testEmailConfig(testData).subscribe(
      (response) => {
        this.testSuccess = 'تم إرسال بريد إلكتروني تجريبي بنجاح';
        this.testLoading = false;
      },
      (error) => {
        console.error('Failed to send test email:', error);
        this.testError = error.message || 'فشل في إرسال البريد الإلكتروني التجريبي. يرجى التحقق من الإعدادات والمحاولة مرة أخرى.';
        this.testLoading = false;
      }
    );
  }
}
