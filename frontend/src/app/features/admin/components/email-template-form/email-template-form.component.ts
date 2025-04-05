import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailTemplateService } from '../../services/email-template.service';

@Component({
  selector: 'app-email-template-form',
  templateUrl: './email-template-form.component.html',
  styleUrls: ['./email-template-form.component.scss']
})
export class EmailTemplateFormComponent implements OnInit {
  templateForm: FormGroup;
  templateId: string | null = null;
  isEditMode = false;
  loading = false;
  error = '';
  success = '';
  categories: any[] = [];
  variablesList: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private emailTemplateService: EmailTemplateService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      description: [''],
      subject: ['', [Validators.required]],
      body_html: ['', [Validators.required]],
      body_text: [''],
      category: ['', [Validators.required]],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    
    this.templateId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.templateId;
    
    if (this.isEditMode) {
      this.loadTemplate();
      this.templateForm.get('code')?.disable();
    }
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
  
  loadTemplate(): void {
    if (!this.templateId) return;
    
    this.loading = true;
    this.error = '';
    
    this.emailTemplateService.getEmailTemplateById(this.templateId).subscribe(
      (response) => {
        if (response && response.data) {
          const template = response.data;
          
          this.templateForm.patchValue({
            name: template.name,
            code: template.code,
            description: template.description,
            subject: template.subject,
            body_html: template.body_html,
            body_text: template.body_text,
            category: template.category,
            is_active: template.is_active
          });
          
          this.variablesList = template.variables || [];
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load email template:', error);
        this.error = 'فشل في تحميل قالب البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  onSubmit(): void {
    if (this.templateForm.invalid) {
      this.markFormGroupTouched(this.templateForm);
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const formData = this.templateForm.value;
    
    // Add variables list
    formData.variables = this.variablesList;
    
    if (this.isEditMode && this.templateId) {
      // Update existing template
      this.emailTemplateService.updateEmailTemplate(this.templateId, formData).subscribe(
        (response) => {
          this.success = 'تم تحديث قالب البريد الإلكتروني بنجاح';
          this.loading = false;
          
          // Navigate back to list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/email-templates']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to update email template:', error);
          this.error = error.message || 'فشل في تحديث قالب البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    } else {
      // Create new template
      // Re-enable code field if it was disabled
      if (this.templateForm.get('code')?.disabled) {
        formData.code = this.templateForm.get('code')?.value;
      }
      
      this.emailTemplateService.createEmailTemplate(formData).subscribe(
        (response) => {
          this.success = 'تم إنشاء قالب البريد الإلكتروني بنجاح';
          this.loading = false;
          
          // Navigate back to list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/email-templates']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to create email template:', error);
          this.error = error.message || 'فشل في إنشاء قالب البريد الإلكتروني. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  addVariable(variable: string): void {
    if (!variable || variable.trim() === '') return;
    
    // Check if variable already exists
    if (!this.variablesList.includes(variable)) {
      this.variablesList.push(variable);
    }
  }
  
  removeVariable(variable: string): void {
    const index = this.variablesList.indexOf(variable);
    if (index !== -1) {
      this.variablesList.splice(index, 1);
    }
  }
  
  insertVariable(variable: string): void {
    const bodyHtmlControl = this.templateForm.get('body_html');
    if (bodyHtmlControl) {
      const currentValue = bodyHtmlControl.value || '';
      const cursorPosition = document.getElementById('body_html')?.selectionStart || currentValue.length;
      
      const variableText = `{{${variable}}}`;
      const newValue = currentValue.substring(0, cursorPosition) + variableText + currentValue.substring(cursorPosition);
      
      bodyHtmlControl.setValue(newValue);
      
      // Add to variables list if not already there
      this.addVariable(variable);
    }
  }
  
  previewTemplate(): void {
    if (this.templateForm.invalid) {
      this.markFormGroupTouched(this.templateForm);
      return;
    }
    
    const formData = this.templateForm.value;
    
    // Generate test data
    const testData: any = {};
    this.variablesList.forEach(variable => {
      testData[variable] = `[قيمة ${variable}]`;
    });
    
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html dir="rtl">
        <head>
          <title>معاينة قالب البريد الإلكتروني</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .preview-header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .preview-subject { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .preview-content { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="preview-header">
            <div class="preview-subject">الموضوع: ${formData.subject}</div>
          </div>
          <div class="preview-content">
            ${formData.body_html}
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }
  
  cancel(): void {
    this.router.navigate(['/admin/email-templates']);
  }
  
  // Helper method to mark all controls in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
