import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentService } from '../../services/document.service';
import { DocumentCategory } from '../../models/document.model';

@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss']
})
export class DocumentUploadComponent implements OnInit {
  uploadForm: FormGroup;
  categories: DocumentCategory[] = [];
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  filePreview: string | ArrayBuffer | null = null;
  isImageFile = false;
  isPdfFile = false;

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private router: Router,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      categoryId: [''],
      tags: [''],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.documentService.getDocumentCategories()
      .subscribe({
        next: (data) => {
          this.categories = data;
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_LOADING_CATEGORIES'),
            'error'
          );
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      
      // Auto-fill title with filename (without extension)
      const fileName = this.selectedFile.name;
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      this.uploadForm.patchValue({
        title: fileNameWithoutExt
      });

      // Create file preview
      this.createFilePreview(this.selectedFile);
    }
  }

  createFilePreview(file: File): void {
    this.isImageFile = file.type.startsWith('image/');
    this.isPdfFile = file.type === 'application/pdf';
    
    if (this.isImageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.filePreview = null;
    }
  }

  onSubmit(): void {
    if (this.uploadForm.invalid || !this.selectedFile) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('title', this.uploadForm.get('title')?.value);
    formData.append('description', this.uploadForm.get('description')?.value);
    
    if (this.uploadForm.get('categoryId')?.value) {
      formData.append('categoryId', this.uploadForm.get('categoryId')?.value);
    }
    
    if (this.uploadForm.get('tags')?.value) {
      const tags = this.uploadForm.get('tags')?.value.split(',').map((tag: string) => tag.trim());
      tags.forEach((tag: string) => {
        if (tag) formData.append('tags', tag);
      });
    }
    
    formData.append('file', this.selectedFile);

    // Simulate upload progress (in a real app, you'd use HttpClient's reportProgress option)
    const progressInterval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 300);

    this.documentService.createDocument(formData)
      .subscribe({
        next: (document) => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;
          this.isUploading = false;
          
          this.showNotification(
            this.translate.instant('DOCUMENTS.UPLOAD_SUCCESS'),
            'success'
          );
          
          // Navigate to the document detail page
          setTimeout(() => {
            this.router.navigate(['/documents', document.id]);
          }, 1000);
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isUploading = false;
          this.uploadProgress = 0;
          
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_UPLOADING'),
            'error'
          );
        }
      });
  }

  cancelUpload(): void {
    this.router.navigate(['/documents']);
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
