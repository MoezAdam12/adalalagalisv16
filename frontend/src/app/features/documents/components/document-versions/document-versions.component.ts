import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../services/document.service';
import { DocumentVersion } from '../../models/document.model';

@Component({
  selector: 'app-document-versions',
  templateUrl: './document-versions.component.html',
  styleUrls: ['./document-versions.component.scss']
})
export class DocumentVersionsComponent implements OnInit {
  documentId: string | null = null;
  documentTitle: string = '';
  versions: DocumentVersion[] = [];
  isLoading = true;
  error: string | null = null;
  displayedColumns: string[] = ['versionNumber', 'uploadDate', 'createdBy', 'fileSize', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.documentId = this.route.snapshot.paramMap.get('id');
    if (!this.documentId) {
      this.router.navigate(['/documents']);
      return;
    }

    this.loadDocumentInfo();
    this.loadVersions();
  }

  loadDocumentInfo(): void {
    if (!this.documentId) return;

    this.documentService.getDocumentById(this.documentId)
      .subscribe({
        next: (document) => {
          this.documentTitle = document.title;
        },
        error: (error) => {
          console.error('Error loading document info:', error);
        }
      });
  }

  loadVersions(): void {
    if (!this.documentId) return;

    this.isLoading = true;
    this.documentService.getDocumentVersions(this.documentId)
      .subscribe({
        next: (versions) => {
          this.versions = versions;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_LOADING_VERSIONS'),
            'error'
          );
        }
      });
  }

  viewVersion(version: DocumentVersion): void {
    if (!this.documentId) return;
    
    this.documentService.getDocumentVersion(this.documentId, version.id)
      .subscribe({
        next: (versionDetail) => {
          // In a real app, you might open a dialog or navigate to a version detail page
          console.log('Version details:', versionDetail);
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_LOADING_VERSION'),
            'error'
          );
        }
      });
  }

  downloadVersion(version: DocumentVersion, event: Event): void {
    event.stopPropagation();
    if (!version.downloadUrl) {
      this.showNotification(
        this.translate.instant('DOCUMENTS.NO_DOWNLOAD_URL'),
        'error'
      );
      return;
    }

    // In a real app, you would implement a proper download mechanism
    // This is a simplified example
    window.open(version.downloadUrl, '_blank');
  }

  restoreVersion(version: DocumentVersion, event: Event): void {
    event.stopPropagation();
    if (!this.documentId) return;

    if (confirm(this.translate.instant('DOCUMENTS.CONFIRM_RESTORE_VERSION'))) {
      // In a real app, you would implement a proper version restore API call
      // This is a simplified example
      this.showNotification(
        this.translate.instant('DOCUMENTS.VERSION_RESTORED'),
        'success'
      );
      this.router.navigate(['/documents', this.documentId]);
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
    if (this.documentId) {
      this.router.navigate(['/documents', this.documentId]);
    } else {
      this.router.navigate(['/documents']);
    }
  }
}
