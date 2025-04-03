import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CalendarService } from '../../services/calendar.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss']
})
export class EventFormComponent implements OnInit {
  eventForm!: FormGroup;
  isLoading = false;
  isEdit = false;
  eventTypes = [
    { value: 'court_session', label: 'CALENDAR.EVENT_TYPES.COURT_SESSION' },
    { value: 'consultation', label: 'CALENDAR.EVENT_TYPES.CONSULTATION' },
    { value: 'deadline', label: 'CALENDAR.EVENT_TYPES.DEADLINE' },
    { value: 'reminder', label: 'CALENDAR.EVENT_TYPES.REMINDER' },
    { value: 'meeting', label: 'CALENDAR.EVENT_TYPES.MEETING' }
  ];

  constructor(
    private fb: FormBuilder,
    private calendarService: CalendarService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.createForm();
    
    if (this.data) {
      if (this.data.id) {
        this.isEdit = true;
        this.loadEvent(this.data.id);
      } else if (this.data.start) {
        // New event with pre-selected date/time
        this.eventForm.patchValue({
          startDateTime: this.data.start,
          endDateTime: this.data.end,
          allDay: this.data.allDay
        });
      }
    }
  }

  createForm() {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required]],
      type: ['meeting', [Validators.required]],
      startDateTime: ['', [Validators.required]],
      endDateTime: ['', [Validators.required]],
      allDay: [false],
      description: [''],
      location: [''],
      relatedType: [''],
      relatedId: ['']
    });
  }

  loadEvent(id: string) {
    this.isLoading = true;
    this.calendarService.getEventById(id).subscribe({
      next: (response) => {
        const event = response.data;
        this.eventForm.patchValue({
          title: event.title,
          type: event.type,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          allDay: event.allDay,
          description: event.description,
          location: event.location,
          relatedType: event.relatedType,
          relatedId: event.relatedId
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.showErrorMessage();
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      return;
    }

    this.isLoading = true;
    const eventData = this.eventForm.value;

    if (this.isEdit) {
      this.calendarService.updateEvent(this.data.id, eventData).subscribe({
        next: () => {
          this.showSuccessMessage('CALENDAR.EVENT_UPDATED');
          this.dialogRef.close(true);
          this.isLoading = false;
        },
        error: (error) => {
          this.showErrorMessage();
          this.isLoading = false;
        }
      });
    } else {
      this.calendarService.createEvent(eventData).subscribe({
        next: () => {
          this.showSuccessMessage('CALENDAR.EVENT_CREATED');
          this.dialogRef.close(true);
          this.isLoading = false;
        },
        error: (error) => {
          this.showErrorMessage();
          this.isLoading = false;
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  showSuccessMessage(key: string) {
    const message = this.translate.instant(key);
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  showErrorMessage() {
    const message = this.translate.instant('COMMON.ERROR_OCCURRED');
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
