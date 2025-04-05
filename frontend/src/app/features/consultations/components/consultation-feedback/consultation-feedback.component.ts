import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from '../../services/consultation.service';
import { ConsultationFeedback } from '../../models/consultation.model';

@Component({
  selector: 'app-consultation-feedback',
  templateUrl: './consultation-feedback.component.html',
  styleUrls: ['./consultation-feedback.component.scss']
})
export class ConsultationFeedbackComponent implements OnInit {
  consultationId: string | null = null;
  feedbackForm: FormGroup;
  
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  
  // For star rating
  maxRating = 5;
  ratingOptions = [1, 2, 3, 4, 5];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.feedbackForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comments: ['', Validators.maxLength(1000)]
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
          // Check if consultation exists and is completed
          if (!consultation) {
            this.error = this.translate.instant('CONSULTATIONS.CONSULTATION_NOT_FOUND');
            this.isLoading = false;
            return;
          }
          
          if (consultation.status !== 'completed') {
            this.error = this.translate.instant('CONSULTATIONS.FEEDBACK_ONLY_FOR_COMPLETED');
            this.isLoading = false;
            return;
          }
          
          // Check if feedback already exists
          this.consultationService.getConsultationFeedback(this.consultationId)
            .subscribe({
              next: (feedback) => {
                if (feedback && feedback.length > 0) {
                  // Feedback already exists, pre-fill form
                  const existingFeedback = feedback[0];
                  this.feedbackForm.patchValue({
                    rating: existingFeedback.rating,
                    comments: existingFeedback.comments
                  });
                }
                this.isLoading = false;
              },
              error: (error) => {
                this.error = error.message;
                this.isLoading = false;
              }
            });
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

  onSubmit(): void {
    if (this.feedbackForm.invalid || !this.consultationId) return;
    
    this.isSubmitting = true;
    
    const feedback: Partial<ConsultationFeedback> = {
      consultationId: this.consultationId,
      rating: this.feedbackForm.get('rating')?.value,
      comments: this.feedbackForm.get('comments')?.value,
      submittedBy: 'currentUserId' // In a real app, this would be the current user's ID
    };
    
    this.consultationService.submitFeedback(this.consultationId, feedback)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.FEEDBACK_SUBMITTED'),
            'success'
          );
          this.router.navigate(['/consultations', this.consultationId]);
        },
        error: (error) => {
          this.error = error.message;
          this.isSubmitting = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_SUBMITTING_FEEDBACK'),
            'error'
          );
        }
      });
  }

  setRating(rating: number): void {
    this.feedbackForm.get('rating')?.setValue(rating);
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
    this.router.navigate(['/consultations', this.consultationId]);
  }
}
