import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { TaskService } from '../../services/task.service';
import { TaskAssignment } from '../../models/task.model';

interface User {
  id: string;
  name: string;
  role: string;
  department?: string;
}

@Component({
  selector: 'app-task-assign',
  templateUrl: './task-assign.component.html',
  styleUrls: ['./task-assign.component.scss']
})
export class TaskAssignComponent implements OnInit {
  assignForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  
  // Mock users list - in a real app, this would come from a user service
  users: User[] = [
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
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<TaskAssignComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { taskId: string; taskTitle: string; currentAssignee: string }
  ) {
    this.assignForm = this.fb.group({
      assignedTo: [data.currentAssignee || '', Validators.required],
      notes: [''],
      notifyUser: [true]
    });
  }

  ngOnInit(): void {
    // In a real app, you would load users from a service
  }

  onSubmit(): void {
    if (this.assignForm.invalid) {
      return;
    }

    this.isLoading = true;
    
    const assignment: TaskAssignment = {
      taskId: this.data.taskId,
      assignedTo: this.assignForm.get('assignedTo')?.value,
      assignedBy: 'currentUserId', // In a real app, this would be the current user's ID
      assignedDate: new Date(),
      notes: this.assignForm.get('notes')?.value,
      notifyUser: this.assignForm.get('notifyUser')?.value
    };

    this.taskService.assignTask(assignment)
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
          this.showNotification(
            this.translate.instant('TASKS.ERROR_ASSIGNING'),
            'error'
          );
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    });
  }

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.name : this.translate.instant('TASKS.UNKNOWN_USER');
  }
}
