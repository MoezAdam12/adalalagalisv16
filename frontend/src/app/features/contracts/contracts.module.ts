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

// Rich Text Editor
import { QuillModule } from 'ngx-quill';

// Components will be added here
import { ContractsListComponent } from './components/contracts-list/contracts-list.component';
import { ContractDetailsComponent } from './components/contract-details/contract-details.component';
import { ContractFormComponent } from './components/contract-form/contract-form.component';
import { ContractTemplatesComponent } from './components/contract-templates/contract-templates.component';
import { ContractPaymentsComponent } from './components/contract-payments/contract-payments.component';

// Services
import { ContractsService } from './services/contracts.service';

const routes: Routes = [
  { path: '', component: ContractsListComponent },
  { path: 'new', component: ContractFormComponent },
  { path: 'edit/:id', component: ContractFormComponent },
  { path: 'details/:id', component: ContractDetailsComponent },
  { path: 'templates', component: ContractTemplatesComponent },
  { path: 'payments', component: ContractPaymentsComponent }
];

@NgModule({
  declarations: [
    ContractsListComponent,
    ContractDetailsComponent,
    ContractFormComponent,
    ContractTemplatesComponent,
    ContractPaymentsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule,
    
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
    MatTooltipModule,
    
    // Rich Text Editor
    QuillModule
  ],
  providers: [
    ContractsService
  ]
})
export class ContractsModule { }
