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
import { CasesListComponent } from './components/cases-list/cases-list.component';
import { CaseDetailsComponent } from './components/case-details/case-details.component';
import { CaseFormComponent } from './components/case-form/case-form.component';
import { CaseSessionsComponent } from './components/case-sessions/case-sessions.component';
import { CaseDocumentsComponent } from './components/case-documents/case-documents.component';

// Services
import { CasesService } from './services/cases.service';

const routes: Routes = [
  { path: '', component: CasesListComponent },
  { path: 'new', component: CaseFormComponent },
  { path: 'edit/:id', component: CaseFormComponent },
  { path: 'details/:id', component: CaseDetailsComponent },
  { path: 'sessions/:id', component: CaseSessionsComponent },
  { path: 'documents/:id', component: CaseDocumentsComponent }
];

@NgModule({
  declarations: [
    CasesListComponent,
    CaseDetailsComponent,
    CaseFormComponent,
    CaseSessionsComponent,
    CaseDocumentsComponent
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
    CasesService
  ]
})
export class CasesModule { }
