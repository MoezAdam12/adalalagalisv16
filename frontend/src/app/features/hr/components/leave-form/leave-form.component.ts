import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LeaveService } from '../../services/leave.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-leave-form',
  templateUrl: './leave-form.component.html',
  styleUrls: ['./leave-form.component.scss']
})
export class LeaveFormComponent implements OnInit {
  leaveForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  leaveId: string;
  employees = [];
  leaveTypes = [];
  
  statusOptions = [
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'approved', label: 'موافق عليها' },
    { value: 'rejected', label: 'مرفوضة' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
    this.loadLeaveTypes();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params.id) {
        this.isEditMode = true;
        this.leaveId = params.id;
        this.loadLeaveData();
      }
    });
    
    // Calculate days when dates change
    this.leaveForm.get('start_date').valueChanges.subscribe(() => {
      this.calculateDays();
    });
    
    this.leaveForm.get('end_date').valueChanges.subscribe(() => {
      this.calculateDays();
    });
  }
  
  initForm(): void {
    this.leaveForm = this.fb.group({
      employee_id: ['', Validators.required],
      leave_type: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      days: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0.5)]],
      reason: [''],
      status: [{ value: 'pending', disabled: true }],
      notes: ['']
    });
  }
  
  loadEmployees(): void {
    this.employeeService.getEmployees({ status: 'active' }).subscribe(
      response => {
        this.employees = response.data;
      },
      error => {
        this.notificationService.showError('فشل في تحميل قائمة الموظفين');
      }
    );
  }
  
  loadLeaveTypes(): void {
    // This would typically come from a LeaveTypeService
    // For now, we'll use mock data
    this.leaveTypes = [
      { _id: 'annual', name: 'إجازة سنوية', is_paid: true },
      { _id: 'sick', name: 'إجازة مرضية', is_paid: true },
      { _id: 'unpaid', name: 'إجازة بدون راتب', is_paid: false },
      { _id: 'emergency', name: 'إجازة طارئة', is_paid: true },
      { _id: 'maternity', name: 'إجازة أمومة', is_paid: true },
      { _id: 'paternity', name: 'إجازة أبوة', is_paid: true }
    ];
  }
  
  loadLeaveData(): void {
    this.isLoading = true;
    
    this.leaveService.getLeave(this.leaveId).subscribe(
      response => {
        const leave = response.data;
        
        // Format dates for form
        if (leave.start_date) {
          leave.start_date = this.formatDateForInput(new Date(leave.start_date));
        }
        if (leave.end_date) {
          leave.end_date = this.formatDateForInput(new Date(leave.end_date));
        }
        
        // Enable status field for admin users
        if (this.isAdmin()) {
          this.leaveForm.get('status').enable();
        }
        
        this.leaveForm.patchValue({
          employee_id: leave.employee_id._id,
          leave_type: leave.leave_type._id,
          start_date: leave.start_date,
          end_date: leave.end_date,
          days: leave.days,
          reason: leave.reason,
          status: leave.status,
          notes: leave.notes
        });
        
        this.isLoading = false;
      },
      error => {
        this.notificationService.showError('فشل في تحميل بيانات الإجازة');
        this.isLoading = false;
        this.router.navigate(['/hr/leaves']);
      }
    );
  }
  
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  calculateDays(): void {
    const startDate = this.leaveForm.get('start_date').value;
    const endDate = this.leaveForm.get('end_date').value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end >= start) {
        // Calculate business days (excluding weekends)
        let days = 0;
        const current = new Date(start);
        
        while (current <= end) {
          const dayOfWeek = current.getDay();
          // Skip weekends (Friday and Saturday in Saudi Arabia)
          if (dayOfWeek !== 5 && dayOfWeek !== 6) {
            days++;
          }
          current.setDate(current.getDate() + 1);
        }
        
        this.leaveForm.get('days').setValue(days);
      } else {
        this.leaveForm.get('days').setValue(0);
      }
    }
  }
  
  isAdmin(): boolean {
    // This would typically check the user's role
    // For now, we'll return true to enable admin features
    return true;
  }
  
  onSubmit(): void {
    if (this.leaveForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.leaveForm.controls).forEach(key => {
        this.leaveForm.get(key).markAsTouched();
      });
      return;
    }
    
    this.isSubmitting = true;
    const leaveData = { ...this.leaveForm.value };
    
    // Include the calculated days value
    leaveData.days = this.leaveForm.get('days').value;
    
    if (this.isEditMode) {
      this.leaveService.updateLeave(this.leaveId, leaveData).subscribe(
        response => {
          this.notificationService.showSuccess('تم تحديث طلب الإجازة بنجاح');
          this.isSubmitting = false;
          this.router.navigate(['/hr/leaves']);
        },
        error => {
          this.notificationService.showError('فشل في تحديث طلب الإجازة');
          this.isSubmitting = false;
        }
      );
    } else {
      this.leaveService.createLeave(leaveData).subscribe(
        response => {
          this.notificationService.showSuccess('تم إنشاء طلب الإجازة بنجاح');
          this.isSubmitting = false;
          this.router.navigate(['/hr/leaves']);
        },
        error => {
          this.notificationService.showError('فشل في إنشاء طلب الإجازة');
          this.isSubmitting = false;
        }
      );
    }
  }
  
  onCancel(): void {
    this.router.navigate(['/hr/leaves']);
  }
}
