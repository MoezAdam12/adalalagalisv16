import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { TenantService } from '../../services/tenant.service';
import { SubscriptionPackageService } from '../../services/subscription-package.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { TenantFormDialogComponent } from '../tenant-form-dialog/tenant-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TenantDetailsComponent } from '../tenant-details/tenant-details.component';

@Component({
  selector: 'app-tenant-management',
  templateUrl: './tenant-management.component.html',
  styleUrls: ['./tenant-management.component.scss']
})
export class TenantManagementComponent implements OnInit {
  // بيانات المستأجرين
  tenants: any[] = [];
  filteredTenants: any[] = [];
  
  // بيانات حزم الاشتراكات
  subscriptionPackages: any[] = [];
  
  // تكوين جدول المستأجرين
  displayedColumns: string[] = ['name', 'email', 'subscriptionPackage', 'status', 'usersCount', 'createdAt', 'actions'];
  dataSource: MatTableDataSource<any>;
  
  // مرشحات البحث
  searchTerm: string = '';
  statusFilter: string = 'all';
  packageFilter: string = 'all';
  
  // حالة التحميل
  loading: boolean = true;
  
  // إحصائيات عامة
  statistics = {
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    trialTenants: 0,
    totalRevenue: 0
  };
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private tenantService: TenantService,
    private subscriptionPackageService: SubscriptionPackageService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadTenants();
    this.loadSubscriptionPackages();
  }
  
  /**
   * تحميل بيانات المستأجرين
   */
  loadTenants(): void {
    this.loading = true;
    
    this.tenantService.getAllTenants().subscribe({
      next: (data) => {
        this.tenants = data;
        this.filteredTenants = [...this.tenants];
        this.dataSource = new MatTableDataSource(this.filteredTenants);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.calculateStatistics();
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
  }
  
  /**
   * تحميل بيانات حزم الاشتراكات
   */
  loadSubscriptionPackages(): void {
    this.subscriptionPackageService.getAllPackages().subscribe({
      next: (data) => {
        this.subscriptionPackages = data;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حساب الإحصائيات
   */
  calculateStatistics(): void {
    this.statistics.totalTenants = this.tenants.length;
    this.statistics.activeTenants = this.tenants.filter(t => t.status === 'active').length;
    this.statistics.suspendedTenants = this.tenants.filter(t => t.status === 'suspended').length;
    this.statistics.trialTenants = this.tenants.filter(t => t.status === 'trial').length;
    this.statistics.totalRevenue = this.tenants.reduce((sum, tenant) => {
      return sum + (tenant.subscriptionAmount || 0);
    }, 0);
  }
  
  /**
   * تطبيق المرشحات
   */
  applyFilters(): void {
    this.filteredTenants = this.tenants.filter(tenant => {
      // تطبيق مرشح البحث
      const searchMatch = !this.searchTerm || 
        tenant.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tenant.contactPerson?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // تطبيق مرشح الحالة
      const statusMatch = this.statusFilter === 'all' || tenant.status === this.statusFilter;
      
      // تطبيق مرشح الباقة
      const packageMatch = this.packageFilter === 'all' || tenant.subscriptionPackageId === this.packageFilter;
      
      return searchMatch && statusMatch && packageMatch;
    });
    
    this.dataSource.data = this.filteredTenants;
  }
  
  /**
   * تطبيق مرشح البحث
   * @param event حدث تغيير النص
   */
  applySearchFilter(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }
  
  /**
   * تطبيق مرشح الحالة
   * @param status الحالة المحددة
   */
  applyStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }
  
  /**
   * تطبيق مرشح الباقة
   * @param packageId معرف الباقة المحددة
   */
  applyPackageFilter(packageId: string): void {
    this.packageFilter = packageId;
    this.applyFilters();
  }
  
  /**
   * إعادة تعيين جميع المرشحات
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.packageFilter = 'all';
    this.filteredTenants = [...this.tenants];
    this.dataSource.data = this.filteredTenants;
  }
  
  /**
   * فتح نافذة إضافة مستأجر جديد
   */
  openAddTenantDialog(): void {
    const dialogRef = this.dialog.open(TenantFormDialogComponent, {
      width: '600px',
      data: {
        title: 'إضافة مستأجر جديد',
        tenant: {},
        packages: this.subscriptionPackages
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addTenant(result);
      }
    });
  }
  
  /**
   * فتح نافذة تعديل مستأجر
   * @param tenant بيانات المستأجر
   */
  openEditTenantDialog(tenant: any): void {
    const dialogRef = this.dialog.open(TenantFormDialogComponent, {
      width: '600px',
      data: {
        title: 'تعديل بيانات المستأجر',
        tenant: {...tenant},
        packages: this.subscriptionPackages
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTenant(result);
      }
    });
  }
  
  /**
   * فتح نافذة تفاصيل المستأجر
   * @param tenant بيانات المستأجر
   */
  openTenantDetails(tenant: any): void {
    this.dialog.open(TenantDetailsComponent, {
      width: '800px',
      data: {
        tenant: tenant
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد حذف المستأجر
   * @param tenant بيانات المستأجر
   */
  openDeleteConfirmation(tenant: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من رغبتك في حذف المستأجر "${tenant.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteTenant(tenant.id);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد تغيير حالة المستأجر
   * @param tenant بيانات المستأجر
   * @param newStatus الحالة الجديدة
   */
  openStatusChangeConfirmation(tenant: any, newStatus: string): void {
    const statusText = newStatus === 'active' ? 'تفعيل' : 'تعليق';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `تأكيد ${statusText} المستأجر`,
        message: `هل أنت متأكد من رغبتك في ${statusText} المستأجر "${tenant.name}"؟`,
        confirmText: 'تأكيد',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.changeTenantStatus(tenant.id, newStatus);
      }
    });
  }
  
  /**
   * إضافة مستأجر جديد
   * @param tenantData بيانات المستأجر الجديد
   */
  addTenant(tenantData: any): void {
    this.tenantService.createTenant(tenantData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تمت إضافة المستأجر بنجاح',
          duration: 3000
        });
        this.loadTenants();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث بيانات مستأجر
   * @param tenantData بيانات المستأجر المحدثة
   */
  updateTenant(tenantData: any): void {
    this.tenantService.updateTenant(tenantData.id, tenantData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث بيانات المستأجر بنجاح',
          duration: 3000
        });
        this.loadTenants();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حذف مستأجر
   * @param tenantId معرف المستأجر
   */
  deleteTenant(tenantId: string): void {
    this.tenantService.deleteTenant(tenantId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حذف المستأجر بنجاح',
          duration: 3000
        });
        this.loadTenants();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تغيير حالة المستأجر
   * @param tenantId معرف المستأجر
   * @param status الحالة الجديدة
   */
  changeTenantStatus(tenantId: string, status: string): void {
    this.tenantService.updateTenantStatus(tenantId, status).subscribe({
      next: (response) => {
        const statusText = status === 'active' ? 'تفعيل' : 'تعليق';
        this.notificationService.showNotification({
          type: 'success',
          message: `تم ${statusText} المستأجر بنجاح`,
          duration: 3000
        });
        this.loadTenants();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * الحصول على اسم الباقة من معرفها
   * @param packageId معرف الباقة
   * @returns اسم الباقة
   */
  getPackageName(packageId: string): string {
    const pkg = this.subscriptionPackages.find(p => p.id === packageId);
    return pkg ? pkg.name : 'غير محدد';
  }
  
  /**
   * الحصول على لون حالة المستأجر
   * @param status حالة المستأجر
   * @returns لون الحالة
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'danger';
      case 'trial':
        return 'warning';
      default:
        return 'secondary';
    }
  }
  
  /**
   * الحصول على نص حالة المستأجر
   * @param status حالة المستأجر
   * @returns نص الحالة
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'suspended':
        return 'معلق';
      case 'trial':
        return 'تجريبي';
      default:
        return 'غير معروف';
    }
  }
  
  /**
   * تنسيق التاريخ
   * @param date التاريخ
   * @returns التاريخ المنسق
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
