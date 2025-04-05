import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-languages-list',
  templateUrl: './languages-list.component.html',
  styleUrls: ['./languages-list.component.scss']
})
export class LanguagesListComponent implements OnInit {
  languages: any[] = [];
  commonLanguages: any[] = [];
  loading = false;
  error = '';
  success = '';
  showCommonLanguages = false;
  dragEnabled = false;
  
  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.loadLanguages();
  }
  
  loadLanguages(): void {
    this.loading = true;
    this.error = '';
    
    this.languageService.getLanguages().subscribe(
      (response) => {
        if (response && response.data) {
          this.languages = response.data;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load languages:', error);
        this.error = 'فشل في تحميل اللغات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  loadCommonLanguages(): void {
    this.loading = true;
    this.error = '';
    
    this.languageService.getCommonLanguages().subscribe(
      (response) => {
        if (response && response.data) {
          this.commonLanguages = response.data;
          
          // Filter out languages that are already added
          if (this.languages.length > 0) {
            const existingCodes = this.languages.map(lang => lang.code);
            this.commonLanguages = this.commonLanguages.filter(lang => !existingCodes.includes(lang.code));
          }
          
          this.showCommonLanguages = true;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load common languages:', error);
        this.error = 'فشل في تحميل اللغات الشائعة. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  toggleCommonLanguages(): void {
    if (!this.showCommonLanguages) {
      this.loadCommonLanguages();
    } else {
      this.showCommonLanguages = false;
    }
  }
  
  importCommonLanguage(code: string): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.languageService.importCommonLanguage(code).subscribe(
      (response) => {
        this.success = 'تم استيراد اللغة بنجاح';
        this.loading = false;
        this.loadLanguages();
        this.showCommonLanguages = false;
      },
      (error) => {
        console.error('Failed to import common language:', error);
        this.error = error.message || 'فشل في استيراد اللغة. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  setDefaultLanguage(id: string): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.languageService.setDefaultLanguage(id).subscribe(
      (response) => {
        this.success = 'تم تعيين اللغة كافتراضية بنجاح';
        this.loading = false;
        this.loadLanguages();
      },
      (error) => {
        console.error('Failed to set default language:', error);
        this.error = error.message || 'فشل في تعيين اللغة كافتراضية. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  deleteLanguage(id: string, name: string): void {
    if (confirm(`هل أنت متأكد من رغبتك في حذف اللغة "${name}"؟`)) {
      this.loading = true;
      this.error = '';
      this.success = '';
      
      this.languageService.deleteLanguage(id).subscribe(
        (response) => {
          this.success = 'تم حذف اللغة بنجاح';
          this.loading = false;
          this.loadLanguages();
        },
        (error) => {
          console.error('Failed to delete language:', error);
          this.error = error.message || 'فشل في حذف اللغة. يرجى المحاولة مرة أخرى.';
          this.loading = false;
        }
      );
    }
  }
  
  toggleLanguageStatus(language: any): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const updatedLanguage = {
      ...language,
      is_active: !language.is_active
    };
    
    this.languageService.updateLanguage(language.id, updatedLanguage).subscribe(
      (response) => {
        this.success = `تم ${language.is_active ? 'تعطيل' : 'تفعيل'} اللغة بنجاح`;
        this.loading = false;
        this.loadLanguages();
      },
      (error) => {
        console.error('Failed to update language status:', error);
        this.error = error.message || 'فشل في تحديث حالة اللغة. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }
  
  toggleDragMode(): void {
    this.dragEnabled = !this.dragEnabled;
    
    if (!this.dragEnabled && this.hasOrderChanged()) {
      this.saveSortOrder();
    }
  }
  
  hasOrderChanged(): boolean {
    // Check if the sort order has changed
    for (let i = 0; i < this.languages.length; i++) {
      if (this.languages[i].sort_order !== i) {
        return true;
      }
    }
    return false;
  }
  
  onDrop(event: CdkDragDrop<any[]>): void {
    if (this.dragEnabled) {
      moveItemInArray(this.languages, event.previousIndex, event.currentIndex);
      
      // Update sort_order values
      this.languages.forEach((language, index) => {
        language.sort_order = index;
      });
    }
  }
  
  saveSortOrder(): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const sortedLanguages = this.languages.map(language => ({
      id: language.id,
      sort_order: language.sort_order
    }));
    
    this.languageService.updateLanguageSortOrder(sortedLanguages).subscribe(
      (response) => {
        this.success = 'تم حفظ ترتيب اللغات بنجاح';
        this.loading = false;
      },
      (error) => {
        console.error('Failed to update language sort order:', error);
        this.error = error.message || 'فشل في تحديث ترتيب اللغات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
        this.loadLanguages(); // Reload to get original order
      }
    );
  }
  
  getTextDirectionLabel(direction: string): string {
    return direction === 'rtl' ? 'من اليمين إلى اليسار' : 'من اليسار إلى اليمين';
  }
  
  getStatusLabel(isActive: boolean): string {
    return isActive ? 'مفعلة' : 'معطلة';
  }
  
  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-success' : 'bg-secondary';
  }
  
  getDefaultLabel(isDefault: boolean): string {
    return isDefault ? 'افتراضية' : 'غير افتراضية';
  }
  
  getDefaultClass(isDefault: boolean): string {
    return isDefault ? 'bg-primary' : 'bg-light text-dark';
  }
  
  getDirectionClass(direction: string): string {
    return direction === 'rtl' ? 'bg-info' : 'bg-light text-dark';
  }
}
