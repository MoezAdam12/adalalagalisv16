import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MaterialModule } from 'src/app/shared/material.module';
import { FullCalendarModule } from '@fullcalendar/angular';

// Import components
import { ConsultationListComponent } from './components/consultation-list/consultation-list.component';
import { ConsultationCreateComponent } from './components/consultation-create/consultation-create.component';
import { ConsultationDetailComponent } from './components/consultation-detail/consultation-detail.component';
import { ConsultationCalendarComponent } from './components/consultation-calendar/consultation-calendar.component';
import { ConsultationFeedbackComponent } from './components/consultation-feedback/consultation-feedback.component';

const routes: Routes = [
  {
    path: '',
    component: ConsultationListComponent
  },
  {
    path: 'create',
    component: ConsultationCreateComponent
  },
  {
    path: 'calendar',
    component: ConsultationCalendarComponent
  },
  {
    path: ':id',
    component: ConsultationDetailComponent
  },
  {
    path: ':id/feedback',
    component: ConsultationFeedbackComponent
  }
];

@NgModule({
  declarations: [
    ConsultationListComponent,
    ConsultationCreateComponent,
    ConsultationDetailComponent,
    ConsultationCalendarComponent,
    ConsultationFeedbackComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    SharedModule,
    MaterialModule,
    FullCalendarModule
  ],
  exports: [
    ConsultationListComponent,
    ConsultationCreateComponent,
    ConsultationDetailComponent,
    ConsultationCalendarComponent,
    ConsultationFeedbackComponent
  ]
})
export class ConsultationsModule { }
