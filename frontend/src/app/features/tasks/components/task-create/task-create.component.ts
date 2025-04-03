import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../models/task.model';

@Component({
  selector: 'app-task-create',
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.scss']
})
export class TaskCreateComponent implements OnInit {
  taskForm: FormGroup;
  categories: TaskCategory[] = [];
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  
  // For task status options
  taskStatuses = [
    { value: TaskStatus.TODO, label: 'TASKS.STATUS.TODO' },
    { value: TaskStatus.IN_PROGRESS, label: 'TASKS.STATUS.IN_PROGRESS' },
    { value: TaskStatus.REVIEW, label: 'TASKS.STATUS.REVIEW' },
    { value: TaskStatus.BLOCKED, label: 'TASKS.STATUS.BLOCKED' },
    { value: TaskStatus.DEFERRED, label: 'TASKS.STATUS.DEFERRED' }
  ];
  
  // For task priority options
  taskPriorities = [
    { value: TaskPriority.LOW, label: 'TASKS.PRIORITY.LOW' },
    { value: TaskPriority.MEDIUM, label: 'TASKS.PRIORITY.MEDIUM' },
    { value: TaskPriority.HIGH, label: 'TASKS.PRIORITY.HIGH' },
    { value: TaskPriority.URGENT, label: 'TASKS.PRIORITY.URGENT' }
  ];
  
  // Mock users list - in a real app, this would come from a user service
  users = [
    { id: 'user1', name: 'Ahmed Ali', role: 'Attorney' },
    { id: 'user2', name: 'Fatima Hassan', role: 'Paralegal' },
    { id: 'user3', name: 'Mohammed Ibrahim', role: 'Legal Assistant' },
    { id: 'user4', name: 'Sara Ahmed', role: 'Attorney', department: 'Corporate Law' },
    { id: 'user5', name: 'Khalid Omar', role: 'Attorney', department: 'Litigation' },
    { id: 'user6', name: 'Layla Mahmoud', role: 'Paralegal', department: 'Real Estate' }
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(1000)],
      status: [TaskStatus.TODO, Validators.required],
      priority: [TaskPriority.MEDIUM, Validators.required],
      dueDate: [null],
      startDate: [null],
      assignedTo: [''],
      categoryId: [''],
      tags: [''],
      estimatedHours: [null, [Validators.min(0), Validators.max(1000)]],
      reminderDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.taskService.getTaskCategories()
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_LOADING_CATEGORIES'),
            'error'
          );
        }
      });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    
    // Prepare tags array from comma-separated string
    const tagsString = this.taskForm.get('tags')?.value;
    const tags = tagsString ? tagsString.split(',').map((tag: string) => tag.trim()) : [];
    
    const newTask: Partial<Task> = {
      title: this.taskForm.get('title')?.value,
      description: this.taskForm.get('description')?.value,
      status: this.taskForm.get('status')?.value,
      priority: this.taskForm.get('priority')?.value,
      dueDate: this.taskForm.get('dueDate')?.value,
      startDate: this.taskForm.get('startDate')?.value,
      assignedTo: this.taskForm.get('assignedTo')?.value || undefined,
      categoryId: this.taskForm.get('categoryId')?.value || undefined,
      tags: tags.length > 0 ? tags : undefined,
      estimatedHours: this.taskForm.get('estimatedHours')?.value || undefined,
      reminderDate: this.taskForm.get('reminderDate')?.value || undefined,
      createdBy: 'currentUserId', // In a real app, this would be the current user's ID
      tenantId: 'currentTenantId' // In a real app, this would be the current tenant's ID
    };

    this.taskService.createTask(newTask)
      .subscribe({
        next: (createdTask) => {
          this.isSubmitting = false;
          this.showNotification(
            this.translate.instant('TASKS.CREATE_SUCCESS'),
            'success'
          );
          this.router.navigate(['/tasks', createdTask.id]);
        },
        error: (error) => {
          this.error = error.message;
          this.isSubmitting = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_CREATING'),
            'error'
          );
        }
      });
  }

  resetForm(): void {
    this.taskForm.reset({
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    });
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
