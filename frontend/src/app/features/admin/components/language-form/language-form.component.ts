import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-form',
  templateUrl: './language-form.component.html',
  styleUrls: ['./language-form.component.scss']
})
export class LanguageFormComponent implements OnInit {
  languageForm: FormGroup;
  languageId: string | null = null;
  isEditMode = false;
  loading = false;
  error = '';
  success = '';
  textDirections: any[] = [];
  
  constructor(
    private fb: FormBuilder,
    private languageService: LanguageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.languageForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[a-z]{2,3}(-[A-Z]{2})?$/)]],
      name: ['', [Validators.required]],
      native_name: ['', [Validators.required]],
      flag_icon: [''],
      text_direction: ['ltr', [Validators.required]],
      is_active: [true],
      is_default: [false],
      sort_order: [0]
    });
  }

  ngOnInit(): void {
    this.loadTextDirections();
    
    this.languageId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.languageId;
    
    if (this.isEditMode) {
      this.loadLanguage();
      this.languageForm.get('code')?.disable();
    }
  }
  
  loadTextDirections(): void {
    this.languageService.getLanguageTextDirections().subscribe(
      (response) => {
        if (response && response.data) {
          this.textDirections = response.data;
        }
      },
      (error) => {
        console.error('Failed to load text directions:', error);
      }
    );
  }
  
  loadLanguage(): void {
    if (!this.languageId) return;
    
    this.loading = true;
    this.error = '';
    
    this.languageService.getLanguageById(this.languageId).subscribe(
      (response) => {
        if (response && response.data) {
          const language = response.data;
          
          this.languageForm.patchValue({
            code: language.code,
            name: language.name,
            native_name: language.native_name,
            flag_icon: language.flag_icon,
            text_direction: language.text_direction,
            is_active: language.is_active,
            is_default: language.is_default,
            sort_order: language.sort_order
          });
          
          // Disable default checkbox if already default
          if (language.is_default) {
            this.languageForm.get('is_default')?.disable();
          }
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load language:', error);
        this.error = 'فشل في تحميل اللغة. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  onSubmit(): void {
    if (this.languageForm.invalid) {
      this.markFormGroupTouched(this.languageForm);
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const formData = this.languageForm.getRawValue(); // Get values including disabled fields
    
    if (this.isEditMode && this.languageId) {
      // Update existing language
      this.languageService.updateLanguage(this.languageId, formData).subscribe(
        (response) => {
          this.success = 'تم تحديث اللغة بنجاح';
          this.loading = false;
          
          // Navigate back to list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/languages']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to update language:', error);
          this.error = error.message || 'فشل في تحديث اللغة. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    } else {
      // Create new language
      this.languageService.createLanguage(formData).subscribe(
        (response) => {
          this.success = 'تم إنشاء اللغة بنجاح';
          this.loading = false;
          
          // Navigate back to list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/languages']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to create language:', error);
          this.error = error.message || 'فشل في إنشاء اللغة. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  cancel(): void {
    this.router.navigate(['/admin/languages']);
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
