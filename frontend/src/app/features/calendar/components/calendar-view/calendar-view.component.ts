import { Component, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions, EventApi } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CalendarService } from '../../services/calendar.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventFormComponent } from '../event-form/event-form.component';

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
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
    events: [],
    eventClick: this.handleEventClick.bind(this),
    select: this.handleDateSelect.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this)
  };
  
  isLoading = true;
  error: string | null = null;
  
  constructor(
    private calendarService: CalendarService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading = true;
    this.calendarService.getEvents().subscribe({
      next: (response) => {
        const calendarApi = this.calendarComponent.getApi();
        calendarApi.removeAllEvents();
        
        const events = response.data.map((event: any) => {
          return {
            id: event.id,
            title: event.title,
            start: event.startDateTime,
            end: event.endDateTime,
            allDay: event.allDay,
            backgroundColor: this.getEventColor(event.type),
            extendedProps: {
              type: event.type,
              description: event.description,
              location: event.location,
              relatedId: event.relatedId,
              relatedType: event.relatedType
            }
          };
        });
        
        calendarApi.addEventSource(events);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.isLoading = false;
        this.showErrorMessage();
      }
    });
  }

  handleEventClick(info: { event: EventApi; el: HTMLElement }) {
    this.router.navigate(['/calendar/event/details', info.event.id]);
  }

  handleDateSelect(selectInfo: any) {
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '600px',
      data: {
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents();
      }
    });
  }

  handleEventDrop(eventDropInfo: any) {
    const event = eventDropInfo.event;
    const updatedEvent = {
      id: event.id,
      title: event.title,
      startDateTime: event.start,
      endDateTime: event.end,
      allDay: event.allDay,
      type: event.extendedProps.type,
      description: event.extendedProps.description,
      location: event.extendedProps.location,
      relatedId: event.extendedProps.relatedId,
      relatedType: event.extendedProps.relatedType
    };

    this.calendarService.updateEvent(event.id, updatedEvent).subscribe({
      next: () => {
        this.showSuccessMessage('CALENDAR.EVENT_UPDATED');
      },
      error: (error) => {
        this.error = error.message;
        this.showErrorMessage();
        eventDropInfo.revert();
      }
    });
  }

  handleEventResize(eventResizeInfo: any) {
    const event = eventResizeInfo.event;
    const updatedEvent = {
      id: event.id,
      title: event.title,
      startDateTime: event.start,
      endDateTime: event.end,
      allDay: event.allDay,
      type: event.extendedProps.type,
      description: event.extendedProps.description,
      location: event.extendedProps.location,
      relatedId: event.extendedProps.relatedId,
      relatedType: event.extendedProps.relatedType
    };

    this.calendarService.updateEvent(event.id, updatedEvent).subscribe({
      next: () => {
        this.showSuccessMessage('CALENDAR.EVENT_UPDATED');
      },
      error: (error) => {
        this.error = error.message;
        this.showErrorMessage();
        eventResizeInfo.revert();
      }
    });
  }

  getEventColor(type: string): string {
    switch (type) {
      case 'court_session':
        return '#f44336'; // Red
      case 'consultation':
        return '#2196f3'; // Blue
      case 'deadline':
        return '#ff9800'; // Orange
      case 'reminder':
        return '#4caf50'; // Green
      case 'meeting':
        return '#9c27b0'; // Purple
      default:
        return '#607d8b'; // Blue Grey
    }
  }

  createNewEvent() {
    this.router.navigate(['/calendar/event/new']);
  }

  openReminderSettings() {
    this.router.navigate(['/calendar/settings']);
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
