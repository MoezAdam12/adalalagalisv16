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

// Components
import { ClientsListComponent } from './components/clients-list/clients-list.component';
import { ClientDetailsComponent } from './components/client-details/client-details.component';
import { ClientFormComponent } from './components/client-form/client-form.component';
import { ClientCasesComponent } from './components/client-cases/client-cases.component';
import { ClientContractsComponent } from './components/client-contracts/client-contracts.component';

// Services
import { ClientsService } from './services/clients.service';

const routes: Routes = [
  { path: '', component: ClientsListComponent },
  { path: 'new', component: ClientFormComponent },
  { path: 'edit/:id', component: ClientFormComponent },
  { path: 'details/:id', component: ClientDetailsComponent },
  { path: 'cases/:id', component: ClientCasesComponent },
  { path: 'contracts/:id', component: ClientContractsComponent }
];

@NgModule({
  declarations: [
    ClientsListComponent,
    ClientDetailsComponent,
    ClientFormComponent,
    ClientCasesComponent,
    ClientContractsComponent
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
    MatTooltipModule
  ],
  providers: [
    ClientsService
  ]
})
export class ClientsModule { }
