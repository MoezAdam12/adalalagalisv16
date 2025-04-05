import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../services/role.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-list',
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent implements OnInit {
  roles: any[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  searchTerm = '';

  constructor(
    private roleService: RoleService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.error = '';

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm
    };

    this.roleService.getRoles(params).subscribe(
      (response) => {
        if (response && response.data) {
          this.roles = response.data.roles;
          this.totalItems = response.data.pagination.total;
          this.totalPages = response.data.pagination.pages;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load roles:', error);
        this.error = 'فشل في تحميل الأدوار. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRoles();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadRoles();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadRoles();
  }

  editRole(roleId: string): void {
    this.router.navigate(['/admin/roles/edit', roleId]);
  }

  viewRole(roleId: string): void {
    this.router.navigate(['/admin/roles/view', roleId]);
  }

  deleteRole(role: any): void {
    if (confirm(`هل أنت متأكد من حذف الدور "${role.name}"؟`)) {
      this.roleService.deleteRole(role.id).subscribe(
        () => {
          // Show notification
          this.notificationService.createNotification({
            user_id: 'current',
            title: 'تم حذف الدور',
            message: `تم حذف الدور ${role.name} بنجاح`,
            type: 'info',
            category: 'system'
          }).subscribe();
          
          // Reload roles
          this.loadRoles();
        },
        (error) => {
          console.error('Failed to delete role:', error);
          this.error = 'فشل في حذف الدور. يرجى المحاولة مرة أخرى.';
        }
      );
    }
  }

  addRole(): void {
    this.router.navigate(['/admin/roles/add']);
  }

  viewRoleUsers(roleId: string): void {
    this.router.navigate(['/admin/roles', roleId, 'users']);
  }

  getPermissionCount(role: any): number {
    return role.permissions?.length || 0;
  }
}
