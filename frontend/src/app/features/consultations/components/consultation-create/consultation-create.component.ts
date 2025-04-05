import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from '../../services/consultation.service';
import { 
  Consultation, 
  ConsultationType, 
  ConsultationStatus, 
  ConsultationMode, 
  ConsultationPriority 
} from '../../models/consultation.model';

@Component({
  selector: 'app-consultation-create',
  templateUrl: './consultation-create.component.html',
  styleUrls: ['./consultation-create.component.scss']
})
export class ConsultationCreateComponent implements OnInit {
  consultationForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  
  // Enums for dropdowns
  consultationTypes = Object.values(ConsultationType);
  consultationModes = Object.values(ConsultationMode);
  consultationPriorities = Object.values(ConsultationPriority);
  
  // Mock clients list - in a real app, this would come from a client service
  clients = [
    { id: 'client1', name: 'Ahmed Corporation', contactPerson: 'Ahmed Ali' },
    { id: 'client2', name: 'Fatima Legal Services', contactPerson: 'Fatima Hassan' },
    { id: 'client3', name: 'Ibrahim Holdings', contactPerson: 'Mohammed Ibrahim' },
    { id: 'client4', name: 'Sara International', contactPerson: 'Sara Ahmed' },
    { id: 'client5', name: 'Khalid Enterprises', contactPerson: 'Khalid Omar' },
    { id: 'client6', name: 'Layla Investments', contactPerson: 'Layla Mahmoud' }
  ];
  
  // Mock attorneys list - in a real app, this would come from a user service
  attorneys = [
    { id: 'user1', name: 'Ahmed Ali', role: 'Attorney', specialization: 'Corporate Law' },
    { id: 'user4', name: 'Sara Ahmed', role: 'Attorney', specialization: 'Corporate Law' },
    { id: 'user5', name: 'Khalid Omar', role: 'Attorney', specialization: 'Litigation' },
    { id: 'user7', name: 'Noor Saleh', role: 'Attorney', specialization: 'Real Estate' },
    { id: 'user8', name: 'Omar Youssef', role: 'Attorney', specialization: 'Intellectual Property' }
  ];

  constructor(
    private fb: FormBuilder,
    private consultationService: ConsultationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.consultationForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(1000)],
      clientId: ['', Validators.required],
      attorneyId: [''],
      type: [ConsultationType.INITIAL, Validators.required],
      mode: [ConsultationMode.IN_PERSON, Validators.required],
      priority: [ConsultationPriority.MEDIUM, Validators.required],
      scheduledDate: [null, Validators.required],
      duration: [60, [Validators.required, Validators.min(15), Validators.max(480)]],
      location: [''],
      meetingLink: [''],
      phoneNumber: [''],
      fee: [null, [Validators.min(0)]],
      currency: ['SAR'],
      notes: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    // Additional initialization if needed
  }

  onSubmit(): void {
    if (this.consultationForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    
    // Prepare tags array from comma-separated string
    const tagsString = this.consultationForm.get('tags')?.value;
    const tags = tagsString ? tagsString.split(',').map((tag: string) => tag.trim()) : [];
    
    // Get client name from selected client
    const clientId = this.consultationForm.get('clientId')?.value;
    const client = this.clients.find(c => c.id === clientId);
    const clientName = client ? client.name : '';
    
    // Get attorney name from selected attorney
    const attorneyId = this.consultationForm.get('attorneyId')?.value;
    let attorneyName = undefined;
    if (attorneyId) {
      const attorney = this.attorneys.find(a => a.id === attorneyId);
      attorneyName = attorney ? attorney.name : undefined;
    }
    
    const newConsultation: Partial<Consultation> = {
      title: this.consultationForm.get('title')?.value,
      description: this.consultationForm.get('description')?.value,
      clientId: clientId,
      clientName: clientName,
      attorneyId: attorneyId || undefined,
      attorneyName: attorneyName,
      type: this.consultationForm.get('type')?.value,
      status: ConsultationStatus.SCHEDULED, // Default status for new consultations
      mode: this.consultationForm.get('mode')?.value,
      priority: this.consultationForm.get('priority')?.value,
      scheduledDate: this.consultationForm.get('scheduledDate')?.value,
      duration: this.consultationForm.get('duration')?.value,
      location: this.consultationForm.get('location')?.value || undefined,
      meetingLink: this.consultationForm.get('meetingLink')?.value || undefined,
      phoneNumber: this.consultationForm.get('phoneNumber')?.value || undefined,
      fee: this.consultationForm.get('fee')?.value || undefined,
      currency: this.consultationForm.get('currency')?.value || undefined,
      notes: this.consultationForm.get('notes')?.value || undefined,
      tags: tags.length > 0 ? tags : undefined,
      createdBy: 'currentUserId', // In a real app, this would be the current user's ID
      tenantId: 'currentTenantId' // In a real app, this would be the current tenant's ID
    };

    this.consultationService.createConsultation(newConsultation)
      .subscribe({
        next: (createdConsultation) => {
          this.isSubmitting = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.CREATE_SUCCESS'),
            'success'
          );
          this.router.navigate(['/consultations', createdConsultation.id]);
        },
        error: (error) => {
          this.error = error.message;
          this.isSubmitting = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_CREATING'),
            'error'
          );
        }
      });
  }

  resetForm(): void {
    this.consultationForm.reset({
      type: ConsultationType.INITIAL,
      mode: ConsultationMode.IN_PERSON,
      priority: ConsultationPriority.MEDIUM,
      duration: 60,
      currency: 'SAR'
    });
  }

  updateLocationFields(): void {
    const mode = this.consultationForm.get('mode')?.value;
    
    // Clear fields that are not relevant to the selected mode
    if (mode === ConsultationMode.IN_PERSON) {
      this.consultationForm.get('meetingLink')?.setValue('');
      this.consultationForm.get('phoneNumber')?.setValue('');
    } else if (mode === ConsultationMode.VIDEO) {
      this.consultationForm.get('location')?.setValue('');
      this.consultationForm.get('phoneNumber')?.setValue('');
    } else if (mode === ConsultationMode.PHONE) {
      this.consultationForm.get('location')?.setValue('');
      this.consultationForm.get('meetingLink')?.setValue('');
    } else if (mode === ConsultationMode.EMAIL || mode === ConsultationMode.CHAT) {
      this.consultationForm.get('location')?.setValue('');
      this.consultationForm.get('meetingLink')?.setValue('');
      this.consultationForm.get('phoneNumber')?.setValue('');
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
}
