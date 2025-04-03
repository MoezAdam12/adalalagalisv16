import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../services/document.service';
import { Document, DocumentCategory, DocumentSearchParams, DocumentStatus } from '../../models/document.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-document-search',
  templateUrl: './document-search.component.html',
  styleUrls: ['./document-search.component.scss']
})
export class DocumentSearchComponent implements OnInit {
  searchForm: FormGroup;
  categories: DocumentCategory[] = [];
  searchResults: Document[] = [];
  isLoading = false;
  isSearching = false;
  hasSearched = false;
  error: string | null = null;
  displayedColumns: string[] = ['title', 'categoryName', 'uploadDate', 'status', 'actions'];
  
  // For date range picker
  maxDate = new Date();
  
  // For document status options
  documentStatuses = [
    { value: DocumentStatus.ACTIVE, label: 'DOCUMENTS.STATUS.ACTIVE' },
    { value: DocumentStatus.DRAFT, label: 'DOCUMENTS.STATUS.DRAFT' },
    { value: DocumentStatus.ARCHIVED, label: 'DOCUMENTS.STATUS.ARCHIVED' }
  ];
  
  // For file type options
  fileTypes = [
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/msword', label: 'DOC' },
    { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
    { value: 'application/vnd.ms-excel', label: 'XLS' },
    { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLSX' },
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/png', label: 'PNG' }
  ];

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      categoryId: [''],
      tags: [''],
      status: [''],
      dateFrom: [null],
      dateTo: [null],
      fileType: ['']
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

  onSubmit(): void {
    if (this.searchForm.invalid) {
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;
    this.searchResults = [];

    const searchParams: DocumentSearchParams = {
      query: this.searchForm.get('query')?.value,
      categoryId: this.searchForm.get('categoryId')?.value,
      tags: this.searchForm.get('tags')?.value ? 
        this.searchForm.get('tags')?.value.split(',').map((tag: string) => tag.trim()) : 
        undefined,
      status: this.searchForm.get('status')?.value,
      dateFrom: this.searchForm.get('dateFrom')?.value,
      dateTo: this.searchForm.get('dateTo')?.value,
      fileType: this.searchForm.get('fileType')?.value
    };

    this.documentService.searchDocuments(searchParams)
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isSearching = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isSearching = false;
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_SEARCHING'),
            'error'
          );
        }
      });
  }

  resetForm(): void {
    this.searchForm.reset();
    this.hasSearched = false;
    this.searchResults = [];
  }

  viewDocument(document: Document): void {
    this.router.navigate(['/documents', document.id]);
  }

  downloadDocument(document: Document, event: Event): void {
    event.stopPropagation();
    this.documentService.downloadDocument(document.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = document.fileName;
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
}
