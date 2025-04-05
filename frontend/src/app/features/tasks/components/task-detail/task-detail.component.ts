import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskComment, TaskAttachment } from '../../models/task.model';
import { TaskAssignComponent } from '../task-assign/task-assign.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  taskId: string | null = null;
  task: Task | null = null;
  comments: TaskComment[] = [];
  attachments: TaskAttachment[] = [];
  isLoading = true;
  isCommentsLoading = false;
  isAttachmentsLoading = false;
  error: string | null = null;
  
  commentForm: FormGroup;
  isSubmittingComment = false;
  
  // For task status options
  taskStatuses = [
    { value: TaskStatus.TODO, label: 'TASKS.STATUS.TODO' },
    { value: TaskStatus.IN_PROGRESS, label: 'TASKS.STATUS.IN_PROGRESS' },
    { value: TaskStatus.REVIEW, label: 'TASKS.STATUS.REVIEW' },
    { value: TaskStatus.COMPLETED, label: 'TASKS.STATUS.COMPLETED' },
    { value: TaskStatus.BLOCKED, label: 'TASKS.STATUS.BLOCKED' },
    { value: TaskStatus.DEFERRED, label: 'TASKS.STATUS.DEFERRED' },
    { value: TaskStatus.CANCELLED, label: 'TASKS.STATUS.CANCELLED' }
  ];
  
  // For task priority options
  taskPriorities = [
    { value: TaskPriority.LOW, label: 'TASKS.PRIORITY.LOW' },
    { value: TaskPriority.MEDIUM, label: 'TASKS.PRIORITY.MEDIUM' },
    { value: TaskPriority.HIGH, label: 'TASKS.PRIORITY.HIGH' },
    { value: TaskPriority.URGENT, label: 'TASKS.PRIORITY.URGENT' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (!this.taskId) {
      this.router.navigate(['/tasks']);
      return;
    }
    
    this.loadTask();
  }

  loadTask(): void {
    if (!this.taskId) return;
    
    this.isLoading = true;
    this.taskService.getTaskById(this.taskId)
      .subscribe({
        next: (task) => {
          this.task = task;
          this.isLoading = false;
          this.loadComments();
          this.loadAttachments();
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_LOADING_TASK'),
            'error'
          );
        }
      });
  }

  loadComments(): void {
    if (!this.taskId) return;
    
    this.isCommentsLoading = true;
    this.taskService.getTaskComments(this.taskId)
      .subscribe({
        next: (comments) => {
          this.comments = comments;
          this.isCommentsLoading = false;
        },
        error: (error) => {
          this.isCommentsLoading = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_LOADING_COMMENTS'),
            'error'
          );
        }
      });
  }

  loadAttachments(): void {
    if (!this.taskId) return;
    
    this.isAttachmentsLoading = true;
    this.taskService.getTaskAttachments(this.taskId)
      .subscribe({
        next: (attachments) => {
          this.attachments = attachments;
          this.isAttachmentsLoading = false;
        },
        error: (error) => {
          this.isAttachmentsLoading = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_LOADING_ATTACHMENTS'),
            'error'
          );
        }
      });
  }

  updateTaskStatus(status: TaskStatus): void {
    if (!this.taskId || !this.task) return;
    
    this.taskService.updateTaskStatus(this.taskId, status)
      .subscribe({
        next: (updatedTask) => {
          this.task = updatedTask;
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

  updateTaskPriority(priority: TaskPriority): void {
    if (!this.taskId || !this.task) return;
    
    const updatedTask: Partial<Task> = {
      priority: priority
    };
    
    this.taskService.updateTask(this.taskId, updatedTask)
      .subscribe({
        next: (updatedTask) => {
          this.task = updatedTask;
          this.showNotification(
            this.translate.instant('TASKS.PRIORITY_UPDATED'),
            'success'
          );
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('TASKS.ERROR_UPDATING_PRIORITY'),
            'error'
          );
        }
      });
  }

  assignTask(): void {
    if (!this.taskId || !this.task) return;
    
    const dialogRef = this.dialog.open(TaskAssignComponent, {
      width: '500px',
      data: { 
        taskId: this.taskId, 
        taskTitle: this.task.title, 
        currentAssignee: this.task.assignedTo 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTask();
        this.showNotification(
          this.translate.instant('TASKS.ASSIGN_SUCCESS'),
          'success'
        );
      }
    });
  }

  addComment(): void {
    if (!this.taskId || this.commentForm.invalid) return;
    
    this.isSubmittingComment = true;
    
    const newComment: Partial<TaskComment> = {
      taskId: this.taskId,
      content: this.commentForm.get('content')?.value,
      createdBy: 'currentUserId' // In a real app, this would be the current user's ID
    };
    
    this.taskService.addComment(this.taskId, newComment)
      .subscribe({
        next: (comment) => {
          this.comments.unshift(comment);
          this.commentForm.reset();
          this.isSubmittingComment = false;
          this.showNotification(
            this.translate.instant('TASKS.COMMENT_ADDED'),
            'success'
          );
        },
        error: (error) => {
          this.isSubmittingComment = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_ADDING_COMMENT'),
            'error'
          );
        }
      });
  }

  downloadAttachment(attachment: TaskAttachment): void {
    if (!this.taskId) return;
    
    this.taskService.downloadAttachment(this.taskId, attachment.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = attachment.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.showNotification(
            this.translate.instant('TASKS.ERROR_DOWNLOADING_ATTACHMENT'),
            'error'
          );
        }
      });
  }

  deleteTask(): void {
    if (!this.taskId) return;
    
    if (confirm(this.translate.instant('TASKS.CONFIRM_DELETE'))) {
      this.taskService.deleteTask(this.taskId)
        .subscribe({
          next: () => {
            this.showNotification(
              this.translate.instant('TASKS.DELETE_SUCCESS'),
              'success'
            );
            this.router.navigate(['/tasks']);
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

  isTaskOverdue(): boolean {
    if (!this.task || !this.task.dueDate) return false;
    const dueDate = new Date(this.task.dueDate);
    const today = new Date();
    return dueDate < today && this.task.status !== TaskStatus.COMPLETED && this.task.status !== TaskStatus.CANCELLED;
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
