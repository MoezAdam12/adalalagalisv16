import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Component Imports
import { DocumentListComponent } from './components/document-list/document-list.component';
import { DocumentDetailComponent } from './components/document-detail/document-detail.component';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { DocumentVersionsComponent } from './components/document-versions/document-versions.component';
import { DocumentShareComponent } from './components/document-share/document-share.component';
import { DocumentCategoriesComponent } from './components/document-categories/document-categories.component';
import { DocumentSearchComponent } from './components/document-search/document-search.component';

// Service Imports
import { DocumentService } from './services/document.service';

const routes: Routes = [
  {
    path: '',
    component: DocumentListComponent
  },
  {
    path: 'upload',
    component: DocumentUploadComponent
  },
  {
    path: 'categories',
    component: DocumentCategoriesComponent
  },
  {
    path: 'search',
    component: DocumentSearchComponent
  },
  {
    path: ':id',
    component: DocumentDetailComponent
  },
  {
    path: ':id/versions',
    component: DocumentVersionsComponent
  }
];

@NgModule({
  declarations: [
    DocumentListComponent,
    DocumentDetailComponent,
    DocumentUploadComponent,
    DocumentVersionsComponent,
    DocumentShareComponent,
    DocumentCategoriesComponent,
    DocumentSearchComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule,
    // Angular Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatMenuModule,
    MatExpansionModule,
    MatSnackBarModule
  ],
  providers: [
    DocumentService
  ],
  exports: [
    DocumentListComponent,
    DocumentDetailComponent,
    DocumentUploadComponent
  ]
})
export class DocumentsModule { }
