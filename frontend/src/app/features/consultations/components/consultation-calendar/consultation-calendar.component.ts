import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ConsultationService } from '../../services/consultation.service';
import { 
  Consultation, 
  ConsultationStatus,
  ConsultationType,
  ConsultationMode,
  ConsultationPriority
} from '../../models/consultation.model';

@Component({
  selector: 'app-consultation-calendar',
  templateUrl: './consultation-calendar.component.html',
  styleUrls: ['./consultation-calendar.component.scss']
})
export class ConsultationCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  
  consultations: Consultation[] = [];
  calendarEvents: EventInput[] = [];
  
  isLoading = true;
  error: string | null = null;
  
  filterForm: FormGroup;
  
  // Calendar options
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    slotDuration: '00:30:00',
    height: 'auto'
  };
  
  // Enums for dropdowns
  consultationTypes = Object.values(ConsultationType);
  consultationStatuses = Object.values(ConsultationStatus);
  consultationModes = Object.values(ConsultationMode);
  
  // Mock attorneys list - in a real app, this would come from a user service
  attorneys = [
    { id: 'user1', name: 'Ahmed Ali', role: 'Attorney', specialization: 'Corporate Law' },
    { id: 'user4', name: 'Sara Ahmed', role: 'Attorney', specialization: 'Corporate Law' },
    { id: 'user5', name: 'Khalid Omar', role: 'Attorney', specialization: 'Litigation' },
    { id: 'user7', name: 'Noor Saleh', role: 'Attorney', specialization: 'Real Estate' },
    { id: 'user8', name: 'Omar Youssef', role: 'Attorney', specialization: 'Intellectual Property' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      attorneyId: [''],
      type: [''],
      status: [''],
      mode: ['']
    });
  }

  ngOnInit(): void {
    this.loadConsultations();
    
    // Subscribe to filter form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  loadConsultations(): void {
    this.isLoading = true;
    this.consultationService.getAllConsultations()
      .subscribe({
        next: (consultations) => {
          this.consultations = consultations;
          this.convertConsultationsToEvents();
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

  convertConsultationsToEvents(): void {
    this.calendarEvents = this.consultations.map(consultation => {
      const startDate = new Date(consultation.scheduledDate);
      const endDate = new Date(startDate.getTime() + (consultation.duration * 60 * 1000));
      
      let backgroundColor;
      switch (consultation.status) {
        case ConsultationStatus.SCHEDULED:
          backgroundColor = '#1976d2'; // Blue
          break;
        case ConsultationStatus.IN_PROGRESS:
          backgroundColor = '#43a047'; // Green
          break;
        case ConsultationStatus.COMPLETED:
          backgroundColor = '#388e3c'; // Dark Green
          break;
        case ConsultationStatus.CANCELLED:
          backgroundColor = '#9e9e9e'; // Grey
          break;
        case ConsultationStatus.RESCHEDULED:
          backgroundColor = '#ff9800'; // Orange
          break;
        case ConsultationStatus.NO_SHOW:
          backgroundColor = '#e53935'; // Red
          break;
        default:
          backgroundColor = '#1976d2'; // Default Blue
      }
      
      return {
        id: consultation.id,
        title: consultation.title,
        start: startDate,
        end: endDate,
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        extendedProps: {
          clientName: consultation.clientName,
          attorneyName: consultation.attorneyName,
          type: consultation.type,
          status: consultation.status,
          mode: consultation.mode,
          priority: consultation.priority
        }
      };
    });
    
    // Update calendar events
    this.calendarOptions.events = this.calendarEvents;
  }

  applyFilter(): void {
    const formValues = this.filterForm.value;
    
    const filteredEvents = this.calendarEvents.filter(event => {
      const extendedProps = (event as any).extendedProps;
      
      if (formValues.attorneyId && extendedProps.attorneyId !== formValues.attorneyId) {
        return false;
      }
      
      if (formValues.type && extendedProps.type !== formValues.type) {
        return false;
      }
      
      if (formValues.status && extendedProps.status !== formValues.status) {
        return false;
      }
      
      if (formValues.mode && extendedProps.mode !== formValues.mode) {
        return false;
      }
      
      return true;
    });
    
    // Update calendar events
    this.calendarOptions.events = filteredEvents;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.calendarOptions.events = this.calendarEvents;
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    // Navigate to create consultation page with pre-filled date
    const startDate = selectInfo.start;
    this.router.navigate(['/consultations/create'], {
      queryParams: { scheduledDate: startDate.toISOString() }
    });
  }

  handleEventClick(clickInfo: EventClickArg): void {
    // Navigate to consultation detail page
    this.router.navigate(['/consultations', clickInfo.event.id]);
  }

  createConsultation(): void {
    this.router.navigate(['/consultations/create']);
  }

  viewList(): void {
    this.router.navigate(['/consultations']);
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
