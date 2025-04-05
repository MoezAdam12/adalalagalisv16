import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../services/document.service';
import { DocumentShareSettings } from '../../models/document.model';

@Component({
  selector: 'app-document-share',
  templateUrl: './document-share.component.html',
  styleUrls: ['./document-share.component.scss']
})
export class DocumentShareComponent implements OnInit {
  shareForm: FormGroup;
  isLoading = false;
  shareableLink: string | null = null;
  copySuccess = false;

  constructor(
    private dialogRef: MatDialogRef<DocumentShareComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { documentId: string, documentTitle: string },
    private fb: FormBuilder,
    private documentService: DocumentService,
    private translate: TranslateService
  ) {
    this.shareForm = this.fb.group({
      expiryDate: [null],
      password: [''],
      allowDownload: [true],
      allowPrint: [true],
      recipientEmails: [''],
      message: ['']
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.shareForm.invalid) {
      return;
    }

    this.isLoading = true;

    const shareSettings: DocumentShareSettings = {
      documentId: this.data.documentId,
      expiryDate: this.shareForm.get('expiryDate')?.value,
      password: this.shareForm.get('password')?.value,
      allowDownload: this.shareForm.get('allowDownload')?.value,
      allowPrint: this.shareForm.get('allowPrint')?.value,
      recipientEmails: this.shareForm.get('recipientEmails')?.value ? 
        this.shareForm.get('recipientEmails')?.value.split(',').map((email: string) => email.trim()) : 
        undefined,
      message: this.shareForm.get('message')?.value
    };

    this.documentService.shareDocument(this.data.documentId, shareSettings)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.shareableLink = response.shareableLink;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error sharing document:', error);
        }
      });
  }

  copyLink(): void {
    if (this.shareableLink) {
      navigator.clipboard.writeText(this.shareableLink).then(() => {
        this.copySuccess = true;
        setTimeout(() => {
          this.copySuccess = false;
        }, 3000);
      });
    }
  }

  close(): void {
    this.dialogRef.close(this.shareableLink ? true : false);
  }
}
