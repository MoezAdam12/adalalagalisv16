import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ModuleService } from '../../services/module.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ModuleFormDialogComponent } from '../module-form-dialog/module-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModuleIntegrationDialogComponent } from '../module-integration-dialog/module-integration-dialog.component';

@Component({
  selector: 'app-module-management',
  templateUrl: './module-management.component.html',
  styleUrls: ['./module-management.component.scss']
})
export class ModuleManagementComponent implements OnInit {
  // بيانات الوحدات
  modules: any[] = [];
  
  // تكوين جدول الوحدات
  displayedColumns: string[] = ['name', 'description', 'status', 'tenantCount', 'lastUpdated', 'actions'];
  dataSource: MatTableDataSource<any>;
  
  // مرشحات البحث
  searchTerm: string = '';
  statusFilter: string = 'all';
  
  // حالة التحميل
  loading: boolean = true;
  
  // الوحدة المحددة للتكوين
  selectedModule: any = null;
  
  // علامات التبويب النشطة
  activeTab: string = 'modules';
  
  // إحصائيات
  statistics = {
    totalModules: 0,
    activeModules: 0,
    totalFeatures: 0,
    totalIntegrations: 0
  };
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private moduleService: ModuleService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadModules();
  }
  
  /**
   * تحميل بيانات الوحدات
   */
  loadModules(): void {
    this.loading = true;
    
    this.moduleService.getAllModules().subscribe({
      next: (data) => {
        this.modules = data;
        this.dataSource = new MatTableDataSource(this.modules);
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
   * حساب الإحصائيات
   */
  calculateStatistics(): void {
    this.statistics.totalModules = this.modules.length;
    this.statistics.activeModules = this.modules.filter(m => m.status === 'active').length;
    this.statistics.totalFeatures = this.modules.reduce((sum, module) => {
      return sum + (module.features ? module.features.length : 0);
    }, 0);
    this.statistics.totalIntegrations = this.modules.reduce((sum, module) => {
      return sum + (module.integrations ? module.integrations.length : 0);
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
   * تطبيق مرشح البحث
   * @param event حدث تغيير النص
   */
  applyFilter(event: Event): void {
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
   * تطبيق المرشحات
   */
  applyFilters(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    
    if (this.statusFilter !== 'all') {
      this.dataSource.data = this.modules.filter(module => {
        return module.status === this.statusFilter && 
               (this.searchTerm === '' || 
                module.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                module.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      });
    } else {
      this.dataSource.data = this.modules.filter(module => {
        return this.searchTerm === '' || 
               module.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               module.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      });
    }
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  /**
   * إعادة تعيين المرشحات
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.dataSource.data = this.modules;
  }
  
  /**
   * فتح نافذة إضافة وحدة جديدة
   */
  openAddModuleDialog(): void {
    const dialogRef = this.dialog.open(ModuleFormDialogComponent, {
      width: '600px',
      data: {
        title: 'إضافة وحدة جديدة',
        module: {}
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addModule(result);
      }
    });
  }
  
  /**
   * فتح نافذة تعديل وحدة
   * @param module بيانات الوحدة
   */
  openEditModuleDialog(module: any): void {
    const dialogRef = this.dialog.open(ModuleFormDialogComponent, {
      width: '600px',
      data: {
        title: 'تعديل الوحدة',
        module: {...module}
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateModule(result);
      }
    });
  }
  
  /**
   * فتح نافذة تكوين التكامل
   * @param module بيانات الوحدة
   */
  openIntegrationDialog(module: any): void {
    const dialogRef = this.dialog.open(ModuleIntegrationDialogComponent, {
      width: '800px',
      data: {
        title: 'تكوين التكامل',
        module: {...module}
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateModuleIntegration(result);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد حذف وحدة
   * @param module بيانات الوحدة
   */
  openDeleteConfirmation(module: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من رغبتك في حذف الوحدة "${module.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteModule(module.id);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد تغيير حالة وحدة
   * @param module بيانات الوحدة
   * @param newStatus الحالة الجديدة
   */
  openStatusChangeConfirmation(module: any, newStatus: string): void {
    const statusText = newStatus === 'active' ? 'تفعيل' : 'تعطيل';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `تأكيد ${statusText} الوحدة`,
        message: `هل أنت متأكد من رغبتك في ${statusText} الوحدة "${module.name}"؟`,
        confirmText: 'تأكيد',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.changeModuleStatus(module.id, newStatus);
      }
    });
  }
  
  /**
   * تحديد وحدة للتكوين
   * @param module بيانات الوحدة
   */
  selectModule(module: any): void {
    this.selectedModule = module;
    this.changeTab('configuration');
  }
  
  /**
   * إضافة وحدة جديدة
   * @param moduleData بيانات الوحدة الجديدة
   */
  addModule(moduleData: any): void {
    this.moduleService.createModule(moduleData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تمت إضافة الوحدة بنجاح',
          duration: 3000
        });
        this.loadModules();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث بيانات وحدة
   * @param moduleData بيانات الوحدة المحدثة
   */
  updateModule(moduleData: any): void {
    this.moduleService.updateModule(moduleData.id, moduleData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث الوحدة بنجاح',
          duration: 3000
        });
        this.loadModules();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث تكامل وحدة
   * @param moduleData بيانات الوحدة المحدثة
   */
  updateModuleIntegration(moduleData: any): void {
    this.moduleService.updateModuleIntegration(moduleData.id, moduleData.integrations).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث تكامل الوحدة بنجاح',
          duration: 3000
        });
        this.loadModules();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حذف وحدة
   * @param moduleId معرف الوحدة
   */
  deleteModule(moduleId: string): void {
    this.moduleService.deleteModule(moduleId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حذف الوحدة بنجاح',
          duration: 3000
        });
        this.loadModules();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تغيير حالة وحدة
   * @param moduleId معرف الوحدة
   * @param status الحالة الجديدة
   */
  changeModuleStatus(moduleId: string, status: string): void {
    this.moduleService.updateModuleStatus(moduleId, status).subscribe({
      next: (response) => {
        const statusText = status === 'active' ? 'تفعيل' : 'تعطيل';
        this.notificationService.showNotification({
          type: 'success',
          message: `تم ${statusText} الوحدة بنجاح`,
          duration: 3000
        });
        this.loadModules();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حفظ تكوين الوحدة
   * @param moduleId معرف الوحدة
   * @param configuration تكوين الوحدة
   */
  saveModuleConfiguration(moduleId: string, configuration: any): void {
    this.moduleService.updateModuleConfiguration(moduleId, configuration).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حفظ تكوين الوحدة بنجاح',
          duration: 3000
        });
        this.loadModules();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * الحصول على لون حالة الوحدة
   * @param status حالة الوحدة
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
   * الحصول على نص حالة الوحدة
   * @param status حالة الوحدة
   * @returns نص الحالة
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'نشطة';
      case 'inactive':
        return 'غير نشطة';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return 'غير معروفة';
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
