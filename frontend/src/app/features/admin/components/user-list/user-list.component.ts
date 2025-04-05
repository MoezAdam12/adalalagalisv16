import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  searchTerm = '';
  statusFilter = '';
  roleFilter = '';
  sortBy = 'created_at';
  sortOrder = 'DESC';

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm,
      status: this.statusFilter,
      role: this.roleFilter,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.userService.getUsers(params).subscribe(
      (response) => {
        if (response && response.data) {
          this.users = response.data.users;
          this.totalItems = response.data.pagination.total;
          this.totalPages = response.data.pagination.pages;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load users:', error);
        this.error = 'فشل في تحميل المستخدمين. يرجى المحاولة مرة أخرى.';
        this.loading = false;
      }
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.roleFilter = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  changeSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
    this.loadUsers();
  }

  editUser(userId: string): void {
    this.router.navigate(['/admin/users/edit', userId]);
  }

  viewUser(userId: string): void {
    this.router.navigate(['/admin/users/view', userId]);
  }

  deleteUser(user: any): void {
    if (confirm(`هل أنت متأكد من حذف المستخدم "${user.first_name} ${user.last_name}"؟`)) {
      this.userService.deleteUser(user.id).subscribe(
        () => {
          // Show notification
          this.notificationService.createNotification({
            user_id: 'current',
            title: 'تم حذف المستخدم',
            message: `تم حذف المستخدم ${user.first_name} ${user.last_name} بنجاح`,
            type: 'info',
            category: 'system'
          }).subscribe();
          
          // Reload users
          this.loadUsers();
        },
        (error) => {
          console.error('Failed to delete user:', error);
          this.error = 'فشل في حذف المستخدم. يرجى المحاولة مرة أخرى.';
        }
      );
    }
  }

  addUser(): void {
    this.router.navigate(['/admin/users/add']);
  }

  getUserStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge bg-success';
      case 'inactive':
        return 'badge bg-secondary';
      case 'suspended':
        return 'badge bg-danger';
      case 'pending':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  getUserStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'suspended':
        return 'معلق';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return status;
    }
  }

  getUserRoleText(role: string): string {
    switch (role) {
      case 'admin':
        return 'مدير';
      case 'manager':
        return 'مشرف';
      case 'lawyer':
        return 'محامي';
      case 'assistant':
        return 'مساعد';
      case 'user':
        return 'مستخدم';
      default:
        return role;
    }
  }
}
