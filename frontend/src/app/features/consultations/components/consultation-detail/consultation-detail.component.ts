import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultationService } from '../../services/consultation.service';
import { 
  Consultation, 
  ConsultationStatus, 
  ConsultationNote, 
  ConsultationAttachment,
  ConsultationFeedback
} from '../../models/consultation.model';

@Component({
  selector: 'app-consultation-detail',
  templateUrl: './consultation-detail.component.html',
  styleUrls: ['./consultation-detail.component.scss']
})
export class ConsultationDetailComponent implements OnInit {
  consultationId: string | null = null;
  consultation: Consultation | null = null;
  notes: ConsultationNote[] = [];
  attachments: ConsultationAttachment[] = [];
  feedback: ConsultationFeedback[] = [];
  
  isLoading = true;
  isNotesLoading = false;
  isAttachmentsLoading = false;
  isFeedbackLoading = false;
  error: string | null = null;
  
  noteForm: FormGroup;
  isSubmittingNote = false;
  
  // For consultation status options
  consultationStatuses = Object.values(ConsultationStatus);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.noteForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]],
      isPrivate: [false]
    });
  }

  ngOnInit(): void {
    this.consultationId = this.route.snapshot.paramMap.get('id');
    if (!this.consultationId) {
      this.router.navigate(['/consultations']);
      return;
    }
    
    this.loadConsultation();
  }

  loadConsultation(): void {
    if (!this.consultationId) return;
    
    this.isLoading = true;
    this.consultationService.getConsultationById(this.consultationId)
      .subscribe({
        next: (consultation) => {
          this.consultation = consultation;
          this.isLoading = false;
          this.loadNotes();
          this.loadAttachments();
          this.loadFeedback();
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_LOADING_CONSULTATION'),
            'error'
          );
        }
      });
  }

  loadNotes(): void {
    if (!this.consultationId) return;
    
    this.isNotesLoading = true;
    this.consultationService.getConsultationNotes(this.consultationId)
      .subscribe({
        next: (notes) => {
          this.notes = notes;
          this.isNotesLoading = false;
        },
        error: (error) => {
          this.isNotesLoading = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_LOADING_NOTES'),
            'error'
          );
        }
      });
  }

  loadAttachments(): void {
    if (!this.consultationId) return;
    
    this.isAttachmentsLoading = true;
    this.consultationService.getConsultationAttachments(this.consultationId)
      .subscribe({
        next: (attachments) => {
          this.attachments = attachments;
          this.isAttachmentsLoading = false;
        },
        error: (error) => {
          this.isAttachmentsLoading = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_LOADING_ATTACHMENTS'),
            'error'
          );
        }
      });
  }

  loadFeedback(): void {
    if (!this.consultationId) return;
    
    this.isFeedbackLoading = true;
    this.consultationService.getConsultationFeedback(this.consultationId)
      .subscribe({
        next: (feedback) => {
          this.feedback = feedback;
          this.isFeedbackLoading = false;
        },
        error: (error) => {
          this.isFeedbackLoading = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_LOADING_FEEDBACK'),
            'error'
          );
        }
      });
  }

  updateConsultationStatus(status: ConsultationStatus): void {
    if (!this.consultationId || !this.consultation) return;
    
    this.consultationService.updateConsultationStatus(this.consultationId, status)
      .subscribe({
        next: (updatedConsultation) => {
          this.consultation = updatedConsultation;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.STATUS_UPDATED'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_UPDATING_STATUS'),
            'error'
          );
        }
      });
  }

  startConsultation(): void {
    if (!this.consultationId || !this.consultation) return;
    
    this.consultationService.startConsultation(this.consultationId)
      .subscribe({
        next: (updatedConsultation) => {
          this.consultation = updatedConsultation;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.STARTED_SUCCESS'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_STARTING'),
            'error'
          );
        }
      });
  }

  completeConsultation(): void {
    if (!this.consultationId || !this.consultation) return;
    
    // In a real app, you might want to open a dialog to collect summary
    const summary = prompt(this.translate.instant('CONSULTATIONS.ENTER_SUMMARY'));
    
    this.consultationService.completeConsultation(this.consultationId, summary || undefined)
      .subscribe({
        next: (updatedConsultation) => {
          this.consultation = updatedConsultation;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.COMPLETED_SUCCESS'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_COMPLETING'),
            'error'
          );
        }
      });
  }

  cancelConsultation(): void {
    if (!this.consultationId || !this.consultation) return;
    
    // In a real app, you might want to open a dialog to collect reason
    const reason = prompt(this.translate.instant('CONSULTATIONS.ENTER_CANCEL_REASON'));
    
    this.consultationService.cancelConsultation(this.consultationId, reason || undefined)
      .subscribe({
        next: (updatedConsultation) => {
          this.consultation = updatedConsultation;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.CANCELLED_SUCCESS'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_CANCELLING'),
            'error'
          );
        }
      });
  }

  rescheduleConsultation(): void {
    if (!this.consultationId || !this.consultation) return;
    
    // In a real app, you might want to open a dialog with a date picker
    const dateStr = prompt(this.translate.instant('CONSULTATIONS.ENTER_NEW_DATE'));
    if (!dateStr) return;
    
    const newDate = new Date(dateStr);
    if (isNaN(newDate.getTime())) {
      this.showNotification(
        this.translate.instant('CONSULTATIONS.INVALID_DATE'),
        'error'
      );
      return;
    }
    
    const reason = prompt(this.translate.instant('CONSULTATIONS.ENTER_RESCHEDULE_REASON'));
    
    this.consultationService.rescheduleConsultation(this.consultationId, newDate, reason || undefined)
      .subscribe({
        next: (updatedConsultation) => {
          this.consultation = updatedConsultation;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.RESCHEDULED_SUCCESS'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_RESCHEDULING'),
            'error'
          );
        }
      });
  }

  addNote(): void {
    if (!this.consultationId || this.noteForm.invalid) return;
    
    this.isSubmittingNote = true;
    
    const newNote: Partial<ConsultationNote> = {
      consultationId: this.consultationId,
      content: this.noteForm.get('content')?.value,
      isPrivate: this.noteForm.get('isPrivate')?.value,
      createdBy: 'currentUserId' // In a real app, this would be the current user's ID
    };
    
    this.consultationService.addConsultationNote(this.consultationId, newNote)
      .subscribe({
        next: (note) => {
          this.notes.unshift(note);
          this.noteForm.reset({ isPrivate: false });
          this.isSubmittingNote = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.NOTE_ADDED'),
            'success'
          );
        },
        error: (error) => {
          this.isSubmittingNote = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_ADDING_NOTE'),
            'error'
          );
        }
      });
  }

  uploadAttachment(event: Event): void {
    if (!this.consultationId) return;
    
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const description = prompt(this.translate.instant('CONSULTATIONS.ENTER_ATTACHMENT_DESCRIPTION'));
    const isPrivate = confirm(this.translate.instant('CONSULTATIONS.IS_ATTACHMENT_PRIVATE'));
    
    this.consultationService.uploadAttachment(this.consultationId, file, description || undefined, isPrivate)
      .subscribe({
        next: (attachment) => {
          this.attachments.unshift(attachment);
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ATTACHMENT_UPLOADED'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_UPLOADING_ATTACHMENT'),
            'error'
          );
        }
      });
  }

  downloadAttachment(attachment: ConsultationAttachment): void {
    if (!this.consultationId) return;
    
    this.consultationService.downloadAttachment(this.consultationId, attachment.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = attachment.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_DOWNLOADING_ATTACHMENT'),
            'error'
          );
        }
      });
  }

  deleteConsultation(): void {
    if (!this.consultationId) return;
    
    if (confirm(this.translate.instant('CONSULTATIONS.CONFIRM_DELETE'))) {
      this.consultationService.deleteConsultation(this.consultationId)
        .subscribe({
          next: () => {
            this.showNotification(
              this.translate.instant('CONSULTATIONS.DELETE_SUCCESS'),
              'success'
            );
            this.router.navigate(['/consultations']);
          },
          error: (error) => {
            this.showNotification(
              this.translate.instant('CONSULTATIONS.ERROR_DELETING'),
              'error'
            );
          }
        });
    }
  }

  getStatusClass(status: ConsultationStatus): string {
    switch (status) {
      case ConsultationStatus.SCHEDULED:
        return 'status-scheduled';
      case ConsultationStatus.IN_PROGRESS:
        return 'status-in-progress';
      case ConsultationStatus.COMPLETED:
        return 'status-completed';
      case ConsultationStatus.CANCELLED:
        return 'status-cancelled';
      case ConsultationStatus.RESCHEDULED:
        return 'status-rescheduled';
      case ConsultationStatus.NO_SHOW:
        return 'status-no-show';
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
    this.router.navigate(['/consultations']);
  }

  goToFeedback(): void {
    this.router.navigate(['/consultations', this.consultationId, 'feedback']);
  }
}
