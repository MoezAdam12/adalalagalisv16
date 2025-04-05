import { Component, OnInit } from '@angular/core';
import { EmailTemplateService } from '../../services/email-template.service';

@Component({
  selector: 'app-email-templates-list',
  templateUrl: './email-templates-list.component.html',
  styleUrls: ['./email-templates-list.component.scss']
})
export class EmailTemplatesListComponent implements OnInit {
  emailTemplates: any[] = [];
  systemTemplates: any[] = [];
  categories: any[] = [];
  selectedCategory: string = '';
  loading = false;
  error = '';
  success = '';
  showSystemTemplates = false;
  
  constructor(private emailTemplateService: EmailTemplateService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadEmailTemplates();
  }
  
  loadCategories(): void {
    this.emailTemplateService.getEmailTemplateCategories().subscribe(
      (response) => {
        if (response && response.data) {
          this.categories = response.data;
        }
      },
      (error) => {
        console.error('Failed to load email template categories:', error);
      }
    );
  }
  
  loadEmailTemplates(): void {
    this.loading = true;
    this.error = '';
    
    const params: any = {};
    if (this.selectedCategory) {
      params.category = this.selectedCategory;
    }
    
    this.emailTemplateService.getEmailTemplates(params).subscribe(
      (response) => {
        if (response && response.data) {
          this.emailTemplates = response.data;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load email templates:', error);
        this.error = 'فشل في تحميل قوالب البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  loadSystemTemplates(): void {
    this.loading = true;
    this.error = '';
    
    this.emailTemplateService.getSystemEmailTemplates().subscribe(
      (response) => {
        if (response && response.data) {
          this.systemTemplates = response.data;
          this.showSystemTemplates = true;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load system email templates:', error);
        this.error = 'فشل في تحميل قوالب البريد الإلكتروني النظامية. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.loadEmailTemplates();
  }
  
  toggleSystemTemplates(): void {
    if (!this.showSystemTemplates) {
      this.loadSystemTemplates();
    } else {
      this.showSystemTemplates = false;
    }
  }
  
  importSystemTemplate(code: string): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.emailTemplateService.importSystemTemplate(code).subscribe(
      (response) => {
        this.success = 'تم استيراد قالب البريد الإلكتروني بنجاح';
        this.loading = false;
        this.loadEmailTemplates();
        this.showSystemTemplates = false;
      },
      (error) => {
        console.error('Failed to import system template:', error);
        this.error = error.message || 'فشل في استيراد قالب البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  setDefaultTemplate(id: string): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.emailTemplateService.setDefaultTemplate(id).subscribe(
      (response) => {
        this.success = 'تم تعيين قالب البريد الإلكتروني كافتراضي بنجاح';
        this.loading = false;
        this.loadEmailTemplates();
      },
      (error) => {
        console.error('Failed to set default template:', error);
        this.error = error.message || 'فشل في تعيين قالب البريد الإلكتروني كافتراضي. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  deleteTemplate(id: string, name: string): void {
    if (confirm(`هل أنت متأكد من رغبتك في حذف قالب البريد الإلكتروني "${name}"؟`)) {
      this.loading = true;
      this.error = '';
      this.success = '';
      
      this.emailTemplateService.deleteEmailTemplate(id).subscribe(
        (response) => {
          this.success = 'تم حذف قالب البريد الإلكتروني بنجاح';
          this.loading = false;
          this.loadEmailTemplates();
        },
        (error) => {
          console.error('Failed to delete email template:', error);
          this.error = error.message || 'فشل في حذف قالب البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  getCategoryLabel(category: string): string {
    const found = this.categories.find(cat => cat.value === category);
    return found ? found.label : category;
  }
  
  getCategoryClass(category: string): string {
    const categoryClasses: { [key: string]: string } = {
      'authentication': 'bg-primary',
      'notification': 'bg-info',
      'billing': 'bg-success',
      'marketing': 'bg-warning',
      'system': 'bg-secondary',
      'other': 'bg-dark'
    };
    
    return categoryClasses[category] || 'bg-secondary';
  }
  
  getStatusLabel(isActive: boolean): string {
    return isActive ? 'مفعل' : 'معطل';
  }
  
  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-success' : 'bg-secondary';
  }
  
  getDefaultLabel(isDefault: boolean): string {
    return isDefault ? 'افتراضي' : 'غير افتراضي';
  }
  
  getDefaultClass(isDefault: boolean): string {
    return isDefault ? 'bg-primary' : 'bg-light text-dark';
  }
  
  getSystemLabel(isSystem: boolean): string {
    return isSystem ? 'نظامي' : 'مخصص';
  }
  
  getSystemClass(isSystem: boolean): string {
    return isSystem ? 'bg-info' : 'bg-light text-dark';
  }
}
