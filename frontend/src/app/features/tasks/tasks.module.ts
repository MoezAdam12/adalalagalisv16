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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Component Imports
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { TaskCreateComponent } from './components/task-create/task-create.component';
import { TaskAssignComponent } from './components/task-assign/task-assign.component';
import { TaskBoardComponent } from './components/task-board/task-board.component';
import { TaskCommentsComponent } from './components/task-comments/task-comments.component';
import { TaskAttachmentsComponent } from './components/task-attachments/task-attachments.component';
import { TaskCategoriesComponent } from './components/task-categories/task-categories.component';
import { TaskSearchComponent } from './components/task-search/task-search.component';
import { TaskStatisticsComponent } from './components/task-statistics/task-statistics.component';

// Service Imports
import { TaskService } from './services/task.service';

const routes: Routes = [
  {
    path: '',
    component: TaskListComponent
  },
  {
    path: 'board',
    component: TaskBoardComponent
  },
  {
    path: 'create',
    component: TaskCreateComponent
  },
  {
    path: 'categories',
    component: TaskCategoriesComponent
  },
  {
    path: 'search',
    component: TaskSearchComponent
  },
  {
    path: 'statistics',
    component: TaskStatisticsComponent
  },
  {
    path: ':id',
    component: TaskDetailComponent
  }
];

@NgModule({
  declarations: [
    TaskListComponent,
    TaskDetailComponent,
    TaskCreateComponent,
    TaskAssignComponent,
    TaskBoardComponent,
    TaskCommentsComponent,
    TaskAttachmentsComponent,
    TaskCategoriesComponent,
    TaskSearchComponent,
    TaskStatisticsComponent
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
    MatSnackBarModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSliderModule,
    MatBadgeModule,
    DragDropModule
  ],
  providers: [
    TaskService
  ],
  exports: [
    TaskListComponent,
    TaskDetailComponent,
    TaskBoardComponent
  ]
})
export class TasksModule { }
