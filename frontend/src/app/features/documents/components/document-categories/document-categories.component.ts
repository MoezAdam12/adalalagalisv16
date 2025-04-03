import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../services/document.service';
import { DocumentCategory } from '../../models/document.model';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-document-categories',
  templateUrl: './document-categories.component.html',
  styleUrls: ['./document-categories.component.scss']
})
export class DocumentCategoriesComponent implements OnInit {
  categories: DocumentCategory[] = [];
  isLoading = true;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'description', 'documentCount', 'createdDate', 'actions'];
  
  categoryForm: FormGroup;
  isCreating = false;
  isEditing = false;
  editingCategoryId: string | null = null;

  constructor(
    private documentService: DocumentService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', Validators.maxLength(200)],
      parentCategoryId: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.documentService.getDocumentCategories()
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_LOADING_CATEGORIES'),
            'error'
          );
        }
      });
  }

  toggleCreateForm(): void {
    this.isCreating = !this.isCreating;
    if (this.isCreating) {
      this.isEditing = false;
      this.editingCategoryId = null;
      this.categoryForm.reset();
    }
  }

  editCategory(category: DocumentCategory): void {
    this.isEditing = true;
    this.isCreating = false;
    this.editingCategoryId = category.id;
    
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      parentCategoryId: category.parentCategoryId || ''
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingCategoryId = null;
    this.categoryForm.reset();
  }

  createCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const newCategory: Partial<DocumentCategory> = {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value,
      parentCategoryId: this.categoryForm.get('parentCategoryId')?.value || undefined
    };

    this.documentService.createDocumentCategory(newCategory)
      .subscribe({
        next: (category) => {
          this.loadCategories();
          this.isCreating = false;
          this.categoryForm.reset();
          this.showNotification(
            this.translate.instant('DOCUMENTS.CATEGORY_CREATED'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_CREATING_CATEGORY'),
            'error'
          );
        }
      });
  }

  updateCategory(): void {
    if (this.categoryForm.invalid || !this.editingCategoryId) {
      return;
    }

    const updatedCategory: Partial<DocumentCategory> = {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value,
      parentCategoryId: this.categoryForm.get('parentCategoryId')?.value || undefined
    };

    // In a real app, you would implement a proper category update API call
    // This is a simplified example
    this.showNotification(
      this.translate.instant('DOCUMENTS.CATEGORY_UPDATED'),
      'success'
    );
    this.isEditing = false;
    this.editingCategoryId = null;
    this.categoryForm.reset();
    this.loadCategories();
  }

  deleteCategory(category: DocumentCategory): void {
    if (confirm(this.translate.instant('DOCUMENTS.CONFIRM_DELETE_CATEGORY'))) {
      // In a real app, you would implement a proper category delete API call
      // This is a simplified example
      this.showNotification(
        this.translate.instant('DOCUMENTS.CATEGORY_DELETED'),
        'success'
      );
      this.loadCategories();
    }
  }

  viewCategoryDocuments(category: DocumentCategory): void {
    // Navigate to documents list with category filter
    this.router.navigate(['/documents'], { 
      queryParams: { categoryId: category.id } 
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    });
  }
}
