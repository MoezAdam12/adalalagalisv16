import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-role-form',
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnInit {
  roleForm: FormGroup;
  permissions: any[] = [];
  groupedPermissions: any = {};
  isEditMode = false;
  roleId: string = '';
  loading = false;
  submitting = false;
  error = '';
  success = '';
  
  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      permissions: [[]]
    });
  }

  ngOnInit(): void {
    this.loadPermissions();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.roleId = params['id'];
        this.loadRole(this.roleId);
      }
    });
  }

  loadPermissions(): void {
    this.loading = true;
    this.roleService.getPermissions().subscribe(
      (response) => {
        if (response && response.data) {
          this.permissions = response.data.permissions;
          this.groupedPermissions = response.data.groupedPermissions;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load permissions:', error);
        this.error = 'فشل في تحميل الصلاحيات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }

  loadRole(roleId: string): void {
    this.loading = true;
    this.error = '';
    
    this.roleService.getRoleById(roleId).subscribe(
      (response) => {
        if (response && response.data) {
          const role = response.data;
          
          // Populate form
          this.roleForm.patchValue({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions?.map((permission: any) => permission.id) || []
          });
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load role:', error);
        this.error = 'فشل في تحميل الدور. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';
    
    const roleData = { ...this.roleForm.value };
    
    if (this.isEditMode) {
      this.roleService.updateRole(this.roleId, roleData).subscribe(
        (response) => {
          this.success = 'تم تحديث الدور بنجاح';
          this.submitting = false;
          
          // Show notification
          this.notificationService.createNotification({
            user_id: 'current',
            title: 'تم تحديث الدور',
            message: `تم تحديث الدور ${roleData.name} بنجاح`,
            type: 'success',
            category: 'system'
          }).subscribe();
          
          // Navigate back to role list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/roles']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to update role:', error);
          this.error = error.message || 'فشل في تحديث الدور. يرجى المحاولة مرة أخرى.';
          this.submitting = false;
        }
      );
    } else {
      this.roleService.createRole(roleData).subscribe(
        (response) => {
          this.success = 'تم إنشاء الدور بنجاح';
          this.submitting = false;
          
          // Show notification
          this.notificationService.createNotification({
            user_id: 'current',
            title: 'تم إنشاء دور جديد',
            message: `تم إنشاء الدور ${roleData.name} بنجاح`,
            type: 'success',
            category: 'system'
          }).subscribe();
          
          // Navigate back to role list after short delay
          setTimeout(() => {
            this.router.navigate(['/admin/roles']);
          }, 1500);
        },
        (error) => {
          console.error('Failed to create role:', error);
          this.error = error.message || 'فشل في إنشاء الدور. يرجى المحاولة مرة أخرى.';
          this.submitting = false;
        }
      );
    }
  }

  toggleAllModulePermissions(module: string, event: any): void {
    const isChecked = event.target.checked;
    const modulePermissions = this.groupedPermissions[module].map((p: any) => p.id);
    const currentPermissions = this.roleForm.get('permissions')?.value || [];
    
    if (isChecked) {
      // Add all module permissions
      const newPermissions = [...currentPermissions];
      modulePermissions.forEach((permId: string) => {
        if (!newPermissions.includes(permId)) {
          newPermissions.push(permId);
        }
      });
      this.roleForm.get('permissions')?.setValue(newPermissions);
    } else {
      // Remove all module permissions
      const newPermissions = currentPermissions.filter((permId: string) => 
        !modulePermissions.includes(permId)
      );
      this.roleForm.get('permissions')?.setValue(newPermissions);
    }
  }

  isModuleFullySelected(module: string): boolean {
    const modulePermissions = this.groupedPermissions[module].map((p: any) => p.id);
    const currentPermissions = this.roleForm.get('permissions')?.value || [];
    
    return modulePermissions.every((permId: string) => 
      currentPermissions.includes(permId)
    );
  }

  isModulePartiallySelected(module: string): boolean {
    const modulePermissions = this.groupedPermissions[module].map((p: any) => p.id);
    const currentPermissions = this.roleForm.get('permissions')?.value || [];
    
    const hasAny = modulePermissions.some((permId: string) => 
      currentPermissions.includes(permId)
    );
    
    const hasAll = modulePermissions.every((permId: string) => 
      currentPermissions.includes(permId)
    );
    
    return hasAny && !hasAll;
  }

  cancel(): void {
    this.router.navigate(['/admin/roles']);
  }
}
