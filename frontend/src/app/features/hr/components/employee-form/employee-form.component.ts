import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  employeeId: string;
  
  genderOptions = [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
    { value: 'other', label: 'آخر' }
  ];
  
  contractTypeOptions = [
    { value: 'full_time', label: 'دوام كامل' },
    { value: 'part_time', label: 'دوام جزئي' },
    { value: 'contract', label: 'عقد' },
    { value: 'intern', label: 'متدرب' }
  ];
  
  employmentStatusOptions = [
    { value: 'active', label: 'نشط' },
    { value: 'on_leave', label: 'في إجازة' },
    { value: 'terminated', label: 'منتهي' },
    { value: 'retired', label: 'متقاعد' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params.id) {
        this.isEditMode = true;
        this.employeeId = params.id;
        this.loadEmployeeData();
      }
    });
  }
  
  initForm(): void {
    this.employeeForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      birth_date: [''],
      gender: [''],
      nationality: [''],
      id_number: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        postal_code: [''],
        country: ['']
      }),
      hire_date: ['', Validators.required],
      contract_end_date: [''],
      job_title: ['', Validators.required],
      department: [''],
      manager_id: [''],
      contract_type: ['full_time'],
      base_salary: [''],
      employment_status: ['active']
    });
  }
  
  loadEmployeeData(): void {
    this.isLoading = true;
    
    this.employeeService.getEmployee(this.employeeId).subscribe(
      response => {
        const employee = response.data;
        
        // Format dates for form
        if (employee.birth_date) {
          employee.birth_date = this.formatDateForInput(new Date(employee.birth_date));
        }
        if (employee.hire_date) {
          employee.hire_date = this.formatDateForInput(new Date(employee.hire_date));
        }
        if (employee.contract_end_date) {
          employee.contract_end_date = this.formatDateForInput(new Date(employee.contract_end_date));
        }
        
        this.employeeForm.patchValue(employee);
        this.isLoading = false;
      },
      error => {
        this.notificationService.showError('فشل في تحميل بيانات الموظف');
        this.isLoading = false;
        this.router.navigate(['/hr/employees']);
      }
    );
  }
  
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  onSubmit(): void {
    if (this.employeeForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.employeeForm.controls).forEach(key => {
        const control = this.employeeForm.get(key);
        control.markAsTouched();
        
        // If control is a FormGroup, mark all its children as touched
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(childKey => {
            control.get(childKey).markAsTouched();
          });
        }
      });
      return;
    }
    
    this.isSubmitting = true;
    const employeeData = this.employeeForm.value;
    
    if (this.isEditMode) {
      this.employeeService.updateEmployee(this.employeeId, employeeData).subscribe(
        response => {
          this.notificationService.showSuccess('تم تحديث بيانات الموظف بنجاح');
          this.isSubmitting = false;
          this.router.navigate(['/hr/employees']);
        },
        error => {
          this.notificationService.showError('فشل في تحديث بيانات الموظف');
          this.isSubmitting = false;
        }
      );
    } else {
      this.employeeService.createEmployee(employeeData).subscribe(
        response => {
          this.notificationService.showSuccess('تم إنشاء الموظف بنجاح');
          this.isSubmitting = false;
          this.router.navigate(['/hr/employees']);
        },
        error => {
          this.notificationService.showError('فشل في إنشاء الموظف');
          this.isSubmitting = false;
        }
      );
    }
  }
  
  onCancel(): void {
    this.router.navigate(['/hr/employees']);
  }
}
