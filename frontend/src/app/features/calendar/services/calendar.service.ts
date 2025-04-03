import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = `${environment.apiUrl}/calendar`;

  constructor(private http: HttpClient) { }

  getEvents(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/events`, { params });
  }

  getEventById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/${id}`);
  }

  createEvent(event: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/events`, event);
  }

  updateEvent(id: string, event: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/events/${id}`, event);
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${id}`);
  }

  // Court Sessions
  getCourtSessions(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/court-sessions`, { params });
  }

  // Consultations
  getConsultations(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/consultations`, { params });
  }

  // Reminders
  getReminders(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/reminders`, { params });
  }

  createReminder(reminder: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reminders`, reminder);
  }

  updateReminder(id: string, reminder: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/reminders/${id}`, reminder);
  }

  deleteReminder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reminders/${id}`);
  }

  // Reminder Settings
  getReminderSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`);
  }

  updateReminderSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings`, settings);
  }
}
