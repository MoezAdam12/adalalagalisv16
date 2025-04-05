import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss']
})
export class NotificationSettingsComponent implements OnInit {
  notificationSettings: any[] = [];
  loading = false;
  error = '';
  success = '';
  
  // Categories for notification settings
  categories = [
    { value: 'system', label: 'إشعارات النظام' },
    { value: 'billing', label: 'الفوترة والاشتراكات' },
    { value: 'documents', label: 'المستندات والملفات' },
    { value: 'tasks', label: 'المهام والتذكيرات' },
    { value: 'messages', label: 'الرسائل' },
    { value: 'security', label: 'الأمان' }
  ];
  
  // Email digest options
  digestOptions = [
    { value: 'instant', label: 'فوري' },
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'never', label: 'لا ترسل' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadNotificationSettings();
  }

  loadNotificationSettings(): void {
    this.loading = true;
    this.error = '';
    
    this.notificationService.getUserNotificationSettings().subscribe(
      (response) => {
        if (response && response.data) {
          this.notificationSettings = response.data;
          
          // If some categories don't have settings, create default settings
          this.ensureAllCategoriesHaveSettings();
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load notification settings:', error);
        this.error = 'فشل في تحميل إعدادات الإشعارات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  ensureAllCategoriesHaveSettings(): void {
    // Check if all categories have settings
    this.categories.forEach(category => {
      const existingSetting = this.notificationSettings.find(setting => setting.category === category.value);
      
      if (!existingSetting) {
        // Add default setting for this category
        this.notificationSettings.push({
          category: category.value,
          email_enabled: true,
          in_app_enabled: true,
          sms_enabled: false,
          push_enabled: false,
          email_digest: 'instant'
        });
      }
    });
  }

  updateSetting(setting: any, field: string, value: any): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    // Create update data
    const updateData = {
      category: setting.category,
      [field]: value
    };
    
    this.notificationService.updateUserNotificationSettings(updateData).subscribe(
      (response) => {
        // Update local setting
        setting[field] = value;
        this.success = 'تم تحديث إعدادات الإشعارات بنجاح';
        this.loading = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      (error) => {
        console.error('Failed to update notification settings:', error);
        this.error = 'فشل في تحديث إعدادات الإشعارات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  getCategoryLabel(categoryValue: string): string {
    const category = this.categories.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue;
  }
  
  getDigestLabel(digestValue: string): string {
    const digest = this.digestOptions.find(d => d.value === digestValue);
    return digest ? digest.label : digestValue;
  }
}
