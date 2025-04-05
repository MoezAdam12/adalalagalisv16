import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionPackageService } from '../../services/subscription-package.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { SubscriptionPackageFormDialogComponent } from '../subscription-package-form-dialog/subscription-package-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-subscription-management',
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss']
})
export class SubscriptionManagementComponent implements OnInit {
  // بيانات خطط الاشتراك
  subscriptionPackages: any[] = [];
  
  // بيانات اشتراكات المستأجرين
  tenantSubscriptions: any[] = [];
  
  // تكوين جدول خطط الاشتراك
  packagesDisplayedColumns: string[] = ['name', 'price', 'billingCycle', 'features', 'maxUsers', 'status', 'actions'];
  packagesDataSource: MatTableDataSource<any>;
  
  // تكوين جدول اشتراكات المستأجرين
  subscriptionsDisplayedColumns: string[] = ['tenant', 'package', 'startDate', 'endDate', 'status', 'amount', 'actions'];
  subscriptionsDataSource: MatTableDataSource<any>;
  
  // حالة التحميل
  loading: boolean = true;
  
  // علامات التبويب النشطة
  activeTab: string = 'packages';
  
  // إحصائيات
  statistics = {
    totalPackages: 0,
    activePackages: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  };
  
  @ViewChild('packagesPaginator') packagesPaginator: MatPaginator;
  @ViewChild('packagesSort') packagesSort: MatSort;
  @ViewChild('subscriptionsPaginator') subscriptionsPaginator: MatPaginator;
  @ViewChild('subscriptionsSort') subscriptionsSort: MatSort;
  
  constructor(
    private subscriptionPackageService: SubscriptionPackageService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadSubscriptionPackages();
    this.loadTenantSubscriptions();
  }
  
