import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UIThemeService } from '../../../../core/services/ui-theme.service';

@Component({
  selector: 'app-ui-theme-settings',
  templateUrl: './ui-theme-settings.component.html',
  styleUrls: ['./ui-theme-settings.component.scss']
})
export class UIThemeSettingsComponent implements OnInit {
  themes: any[] = [];
  activeTheme: any = null;
  themeForm: FormGroup;
  selectedTheme: any = null;
  isEditing = false;
  loading = false;
  error = '';
  success = '';
  uploadError = '';
  uploadSuccess = '';
  previewStyle = {};
  
  constructor(
    private fb: FormBuilder,
    private uiThemeService: UIThemeService
  ) {
    this.themeForm = this.fb.group({
      name: ['', Validators.required],
      primary_color: ['#3f51b5', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      secondary_color: ['#f50057', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      text_color: ['#212121', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      text_light_color: ['#ffffff', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      background_color: ['#ffffff', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      background_light_color: ['#f5f5f5', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      sidebar_color: ['#ffffff', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      header_color: ['#ffffff', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      button_border_radius: ['4px', Validators.required],
      font_family: ['Roboto, "Helvetica Neue", sans-serif', Validators.required],
      font_size_base: ['14px', Validators.required],
      custom_css: ['']
    });
  }

  ngOnInit(): void {
    this.loadThemes();
    this.updatePreviewStyle();
    
    // Update preview when form changes
    this.themeForm.valueChanges.subscribe(() => {
      this.updatePreviewStyle();
    });
  }

  loadThemes(): void {
    this.loading = true;
    this.error = '';
    
    this.uiThemeService.getUIThemes().subscribe(
      (response) => {
        if (response && response.data) {
          this.themes = response.data;
          this.loadActiveTheme();
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load UI themes:', error);
        this.error = 'فشل في تحميل سمات واجهة المستخدم. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  loadActiveTheme(): void {
    this.uiThemeService.getActiveUITheme().subscribe(
      (response) => {
        if (response && response.data) {
          this.activeTheme = response.data;
          
          // Apply active theme to application
          this.uiThemeService.applyTheme(this.activeTheme);
        }
      },
      (error) => {
        console.error('Failed to load active UI theme:', error);
      }
    );
  }
  
  selectTheme(theme: any): void {
    this.selectedTheme = theme;
    this.isEditing = true;
    
    // Populate form with theme data
    this.themeForm.patchValue({
      name: theme.name,
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      text_color: theme.text_color,
      text_light_color: theme.text_light_color,
      background_color: theme.background_color,
      background_light_color: theme.background_light_color,
      sidebar_color: theme.sidebar_color || '#ffffff',
      header_color: theme.header_color || '#ffffff',
      button_border_radius: theme.button_border_radius || '4px',
      font_family: theme.font_family || 'Roboto, "Helvetica Neue", sans-serif',
      font_size_base: theme.font_size_base || '14px',
      custom_css: theme.custom_css || ''
    });
    
    this.updatePreviewStyle();
  }
  
  createNewTheme(): void {
    this.selectedTheme = null;
    this.isEditing = false;
    
    // Reset form with default values
    this.themeForm.reset({
      name: '',
      primary_color: '#3f51b5',
      secondary_color: '#f50057',
      text_color: '#212121',
      text_light_color: '#ffffff',
      background_color: '#ffffff',
      background_light_color: '#f5f5f5',
      sidebar_color: '#ffffff',
      header_color: '#ffffff',
      button_border_radius: '4px',
      font_family: 'Roboto, "Helvetica Neue", sans-serif',
      font_size_base: '14px',
      custom_css: ''
    });
    
    this.updatePreviewStyle();
  }
  
  updatePreviewStyle(): void {
    const formValues = this.themeForm.value;
    
    this.previewStyle = {
      '--preview-primary-color': formValues.primary_color,
      '--preview-secondary-color': formValues.secondary_color,
      '--preview-text-color': formValues.text_color,
      '--preview-text-light-color': formValues.text_light_color,
      '--preview-background-color': formValues.background_color,
      '--preview-background-light-color': formValues.background_light_color,
      '--preview-sidebar-color': formValues.sidebar_color,
      '--preview-header-color': formValues.header_color,
      '--preview-button-border-radius': formValues.button_border_radius,
      '--preview-font-family': formValues.font_family,
      '--preview-font-size-base': formValues.font_size_base
    };
  }
  
  onSubmit(): void {
    if (this.themeForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.themeForm.controls).forEach(key => {
        this.themeForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const themeData = this.themeForm.value;
    
    if (this.isEditing && this.selectedTheme) {
      // Update existing theme
      this.uiThemeService.updateUITheme(this.selectedTheme.id, themeData).subscribe(
        (response) => {
          this.success = 'تم تحديث سمة واجهة المستخدم بنجاح';
          this.loading = false;
          this.loadThemes();
        },
        (error) => {
          console.error('Failed to update UI theme:', error);
          this.error = error.message || 'فشل في تحديث سمة واجهة المستخدم. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    } else {
      // Create new theme
      this.uiThemeService.createUITheme(themeData).subscribe(
        (response) => {
          this.success = 'تم إنشاء سمة واجهة المستخدم بنجاح';
          this.loading = false;
          this.loadThemes();
          this.selectedTheme = response.data;
          this.isEditing = true;
        },
        (error) => {
          console.error('Failed to create UI theme:', error);
          this.error = error.message || 'فشل في إنشاء سمة واجهة المستخدم. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  setActiveTheme(theme: any): void {
    this.loading = true;
    
    this.uiThemeService.setActiveUITheme(theme.id).subscribe(
      (response) => {
        this.success = 'تم تعيين السمة كسمة نشطة بنجاح';
        this.loading = false;
        this.loadThemes();
      },
      (error) => {
        console.error('Failed to set active UI theme:', error);
        this.error = error.message || 'فشل في تعيين السمة كسمة نشطة. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  deleteTheme(theme: any): void {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه السمة؟')) {
      this.loading = true;
      
      this.uiThemeService.deleteUITheme(theme.id).subscribe(
        (response) => {
          this.success = 'تم حذف سمة واجهة المستخدم بنجاح';
          this.loading = false;
          this.loadThemes();
          
          if (this.selectedTheme && this.selectedTheme.id === theme.id) {
            this.selectedTheme = null;
            this.isEditing = false;
            this.createNewTheme();
          }
        },
        (error) => {
          console.error('Failed to delete UI theme:', error);
          this.error = error.message || 'فشل في حذف سمة واجهة المستخدم. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  uploadLogo(event: any, type: string): void {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    // Check file type
    if (!file.type.match(/image\/(png|jpeg|jpg|gif|svg)/)) {
      this.uploadError = 'يجب أن يكون الملف صورة (PNG, JPEG, JPG, GIF, SVG)';
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'يجب أن يكون حجم الملف أقل من 5 ميجابايت';
      return;
    }
    
    this.uploadError = '';
    this.uploadSuccess = '';
    this.loading = true;
    
    this.uiThemeService.uploadLogo(this.selectedTheme.id, type, file).subscribe(
      (response) => {
        this.uploadSuccess = 'تم رفع الشعار بنجاح';
        this.loading = false;
        
        // Update selected theme with new logo URL
        if (type === 'logo') {
          this.selectedTheme.logo_url = response.data.file_url;
        } else if (type === 'logo_small') {
          this.selectedTheme.logo_small_url = response.data.file_url;
        } else if (type === 'favicon') {
          this.selectedTheme.favicon_url = response.data.file_url;
        }
        
        // Reload themes to get updated data
        this.loadThemes();
      },
      (error) => {
        console.error('Failed to upload logo:', error);
        this.uploadError = error.message || 'فشل في رفع الشعار. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  previewTheme(): void {
    const themeData = this.themeForm.value;
    this.uiThemeService.applyTheme(themeData);
  }
  
  resetPreview(): void {
    if (this.activeTheme) {
      this.uiThemeService.applyTheme(this.activeTheme);
    }
  }
  
  createDefaultTheme(): void {
    this.loading = true;
    
    this.uiThemeService.createDefaultUITheme().subscribe(
      (response) => {
        this.success = 'تم إنشاء السمة الافتراضية بنجاح';
        this.loading = false;
        this.loadThemes();
      },
      (error) => {
        console.error('Failed to create default UI theme:', error);
        this.error = error.message || 'فشل في إنشاء السمة الافتراضية. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
}
