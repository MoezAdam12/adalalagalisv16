import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExternalIntegrationsService } from '../../services/external-integrations.service';

@Component({
  selector: 'app-integration-form',
  templateUrl: './integration-form.component.html',
  styleUrls: ['./integration-form.component.scss']
})
export class IntegrationFormComponent implements OnInit {
  integrationForm: FormGroup;
  availableProviders: any = {};
  selectedType: string = '';
  selectedProvider: string = '';
  isEditing = false;
  integration: any = null;
  loading = false;
  error = '';
  success = '';
  oauthUrl = '';
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private externalIntegrationsService: ExternalIntegrationsService
  ) {
    this.integrationForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      provider: ['', Validators.required],
      is_enabled: [true],
      credentials: this.fb.group({}),
      settings: this.fb.group({})
    });
  }

  ngOnInit(): void {
    this.loadAvailableProviders();
    
    // Check if we're editing an existing integration
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.loadIntegration(id);
    } else {
      // Check if type and provider are specified in query params
      this.route.queryParams.subscribe(params => {
        if (params['type'] && params['provider']) {
          this.selectedType = params['type'];
          this.selectedProvider = params['provider'];
          this.updateFormForTypeAndProvider();
        }
      });
    }
  }

  loadAvailableProviders(): void {
    this.externalIntegrationsService.getAvailableProviders().subscribe(
      (response) => {
        if (response && response.data) {
          this.availableProviders = response.data;
        }
      },
      (error) => {
        console.error('Failed to load available providers:', error);
        this.error = 'فشل في تحميل مزودي الخدمات المتاحين. يرجى المحاولة مرة أخرى.';
      }
    );
  }
  
  loadIntegration(id: string): void {
    this.loading = true;
    this.error = '';
    
    this.externalIntegrationsService.getIntegrationById(id).subscribe(
      (response) => {
        if (response && response.data) {
          this.integration = response.data;
          this.selectedType = this.integration.type;
          this.selectedProvider = this.integration.provider;
          
          // Update form with integration data
          this.integrationForm.patchValue({
            name: this.integration.name,
            description: this.integration.description,
            type: this.integration.type,
            provider: this.integration.provider,
            is_enabled: this.integration.is_enabled
          });
          
          this.updateFormForTypeAndProvider();
          
          // Patch credentials and settings after form is updated
          if (this.integration.credentials) {
            const credentialsGroup = this.integrationForm.get('credentials') as FormGroup;
            Object.keys(this.integration.credentials).forEach(key => {
              if (credentialsGroup.contains(key)) {
                credentialsGroup.get(key)?.setValue(this.integration.credentials[key]);
              }
            });
          }
          
          if (this.integration.settings) {
            const settingsGroup = this.integrationForm.get('settings') as FormGroup;
            Object.keys(this.integration.settings).forEach(key => {
              if (settingsGroup.contains(key)) {
                settingsGroup.get(key)?.setValue(this.integration.settings[key]);
              }
            });
          }
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load integration:', error);
        this.error = 'فشل في تحميل التكامل. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  updateFormForTypeAndProvider(): void {
    // Update form type and provider
    this.integrationForm.patchValue({
      type: this.selectedType,
      provider: this.selectedProvider
    });
    
    // Reset credentials and settings form groups
    const credentialsGroup = this.fb.group({});
    const settingsGroup = this.fb.group({});
    
    // Add fields based on type and provider
    switch (`${this.selectedType}:${this.selectedProvider}`) {
      case 'storage:dropbox':
        credentialsGroup.addControl('access_token', this.fb.control('', Validators.required));
        credentialsGroup.addControl('refresh_token', this.fb.control(''));
        settingsGroup.addControl('root_folder', this.fb.control(''));
        settingsGroup.addControl('auto_sync', this.fb.control(false));
        break;
        
      case 'storage:google_drive':
        credentialsGroup.addControl('access_token', this.fb.control('', Validators.required));
        credentialsGroup.addControl('refresh_token', this.fb.control(''));
        settingsGroup.addControl('root_folder', this.fb.control(''));
        settingsGroup.addControl('auto_sync', this.fb.control(false));
        break;
        
      case 'accounting:quickbooks':
        credentialsGroup.addControl('access_token', this.fb.control('', Validators.required));
        credentialsGroup.addControl('refresh_token', this.fb.control(''));
        credentialsGroup.addControl('realm_id', this.fb.control('', Validators.required));
        settingsGroup.addControl('sync_invoices', this.fb.control(true));
        settingsGroup.addControl('sync_customers', this.fb.control(true));
        settingsGroup.addControl('sync_interval_hours', this.fb.control(24));
        break;
        
      case 'accounting:xero':
        credentialsGroup.addControl('access_token', this.fb.control('', Validators.required));
        credentialsGroup.addControl('refresh_token', this.fb.control(''));
        credentialsGroup.addControl('tenant_id', this.fb.control('', Validators.required));
        settingsGroup.addControl('sync_invoices', this.fb.control(true));
        settingsGroup.addControl('sync_contacts', this.fb.control(true));
        settingsGroup.addControl('sync_interval_hours', this.fb.control(24));
        break;
        
      case 'payment:stripe':
        credentialsGroup.addControl('api_key', this.fb.control('', Validators.required));
        credentialsGroup.addControl('webhook_secret', this.fb.control(''));
        settingsGroup.addControl('currency', this.fb.control('USD'));
        settingsGroup.addControl('payment_methods', this.fb.control(['card']));
        break;
        
      case 'payment:paypal':
        credentialsGroup.addControl('client_id', this.fb.control('', Validators.required));
        credentialsGroup.addControl('client_secret', this.fb.control('', Validators.required));
        settingsGroup.addControl('sandbox_mode', this.fb.control(false));
        settingsGroup.addControl('currency', this.fb.control('USD'));
        break;
        
      case 'sms:twilio':
        credentialsGroup.addControl('account_sid', this.fb.control('', Validators.required));
        credentialsGroup.addControl('auth_token', this.fb.control('', Validators.required));
        credentialsGroup.addControl('phone_number', this.fb.control('', Validators.required));
        settingsGroup.addControl('default_country_code', this.fb.control('+1'));
        break;
        
      case 'email:sendgrid':
        credentialsGroup.addControl('api_key', this.fb.control('', Validators.required));
        settingsGroup.addControl('from_email', this.fb.control('', [Validators.required, Validators.email]));
        settingsGroup.addControl('from_name', this.fb.control(''));
        break;
        
      default:
        // Generic fields for other providers
        if (this.selectedType && this.selectedProvider) {
          credentialsGroup.addControl('api_key', this.fb.control(''));
          credentialsGroup.addControl('username', this.fb.control(''));
          credentialsGroup.addControl('password', this.fb.control(''));
        }
    }
    
    // Update form with new control groups
    this.integrationForm.setControl('credentials', credentialsGroup);
    this.integrationForm.setControl('settings', settingsGroup);
  }
  
  onTypeChange(event: any): void {
    this.selectedType = event.target.value;
    this.selectedProvider = '';
    this.updateFormForTypeAndProvider();
  }
  
  onProviderChange(event: any): void {
    this.selectedProvider = event.target.value;
    this.updateFormForTypeAndProvider();
  }
  
  getOAuthUrl(): void {
    if (!this.selectedType || !this.selectedProvider) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.externalIntegrationsService.getOAuthUrl(this.selectedType, this.selectedProvider).subscribe(
      (response) => {
        if (response && response.data && response.data.auth_url) {
          this.oauthUrl = response.data.auth_url;
          window.open(this.oauthUrl, '_blank');
        } else {
          this.error = 'فشل في الحصول على رابط المصادقة.';
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to get OAuth URL:', error);
        this.error = error.message || 'فشل في الحصول على رابط المصادقة. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  handleOAuthCallback(): void {
    const code = prompt('يرجى إدخال رمز المصادقة الذي تم الحصول عليه:');
    if (!code) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // For demonstration, we're using a fixed state
    const state = 'demo_state';
    
    this.externalIntegrationsService.handleOAuthCallback(code, state, this.selectedType, this.selectedProvider).subscribe(
      (response) => {
        if (response && response.data) {
          // Update credentials form with tokens
          const credentialsGroup = this.integrationForm.get('credentials') as FormGroup;
          
          if (response.data.access_token && credentialsGroup.contains('access_token')) {
            credentialsGroup.get('access_token')?.setValue(response.data.access_token);
          }
          
          if (response.data.refresh_token && credentialsGroup.contains('refresh_token')) {
            credentialsGroup.get('refresh_token')?.setValue(response.data.refresh_token);
          }
          
          this.success = 'تم الحصول على رموز المصادقة بنجاح.';
        } else {
          this.error = 'فشل في معالجة رمز المصادقة.';
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to handle OAuth callback:', error);
        this.error = error.message || 'فشل في معالجة رمز المصادقة. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  onSubmit(): void {
    if (this.integrationForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.integrationForm.controls).forEach(key => {
        const control = this.integrationForm.get(key);
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
    
    const integrationData = this.integrationForm.value;
    
    if (this.isEditing && this.integration) {
      // Update existing integration
      this.externalIntegrationsService.updateIntegration(this.integration.id, integrationData).subscribe(
        (response) => {
          this.success = 'تم تحديث التكامل بنجاح';
          this.loading = false;
          
          // Navigate back to list after a short delay
          setTimeout(() => {
            this.router.navigate(['/admin/integrations']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to update integration:', error);
          this.error = error.message || 'فشل في تحديث التكامل. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    } else {
      // Create new integration
      this.externalIntegrationsService.createIntegration(integrationData).subscribe(
        (response) => {
          this.success = 'تم إنشاء التكامل بنجاح';
          this.loading = false;
          
          // Navigate back to list after a short delay
          setTimeout(() => {
            this.router.navigate(['/admin/integrations']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to create integration:', error);
          this.error = error.message || 'فشل في إنشاء التكامل. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  testIntegration(): void {
    if (!this.integration) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.externalIntegrationsService.testIntegration(this.integration.id).subscribe(
      (response) => {
        if (response && response.success) {
          this.success = `تم اختبار التكامل بنجاح: ${response.message}`;
        } else {
          this.error = `فشل اختبار التكامل: ${response.message}`;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to test integration:', error);
        this.error = error.message || 'فشل في اختبار التكامل. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  getIntegrationTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'storage': 'تخزين',
      'accounting': 'محاسبة',
      'payment': 'دفع',
      'sms': 'رسائل نصية',
      'email': 'بريد إلكتروني',
      'calendar': 'تقويم',
      'other': 'أخرى'
    };
    
    return typeLabels[type] || type;
  }
  
  getProviderName(type: string, providerId: string): string {
    if (!this.availableProviders[type]) {
      return providerId;
    }
    
    const provider = this.availableProviders[type].find((p: any) => p.id === providerId);
    return provider ? provider.name : providerId;
  }
  
  supportsOAuth(type: string, provider: string): boolean {
    const oauthProviders = [
      'storage:dropbox',
      'storage:google_drive',
      'storage:onedrive',
      'accounting:quickbooks',
      'accounting:xero',
      'payment:paypal',
      'calendar:google_calendar',
      'calendar:outlook_calendar'
    ];
    
    return oauthProviders.includes(`${type}:${provider}`);
  }
  
  cancel(): void {
    this.router.navigate(['/admin/integrations']);
  }
}
