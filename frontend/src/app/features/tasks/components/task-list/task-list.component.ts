import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { TaskAssignComponent } from '../task-assign/task-assign.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  dataSource: MatTableDataSource<Task>;
  displayedColumns: string[] = ['title', 'status', 'priority', 'dueDate', 'assignedToName', 'actions'];
  isLoading = true;
  error: string | null = null;
  
  // Filter values
  statusFilter: TaskStatus | '' = '';
  priorityFilter: TaskPriority | '' = '';
  assigneeFilter: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private taskService: TaskService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Task>([]);
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Custom filter predicate for multiple filters
    this.dataSource.filterPredicate = (data: Task, filter: string) => {
      const searchStr = filter.toLowerCase();
      
      // Apply status filter
      if (this.statusFilter && data.status !== this.statusFilter) {
        return false;
      }
      
      // Apply priority filter
      if (this.priorityFilter && data.priority !== this.priorityFilter) {
        return false;
      }
      
      // Apply assignee filter
      if (this.assigneeFilter && data.assignedTo !== this.assigneeFilter) {
        return false;
      }
      
      // Apply text search
      return data.title.toLowerCase().includes(searchStr) || 
             (data.description && data.description.toLowerCase().includes(searchStr));
    };
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getAllTasks()
      .subscribe({
        next: (data) => {
          this.tasks = data;
          this.dataSource.data = this.tasks;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_LOADING'),
            'error'
          );
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyStatusFilter(status: TaskStatus | ''): void {
    this.statusFilter = status;
    this.dataSource.filter = this.dataSource.filter || ' '; // Trigger filter
  }

  applyPriorityFilter(priority: TaskPriority | ''): void {
    this.priorityFilter = priority;
    this.dataSource.filter = this.dataSource.filter || ' '; // Trigger filter
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.priorityFilter = '';
    this.assigneeFilter = '';
    this.dataSource.filter = '';
  }

  viewTask(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  assignTask(task: Task, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(TaskAssignComponent, {
      width: '500px',
      data: { taskId: task.id, taskTitle: task.title, currentAssignee: task.assignedTo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
        this.showNotification(
          this.translate.instant('TASKS.ASSIGN_SUCCESS'),
          'success'
        );
      }
    });
  }

  updateTaskStatus(task: Task, status: TaskStatus, event: Event): void {
    event.stopPropagation();
    this.taskService.updateTaskStatus(task.id, status)
      .subscribe({
        next: (updatedTask) => {
          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.dataSource.data = [...this.tasks];
          }
          this.showNotification(
            this.translate.instant('TASKS.STATUS_UPDATED'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('TASKS.ERROR_UPDATING_STATUS'),
            'error'
          );
        }
      });
  }

  deleteTask(task: Task, event: Event): void {
    event.stopPropagation();
    if (confirm(this.translate.instant('TASKS.CONFIRM_DELETE'))) {
      this.taskService.deleteTask(task.id)
        .subscribe({
          next: () => {
            this.tasks = this.tasks.filter(t => t.id !== task.id);
            this.dataSource.data = this.tasks;
            this.showNotification(
              this.translate.instant('TASKS.DELETE_SUCCESS'),
              'success'
            );
          },
          error: (error) => {
            this.showNotification(
              this.translate.instant('TASKS.ERROR_DELETING'),
              'error'
            );
          }
        });
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'status-todo';
      case TaskStatus.IN_PROGRESS:
        return 'status-in-progress';
      case TaskStatus.REVIEW:
        return 'status-review';
      case TaskStatus.COMPLETED:
        return 'status-completed';
      case TaskStatus.CANCELLED:
        return 'status-cancelled';
      case TaskStatus.BLOCKED:
        return 'status-blocked';
      case TaskStatus.DEFERRED:
        return 'status-deferred';
      default:
        return '';
    }
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'priority-low';
      case TaskPriority.MEDIUM:
        return 'priority-medium';
      case TaskPriority.HIGH:
        return 'priority-high';
      case TaskPriority.URGENT:
        return 'priority-urgent';
      default:
        return '';
    }
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
  }

  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    });
  }

  createNewTask(): void {
    this.router.navigate(['/tasks/create']);
  }

  viewTaskBoard(): void {
    this.router.navigate(['/tasks/board']);
  }

  refreshTasks(): void {
    this.loadTasks();
  }
}
