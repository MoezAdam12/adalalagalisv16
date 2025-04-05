import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  roles: any[] = [];
  isEditMode = false;
  userId: string = '';
  loading = false;
  submitting = false;
  error = '';
  success = '';
  passwordRequired = true;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      role: ['user', Validators.required],
      job_title: [''],
      department: [''],
      phone_number: ['', [Validators.pattern(/^[+]?[0-9]{8,15}$/)]],
      status: ['active'],
      roles: [[]]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = params['id'];
        this.passwordRequired = false;
        this.loadUser(this.userId);
        
        // Make password optional in edit mode
        this.userForm.get('password')?.setValidators(Validators.minLength(8));
        this.userForm.get('password')?.updateValueAndValidity();
      }
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe(
      (response) => {
        if (response && response.data) {
          this.roles = response.data;
        }
      },
      (error) => {
        console.error('Failed to load roles:', error);
        this.error = 'Failed to load roles. Please try again.';
      }
    );
  }

  loadUser(userId: string): void {
    this.loading = true;
    this.error = '';
    
    this.userService.getUserById(userId).subscribe(
      (response) => {
        if (response && response.data) {
          const user = response.data;
          
          // Populate form
          this.userForm.patchValue({
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            job_title: user.job_title || '',
            department: user.department || '',
            phone_number: user.phone_number || '',
            status: user.status,
            roles: user.roles?.map((role: any) => role.id) || []
          });
          
          // Clear password field in edit mode
          this.userForm.get('password')?.setValue('');
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load user:', error);
        this.error = 'Failed to load user. Please try again.';
        this.loading = false;
      }
    );
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';
    
    const userData = { ...this.userForm.value };
    
    // Remove password if empty in edit mode
    if (this.isEditMode && !userData.password) {
      delete userData.password;
    }
    
    if (this.isEditMode) {
      this.userService.updateUser(this.userId, userData).subscribe(
        (response) => {
          this.success = 'User updated successfully';
          this.submitting = false;
          
          // Show notification
          this.notificationService.createNotification({
            user_id: 'current',
            title: 'تم تحديث المستخدم',
            message: `تم تحديث المستخدم ${userData.first_name} ${userData.last_name} بنجاح`,
            type: 'success',
            category: 'system'
          }).subscribe();
          
          // Navigate back to user list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/users']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to update user:', error);
          this.error = error.message || 'Failed to update user. Please try again.';
          this.submitting = false;
        }
      );
    } else {
      this.userService.createUser(userData).subscribe(
        (response) => {
          this.success = 'User created successfully';
          this.submitting = false;
          
          // Show notification
          this.notificationService.createNotification({
            user_id: 'current',
            title: 'تم إنشاء مستخدم جديد',
            message: `تم إنشاء المستخدم ${userData.first_name} ${userData.last_name} بنجاح`,
            type: 'success',
            category: 'system'
          }).subscribe();
          
          // Navigate back to user list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/users']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to create user:', error);
          this.error = error.message || 'Failed to create user. Please try again.';
          this.submitting = false;
        }
      );
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
