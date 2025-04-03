import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-board',
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss']
})
export class TaskBoardComponent implements OnInit {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  reviewTasks: Task[] = [];
  completedTasks: Task[] = [];
  blockedTasks: Task[] = [];
  deferredTasks: Task[] = [];
  
  isLoading = true;
  error: string | null = null;
  
  // For filtering
  filterByAssignee: string | null = null;
  filterByPriority: TaskPriority | null = null;
  
  // Mock users list - in a real app, this would come from a user service
  users = [
    { id: 'user1', name: 'Ahmed Ali', role: 'Attorney' },
    { id: 'user2', name: 'Fatima Hassan', role: 'Paralegal' },
    { id: 'user3', name: 'Mohammed Ibrahim', role: 'Legal Assistant' },
    { id: 'user4', name: 'Sara Ahmed', role: 'Attorney', department: 'Corporate Law' },
    { id: 'user5', name: 'Khalid Omar', role: 'Attorney', department: 'Litigation' },
    { id: 'user6', name: 'Layla Mahmoud', role: 'Paralegal', department: 'Real Estate' }
  ];
  
  // For task priority options
  taskPriorities = [
    { value: TaskPriority.LOW, label: 'TASKS.PRIORITY.LOW' },
    { value: TaskPriority.MEDIUM, label: 'TASKS.PRIORITY.MEDIUM' },
    { value: TaskPriority.HIGH, label: 'TASKS.PRIORITY.HIGH' },
    { value: TaskPriority.URGENT, label: 'TASKS.PRIORITY.URGENT' }
  ];

  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getAllTasks()
      .subscribe({
        next: (tasks) => {
          this.categorizeTasksByStatus(tasks);
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

  categorizeTasksByStatus(tasks: Task[]): void {
    // Reset all arrays
    this.todoTasks = [];
    this.inProgressTasks = [];
    this.reviewTasks = [];
    this.completedTasks = [];
    this.blockedTasks = [];
    this.deferredTasks = [];
    
    // Apply filters if set
    let filteredTasks = tasks;
    if (this.filterByAssignee) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === this.filterByAssignee);
    }
    if (this.filterByPriority) {
      filteredTasks = filteredTasks.filter(task => task.priority === this.filterByPriority);
    }
    
    // Categorize tasks by status
    filteredTasks.forEach(task => {
      switch (task.status) {
        case TaskStatus.TODO:
          this.todoTasks.push(task);
          break;
        case TaskStatus.IN_PROGRESS:
          this.inProgressTasks.push(task);
          break;
        case TaskStatus.REVIEW:
          this.reviewTasks.push(task);
          break;
        case TaskStatus.COMPLETED:
          this.completedTasks.push(task);
          break;
        case TaskStatus.BLOCKED:
          this.blockedTasks.push(task);
          break;
        case TaskStatus.DEFERRED:
          this.deferredTasks.push(task);
          break;
      }
    });
    
    // Sort tasks by priority (highest first)
    const priorityOrder = {
      [TaskPriority.URGENT]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 3
    };
    
    const sortByPriority = (a: Task, b: Task) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    };
    
    this.todoTasks.sort(sortByPriority);
    this.inProgressTasks.sort(sortByPriority);
    this.reviewTasks.sort(sortByPriority);
    this.completedTasks.sort(sortByPriority);
    this.blockedTasks.sort(sortByPriority);
    this.deferredTasks.sort(sortByPriority);
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to a different column (status change)
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      
      if (newStatus) {
        this.updateTaskStatus(task, newStatus);
        
        // Optimistically update UI
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
    }
  }

  getStatusFromContainerId(containerId: string): TaskStatus | null {
    switch (containerId) {
      case 'todo-list':
        return TaskStatus.TODO;
      case 'in-progress-list':
        return TaskStatus.IN_PROGRESS;
      case 'review-list':
        return TaskStatus.REVIEW;
      case 'completed-list':
        return TaskStatus.COMPLETED;
      case 'blocked-list':
        return TaskStatus.BLOCKED;
      case 'deferred-list':
        return TaskStatus.DEFERRED;
      default:
        return null;
    }
  }

  updateTaskStatus(task: Task, newStatus: TaskStatus): void {
    this.taskService.updateTaskStatus(task.id, newStatus)
      .subscribe({
        error: (error) => {
          // Revert the UI change on error
          this.loadTasks();
          this.showNotification(
            this.translate.instant('TASKS.ERROR_UPDATING_STATUS'),
            'error'
          );
        }
      });
  }

  viewTask(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  createNewTask(): void {
    this.router.navigate(['/tasks/create']);
  }

  applyAssigneeFilter(assigneeId: string | null): void {
    this.filterByAssignee = assigneeId;
    this.loadTasks();
  }

  applyPriorityFilter(priority: TaskPriority | null): void {
    this.filterByPriority = priority;
    this.loadTasks();
  }

  clearFilters(): void {
    this.filterByAssignee = null;
    this.filterByPriority = null;
    this.loadTasks();
  }

  refreshBoard(): void {
    this.loadTasks();
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

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
