import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

// Calendar Components
import { FullCalendarModule } from '@fullcalendar/angular';

// Components
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { EventFormComponent } from './components/event-form/event-form.component';
import { EventDetailsComponent } from './components/event-details/event-details.component';
import { ReminderSettingsComponent } from './components/reminder-settings/reminder-settings.component';

// Services
import { CalendarService } from './services/calendar.service';

const routes: Routes = [
  { path: '', component: CalendarViewComponent },
  { path: 'event/new', component: EventFormComponent },
  { path: 'event/edit/:id', component: EventFormComponent },
  { path: 'event/details/:id', component: EventDetailsComponent },
  { path: 'settings', component: ReminderSettingsComponent }
];

@NgModule({
  declarations: [
    CalendarViewComponent,
    EventFormComponent,
    EventDetailsComponent,
    ReminderSettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule,
    FullCalendarModule,
    
    // Material Modules
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule
  ],
  providers: [
    CalendarService
  ]
})
export class CalendarModule { }
