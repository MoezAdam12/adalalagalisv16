import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Document, DocumentStatus } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';
import { DocumentShareComponent } from '../document-share/document-share.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit {
  document: Document | null = null;
  isLoading = true;
  error: string | null = null;
  isEditing = false;
  editForm: FormGroup;
  categories: any[] = [];
  isAnalyzing = false;
  analysisResult: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      categoryId: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocument();
    this.loadCategories();
  }

  loadDocument(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/documents']);
      return;
    }

    this.isLoading = true;
    this.documentService.getDocumentById(id)
      .subscribe({
        next: (document) => {
          this.document = document;
          this.isLoading = false;
          this.populateEditForm();
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_LOADING_DOCUMENT'),
            'error'
          );
        }
      });
  }

  loadCategories(): void {
    this.documentService.getDocumentCategories()
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  populateEditForm(): void {
    if (this.document) {
      this.editForm.patchValue({
        title: this.document.title,
        description: this.document.description || '',
        categoryId: this.document.categoryId || '',
        tags: this.document.tags ? this.document.tags.join(', ') : ''
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateEditForm();
    }
  }

  saveChanges(): void {
    if (this.editForm.invalid || !this.document) {
      return;
    }

    const updatedDocument = {
      title: this.editForm.get('title')?.value,
      description: this.editForm.get('description')?.value,
      categoryId: this.editForm.get('categoryId')?.value,
      tags: this.editForm.get('tags')?.value ? 
        this.editForm.get('tags')?.value.split(',').map((tag: string) => tag.trim()) : 
        []
    };

    this.documentService.updateDocument(this.document.id, updatedDocument)
      .subscribe({
        next: (document) => {
          this.document = document;
          this.isEditing = false;
          this.showNotification(
            this.translate.instant('DOCUMENTS.UPDATE_SUCCESS'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_UPDATING'),
            'error'
          );
        }
      });
  }

  downloadDocument(): void {
    if (!this.document) return;

    this.documentService.downloadDocument(this.document.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.document?.fileName || 'document';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_DOWNLOADING'),
            'error'
          );
        }
      });
  }

  shareDocument(): void {
    if (!this.document) return;

    const dialogRef = this.dialog.open(DocumentShareComponent, {
      width: '500px',
      data: { documentId: this.document.id, documentTitle: this.document.title }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showNotification(
          this.translate.instant('DOCUMENTS.SHARE_SUCCESS'),
          'success'
        );
      }
    });
  }

  deleteDocument(): void {
    if (!this.document) return;

    if (confirm(this.translate.instant('DOCUMENTS.CONFIRM_DELETE'))) {
      this.documentService.deleteDocument(this.document.id)
        .subscribe({
          next: () => {
            this.showNotification(
              this.translate.instant('DOCUMENTS.DELETE_SUCCESS'),
              'success'
            );
            this.router.navigate(['/documents']);
          },
          error: (error) => {
            this.showNotification(
              this.translate.instant('DOCUMENTS.ERROR_DELETING'),
              'error'
            );
          }
        });
    }
  }

  viewVersions(): void {
    if (!this.document) return;
    this.router.navigate(['/documents', this.document.id, 'versions']);
  }

  analyzeDocument(): void {
    if (!this.document) return;

    this.isAnalyzing = true;
    this.analysisResult = null;

    this.documentService.analyzeDocument(this.document.id)
      .subscribe({
        next: (result) => {
          this.analysisResult = result;
          this.isAnalyzing = false;
        },
        error: (error) => {
          this.isAnalyzing = false;
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_ANALYZING'),
            'error'
          );
        }
      });
  }

  getStatusClass(status: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.ACTIVE:
        return 'status-active';
      case DocumentStatus.DRAFT:
        return 'status-draft';
      case DocumentStatus.ARCHIVED:
        return 'status-archived';
      case DocumentStatus.DELETED:
        return 'status-deleted';
      default:
        return '';
    }
  }

  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    });
  }

  goBack(): void {
    this.router.navigate(['/documents']);
  }
}
