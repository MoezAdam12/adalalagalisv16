import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { TimeEntryFormComponent } from './components/time-entry-form/time-entry-form.component';
import { TimeEntryListComponent } from './components/time-entry-list/time-entry-list.component';
import { TimeTrackingDashboardComponent } from './components/time-tracking-dashboard/time-tracking-dashboard.component';
import { ActivityTypeManagementComponent } from './components/activity-type-management/activity-type-management.component';
import { BillingRateManagementComponent } from './components/billing-rate-management/billing-rate-management.component';
import { TimeTargetManagementComponent } from './components/time-target-management/time-target-management.component';

import { TimeEntryService } from './services/time-entry.service';
import { ActivityTypeService } from './services/activity-type.service';
import { BillingRateService } from './services/billing-rate.service';
import { TimeTargetService } from './services/time-target.service';

const routes = [
  {
    path: 'time-tracking',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TimeTrackingDashboardComponent },
      { path: 'time-entries', component: TimeEntryListComponent },
      { path: 'time-entry/new', component: TimeEntryFormComponent },
      { path: 'time-entry/:id', component: TimeEntryFormComponent },
      { path: 'activity-types', component: ActivityTypeManagementComponent },
      { path: 'billing-rates', component: BillingRateManagementComponent },
      { path: 'time-targets', component: TimeTargetManagementComponent }
    ]
  }
];

@NgModule({
  declarations: [
    TimeEntryFormComponent,
    TimeEntryListComponent,
    TimeTrackingDashboardComponent,
    ActivityTypeManagementComponent,
    BillingRateManagementComponent,
    TimeTargetManagementComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    TimeEntryService,
    ActivityTypeService,
    BillingRateService,
    TimeTargetService
  ],
  exports: [
    TimeEntryFormComponent,
    TimeEntryListComponent,
    TimeTrackingDashboardComponent
  ]
})
export class TimeTrackingModule { }