  /**
   * تحميل بيانات خطط الاشتراك
   */
  loadSubscriptionPackages(): void {
    this.loading = true;
    
    this.subscriptionPackageService.getAllPackages().subscribe({
      next: (data) => {
        this.subscriptionPackages = data;
        this.packagesDataSource = new MatTableDataSource(this.subscriptionPackages);
        this.packagesDataSource.paginator = this.packagesPaginator;
        this.packagesDataSource.sort = this.packagesSort;
        this.calculatePackageStatistics();
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
  }
  
  /**
   * تحميل بيانات اشتراكات المستأجرين
   */
  loadTenantSubscriptions(): void {
    this.loading = true;
    
    this.subscriptionPackageService.getAllTenantSubscriptions().subscribe({
      next: (data) => {
        this.tenantSubscriptions = data;
        this.subscriptionsDataSource = new MatTableDataSource(this.tenantSubscriptions);
        this.subscriptionsDataSource.paginator = this.subscriptionsPaginator;
        this.subscriptionsDataSource.sort = this.subscriptionsSort;
        this.calculateSubscriptionStatistics();
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
  }
  
  /**
   * حساب إحصائيات خطط الاشتراك
   */
  calculatePackageStatistics(): void {
    this.statistics.totalPackages = this.subscriptionPackages.length;
    this.statistics.activePackages = this.subscriptionPackages.filter(p => p.status === 'active').length;
  }
  
  /**
   * حساب إحصائيات اشتراكات المستأجرين
   */
  calculateSubscriptionStatistics(): void {
    this.statistics.totalSubscriptions = this.tenantSubscriptions.length;
    this.statistics.activeSubscriptions = this.tenantSubscriptions.filter(s => s.status === 'active').length;
    
    // حساب إجمالي الإيرادات
    this.statistics.totalRevenue = this.tenantSubscriptions.reduce((sum, subscription) => {
      return sum + (subscription.amount || 0);
    }, 0);
    
    // حساب إيرادات الشهر الحالي
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    this.statistics.monthlyRevenue = this.tenantSubscriptions
      .filter(subscription => {
        const startDate = new Date(subscription.startDate);
        return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
      })
      .reduce((sum, subscription) => {
        return sum + (subscription.amount || 0);
      }, 0);
  }
  
  /**
   * تغيير علامة التبويب النشطة
   * @param tabName اسم علامة التبويب
   */
  changeTab(tabName: string): void {
    this.activeTab = tabName;
  }
  
  /**
   * تطبيق مرشح البحث على جدول خطط الاشتراك
   * @param event حدث تغيير النص
   */
  applyPackagesFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.packagesDataSource.filter = filterValue.trim().toLowerCase();

    if (this.packagesDataSource.paginator) {
      this.packagesDataSource.paginator.firstPage();
    }
  }
  
  /**
   * تطبيق مرشح البحث على جدول اشتراكات المستأجرين
   * @param event حدث تغيير النص
   */
  applySubscriptionsFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.subscriptionsDataSource.filter = filterValue.trim().toLowerCase();

    if (this.subscriptionsDataSource.paginator) {
      this.subscriptionsDataSource.paginator.firstPage();
    }
  }
  
  /**
   * فتح نافذة إضافة خطة اشتراك جديدة
   */
  openAddPackageDialog(): void {
    const dialogRef = this.dialog.open(SubscriptionPackageFormDialogComponent, {
      width: '600px',
      data: {
        title: 'إضافة خطة اشتراك جديدة',
        package: {}
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addSubscriptionPackage(result);
      }
    });
  }
  
  /**
   * فتح نافذة تعديل خطة اشتراك
   * @param packageData بيانات خطة الاشتراك
   */
  openEditPackageDialog(packageData: any): void {
    const dialogRef = this.dialog.open(SubscriptionPackageFormDialogComponent, {
      width: '600px',
      data: {
        title: 'تعديل خطة الاشتراك',
        package: {...packageData}
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateSubscriptionPackage(result);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد حذف خطة اشتراك
   * @param packageData بيانات خطة الاشتراك
   */
  openDeletePackageConfirmation(packageData: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من رغبتك في حذف خطة الاشتراك "${packageData.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteSubscriptionPackage(packageData.id);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد تغيير حالة خطة اشتراك
   * @param packageData بيانات خطة الاشتراك
   * @param newStatus الحالة الجديدة
   */
  openPackageStatusChangeConfirmation(packageData: any, newStatus: string): void {
    const statusText = newStatus === 'active' ? 'تفعيل' : 'تعطيل';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `تأكيد ${statusText} خطة الاشتراك`,
        message: `هل أنت متأكد من رغبتك في ${statusText} خطة الاشتراك "${packageData.name}"؟`,
        confirmText: 'تأكيد',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.changePackageStatus(packageData.id, newStatus);
      }
    });
  }
  
  /**
   * إضافة خطة اشتراك جديدة
   * @param packageData بيانات خطة الاشتراك الجديدة
   */
  addSubscriptionPackage(packageData: any): void {
    this.subscriptionPackageService.createPackage(packageData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تمت إضافة خطة الاشتراك بنجاح',
          duration: 3000
        });
        this.loadSubscriptionPackages();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث بيانات خطة اشتراك
   * @param packageData بيانات خطة الاشتراك المحدثة
   */
  updateSubscriptionPackage(packageData: any): void {
    this.subscriptionPackageService.updatePackage(packageData.id, packageData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث خطة الاشتراك بنجاح',
          duration: 3000
        });
        this.loadSubscriptionPackages();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حذف خطة اشتراك
   * @param packageId معرف خطة الاشتراك
   */
  deleteSubscriptionPackage(packageId: string): void {
    this.subscriptionPackageService.deletePackage(packageId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حذف خطة الاشتراك بنجاح',
          duration: 3000
        });
        this.loadSubscriptionPackages();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تغيير حالة خطة اشتراك
   * @param packageId معرف خطة الاشتراك
   * @param status الحالة الجديدة
   */
  changePackageStatus(packageId: string, status: string): void {
    this.subscriptionPackageService.updatePackageStatus(packageId, status).subscribe({
      next: (response) => {
        const statusText = status === 'active' ? 'تفعيل' : 'تعطيل';
        this.notificationService.showNotification({
          type: 'success',
          message: `تم ${statusText} خطة الاشتراك بنجاح`,
          duration: 3000
        });
        this.loadSubscriptionPackages();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد إلغاء اشتراك مستأجر
   * @param subscription بيانات الاشتراك
   */
  openCancelSubscriptionConfirmation(subscription: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد إلغاء الاشتراك',
        message: `هل أنت متأكد من رغبتك في إلغاء اشتراك "${subscription.tenant.name}" في خطة "${subscription.package.name}"؟`,
        confirmText: 'إلغاء الاشتراك',
        cancelText: 'إغلاق'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cancelSubscription(subscription.id);
      }
    });
  }
  
  /**
   * إلغاء اشتراك مستأجر
   * @param subscriptionId معرف الاشتراك
   */
  cancelSubscription(subscriptionId: string): void {
    this.subscriptionPackageService.cancelSubscription(subscriptionId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم إلغاء الاشتراك بنجاح',
          duration: 3000
        });
        this.loadTenantSubscriptions();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * الحصول على لون حالة الاشتراك
   * @param status حالة الاشتراك
   * @returns لون الحالة
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  }
  
  /**
   * الحصول على نص حالة الاشتراك
   * @param status حالة الاشتراك
   * @returns نص الحالة
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return 'غير معروف';
    }
  }
  
  /**
   * الحصول على نص دورة الفوترة
   * @param cycle دورة الفوترة
   * @returns نص دورة الفوترة
   */
  getBillingCycleText(cycle: string): string {
    switch (cycle) {
      case 'monthly':
        return 'شهري';
      case 'quarterly':
        return 'ربع سنوي';
      case 'biannual':
        return 'نصف سنوي';
      case 'annual':
        return 'سنوي';
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
