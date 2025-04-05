import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Document, DocumentStatus } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';
import { DocumentShareComponent } from '../document-share/document-share.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss']
})
export class DocumentListComponent implements OnInit {
  documents: Document[] = [];
  dataSource: MatTableDataSource<Document>;
  displayedColumns: string[] = ['title', 'categoryName', 'fileType', 'uploadDate', 'status', 'actions'];
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private documentService: DocumentService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Document>([]);
  }

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.documentService.getAllDocuments()
      .subscribe({
        next: (data) => {
          this.documents = data;
          this.dataSource.data = this.documents;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('DOCUMENTS.ERROR_LOADING'),
            'error'
          );
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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

  shareDocument(document: Document, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DocumentShareComponent, {
      width: '500px',
      data: { documentId: document.id, documentTitle: document.title }
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

  deleteDocument(document: Document, event: Event): void {
    event.stopPropagation();
    if (confirm(this.translate.instant('DOCUMENTS.CONFIRM_DELETE'))) {
      this.documentService.deleteDocument(document.id)
        .subscribe({
          next: () => {
            this.loadDocuments();
            this.showNotification(
              this.translate.instant('DOCUMENTS.DELETE_SUCCESS'),
              'success'
            );
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

  uploadNewDocument(): void {
    this.router.navigate(['/documents/upload']);
  }

  refreshDocuments(): void {
    this.loadDocuments();
  }
}
