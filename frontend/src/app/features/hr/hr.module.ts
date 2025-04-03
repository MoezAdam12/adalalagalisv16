import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

// Components
import { EmployeeFormComponent } from './components/employee-form/employee-form.component';
import { LeaveFormComponent } from './components/leave-form/leave-form.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { LeaveListComponent } from './components/leave-list/leave-list.component';
import { SalaryListComponent } from './components/salary-list/salary-list.component';
import { HrDashboardComponent } from './components/hr-dashboard/hr-dashboard.component';

// Services
import { EmployeeService } from './services/employee.service';
import { LeaveService } from './services/leave.service';
import { SalaryService } from './services/salary.service';

@NgModule({
  declarations: [
    EmployeeFormComponent,
    LeaveFormComponent,
    EmployeeListComponent,
    LeaveListComponent,
    SalaryListComponent,
    HrDashboardComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule
  ],
  providers: [
    EmployeeService,
    LeaveService,
    SalaryService
  ],
  exports: [
    EmployeeFormComponent,
    LeaveFormComponent,
    EmployeeListComponent,
    LeaveListComponent,
    SalaryListComponent,
    HrDashboardComponent
  ]
})
export class HrModule { }
