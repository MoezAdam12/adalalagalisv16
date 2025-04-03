import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { 
  Consultation, 
  ConsultationType, 
  ConsultationStatus, 
  ConsultationMode, 
  ConsultationPriority,
  ConsultationFilter
} from '../../models/consultation.model';
import { ConsultationService } from '../../services/consultation.service';

@Component({
  selector: 'app-consultation-list',
  templateUrl: './consultation-list.component.html',
  styleUrls: ['./consultation-list.component.scss']
})
export class ConsultationListComponent implements OnInit {
  consultations: Consultation[] = [];
  dataSource = new MatTableDataSource<Consultation>([]);
  displayedColumns: string[] = [
    'title', 
    'clientName', 
    'attorneyName', 
    'type', 
    'status', 
    'mode', 
    'priority', 
    'scheduledDate', 
    'actions'
  ];
  
  isLoading = true;
  error: string | null = null;
  
  filterForm: FormGroup;
  
  // Enums for dropdowns
  consultationTypes = Object.values(ConsultationType);
  consultationStatuses = Object.values(ConsultationStatus);
  consultationModes = Object.values(ConsultationMode);
  consultationPriorities = Object.values(ConsultationPriority);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private consultationService: ConsultationService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      searchText: [''],
      type: [''],
      status: [''],
      mode: [''],
      priority: [''],
      startDate: [null],
      endDate: [null],
      isPaid: [''],
      followUpRequired: ['']
    });
  }

  ngOnInit(): void {
    this.loadConsultations();
    
    // Subscribe to filter form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadConsultations(): void {
    this.isLoading = true;
    this.consultationService.getAllConsultations()
      .subscribe({
        next: (consultations) => {
          this.consultations = consultations;
          this.dataSource.data = consultations;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_LOADING'),
            'error'
          );
        }
      });
  }

  applyFilter(): void {
    const formValues = this.filterForm.value;
    
    // Create filter object from form values
    const filter: ConsultationFilter = {};
    
    if (formValues.searchText) filter.searchText = formValues.searchText;
    if (formValues.type) filter.type = formValues.type;
    if (formValues.status) filter.status = formValues.status;
    if (formValues.mode) filter.mode = formValues.mode;
    if (formValues.priority) filter.priority = formValues.priority;
    if (formValues.startDate) filter.startDate = formValues.startDate;
    if (formValues.endDate) filter.endDate = formValues.endDate;
    if (formValues.isPaid !== '') filter.isPaid = formValues.isPaid === 'true';
    if (formValues.followUpRequired !== '') filter.followUpRequired = formValues.followUpRequired === 'true';
    
    this.isLoading = true;
    this.consultationService.getAllConsultations(filter)
      .subscribe({
        next: (consultations) => {
          this.consultations = consultations;
          this.dataSource.data = consultations;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('CONSULTATIONS.ERROR_FILTERING'),
            'error'
          );
        }
      });
  }

  resetFilters(): void {
    this.filterForm.reset({
      searchText: '',
      type: '',
      status: '',
      mode: '',
      priority: '',
      startDate: null,
      endDate: null,
      isPaid: '',
      followUpRequired: ''
    });
    this.loadConsultations();
  }

  viewConsultation(id: string): void {
    this.router.navigate(['/consultations', id]);
  }

  createConsultation(): void {
    this.router.navigate(['/consultations/create']);
  }

  viewCalendar(): void {
    this.router.navigate(['/consultations/calendar']);
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

  getPriorityClass(priority: ConsultationPriority): string {
    switch (priority) {
      case ConsultationPriority.LOW:
        return 'priority-low';
      case ConsultationPriority.MEDIUM:
        return 'priority-medium';
      case ConsultationPriority.HIGH:
        return 'priority-high';
      case ConsultationPriority.URGENT:
        return 'priority-urgent';
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
