import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TimeEntryService } from '../../services/time-entry.service';
import { ActivityTypeService } from '../../services/activity-type.service';
import { CaseService } from '../../../case/services/case.service';
import { ClientService } from '../../../client/services/client.service';
import { TaskService } from '../../../task/services/task.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-time-entry-form',
  templateUrl: './time-entry-form.component.html',
  styleUrls: ['./time-entry-form.component.scss']
})
export class TimeEntryFormComponent implements OnInit {
  timeEntryForm: FormGroup;
  activityTypes = [];
  cases = [];
  clients = [];
  tasks = [];
  isLoading = false;
  isSubmitting = false;
  timerRunning = false;
  timerStartTime: Date;
  timerInterval: any;
  timerDuration = 0;
  
  constructor(
    private fb: FormBuilder,
    private timeEntryService: TimeEntryService,
    private activityTypeService: ActivityTypeService,
    private caseService: CaseService,
    private clientService: ClientService,
    private taskService: TaskService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadFormData();
    
    // Subscribe to case changes to update client
    this.timeEntryForm.get('case_id').valueChanges.subscribe(caseId => {
      if (caseId) {
        const selectedCase = this.cases.find(c => c._id === caseId);
        if (selectedCase && selectedCase.client_id) {
          this.timeEntryForm.get('client_id').setValue(selectedCase.client_id);
        }
      }
    });
    
    // Subscribe to activity type changes to update billable status
    this.timeEntryForm.get('activity_type').valueChanges.subscribe(activityTypeId => {
      if (activityTypeId) {
        const selectedActivityType = this.activityTypes.find(at => at._id === activityTypeId);
        if (selectedActivityType) {
          this.timeEntryForm.get('is_billable').setValue(selectedActivityType.default_billable);
        }
      }
    });
  }
  
  initForm(): void {
    this.timeEntryForm = this.fb.group({
      activity_date: [new Date(), Validators.required],
      case_id: [null],
      client_id: [null],
      task_id: [null],
      activity_type: [null, Validators.required],
      description: ['', Validators.required],
      duration_hours: [null, [Validators.required, Validators.min(0.01)]],
      is_billable: [true],
      billing_rate: [null]
    });
  }
  
  loadFormData(): void {
    this.isLoading = true;
    
    forkJoin({
      activityTypes: this.activityTypeService.getActivityTypes({ is_active: true }),
      cases: this.caseService.getCases({ status: 'active' }),
      clients: this.clientService.getClients(),
      tasks: this.taskService.getTasks({ status: 'in_progress' })
    }).subscribe(
      results => {
        this.activityTypes = results.activityTypes.data;
        this.cases = results.cases.data;
        this.clients = results.clients.data;
        this.tasks = results.tasks.data;
        this.isLoading = false;
      },
      error => {
        this.notificationService.showError('Failed to load form data');
        this.isLoading = false;
      }
    );
  }
  
  startTimer(): void {
    if (this.timerRunning) return;
    
    this.timerRunning = true;
    this.timerStartTime = new Date();
    this.timerDuration = 0;
    
    this.timerInterval = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - this.timerStartTime.getTime();
      this.timerDuration = diffMs / (1000 * 60 * 60); // Convert to hours
    }, 1000);
  }
  
  stopTimer(): void {
    if (!this.timerRunning) return;
    
    clearInterval(this.timerInterval);
    this.timerRunning = false;
    
    // Round to 2 decimal places
    this.timerDuration = Math.round(this.timerDuration * 100) / 100;
    this.timeEntryForm.get('duration_hours').setValue(this.timerDuration);
  }
  
  resetTimer(): void {
    clearInterval(this.timerInterval);
    this.timerRunning = false;
    this.timerDuration = 0;
    this.timeEntryForm.get('duration_hours').setValue(null);
  }
  
  onSubmit(): void {
    if (this.timeEntryForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.timeEntryForm.controls).forEach(key => {
        this.timeEntryForm.get(key).markAsTouched();
      });
      return;
    }
    
    // Stop timer if running
    if (this.timerRunning) {
      this.stopTimer();
    }
    
    this.isSubmitting = true;
    const timeEntryData = this.timeEntryForm.value;
    
    this.timeEntryService.createTimeEntry(timeEntryData).subscribe(
      response => {
        this.notificationService.showSuccess('Time entry created successfully');
        this.resetForm();
        this.isSubmitting = false;
      },
      error => {
        this.notificationService.showError('Failed to create time entry');
        this.isSubmitting = false;
      }
    );
  }
  
  resetForm(): void {
    this.resetTimer();
    this.timeEntryForm.reset({
      activity_date: new Date(),
      is_billable: true
    });
  }
}
