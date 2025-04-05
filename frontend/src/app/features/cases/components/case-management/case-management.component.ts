import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { CaseService } from '../../services/case.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { CaseFormDialogComponent } from '../case-form-dialog/case-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-case-management',
  templateUrl: './case-management.component.html',
  styleUrls: ['./case-management.component.scss']
})
export class CaseManagementComponent implements OnInit {
  // بيانات القضايا
  cases: any[] = [];
  
  // تكوين جدول القضايا
  displayedColumns: string[] = ['caseNumber', 'title', 'client', 'type', 'status', 'court', 'hearingDate', 'assignedTo', 'actions'];
  dataSource: MatTableDataSource<any>;
  
  // مرشحات البحث
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  
  // حالة التحميل
  loading: boolean = true;
  
  // إحصائيات
  statistics = {
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    closedCases: 0,
    upcomingHearings: 0
  };
  
  // قائمة أنواع القضايا
  caseTypes: string[] = [
    'مدني',
    'جنائي',
    'تجاري',
    'عمالي',
    'أحوال شخصية',
    'إداري',
    'عقاري',
    'ضريبي',
    'أخرى'
  ];
  
  // قائمة حالات القضايا
  caseStatuses: string[] = [
    'جديدة',
    'قيد النظر',
    'معلقة',
    'مؤجلة',
    'مغلقة',
    'مستأنفة',
    'منتهية'
  ];
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private caseService: CaseService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCases();
  }
  
  /**
   * تحميل بيانات القضايا
   */
  loadCases(): void {
    this.loading = true;
    
    this.caseService.getAllCases().subscribe({
      next: (data) => {
        this.cases = data;
        this.dataSource = new MatTableDataSource(this.cases);
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
    this.statistics.totalCases = this.cases.length;
    this.statistics.activeCases = this.cases.filter(c => c.status !== 'مغلقة' && c.status !== 'منتهية').length;
    this.statistics.pendingCases = this.cases.filter(c => c.status === 'معلقة' || c.status === 'مؤجلة').length;
    this.statistics.closedCases = this.cases.filter(c => c.status === 'مغلقة' || c.status === 'منتهية').length;
    
    // حساب عدد جلسات الاستماع القادمة
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.statistics.upcomingHearings = this.cases.filter(c => {
      if (!c.hearingDate) return false;
      
      const hearingDate = new Date(c.hearingDate);
      hearingDate.setHours(0, 0, 0, 0);
      
      return hearingDate >= today && c.status !== 'مغلقة' && c.status !== 'منتهية';
    }).length;
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
   * تطبيق مرشح النوع
   * @param type النوع المحدد
   */
  applyTypeFilter(type: string): void {
    this.typeFilter = type;
    this.applyFilters();
  }
  
  /**
   * تطبيق المرشحات
   */
  applyFilters(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    
    if (this.statusFilter !== 'all' || this.typeFilter !== 'all') {
      this.dataSource.data = this.cases.filter(caseItem => {
        const matchesStatus = this.statusFilter === 'all' || caseItem.status === this.statusFilter;
        const matchesType = this.typeFilter === 'all' || caseItem.type === this.typeFilter;
        const matchesSearch = this.searchTerm === '' || 
                             caseItem.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             caseItem.caseNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             caseItem.client.name.toLowerCase().includes(this.searchTerm.toLowerCase());
        
        return matchesStatus && matchesType && matchesSearch;
      });
    } else {
      this.dataSource.data = this.cases.filter(caseItem => {
        return this.searchTerm === '' || 
               caseItem.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               caseItem.caseNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               caseItem.client.name.toLowerCase().includes(this.searchTerm.toLowerCase());
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
    this.typeFilter = 'all';
    this.dataSource.data = this.cases;
  }
  
  /**
   * فتح نافذة إضافة قضية جديدة
   */
  openAddCaseDialog(): void {
    const dialogRef = this.dialog.open(CaseFormDialogComponent, {
      width: '800px',
      data: {
        title: 'إضافة قضية جديدة',
        case: {},
        caseTypes: this.caseTypes,
        caseStatuses: this.caseStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addCase(result);
      }
    });
  }
  
  /**
   * فتح نافذة تعديل قضية
   * @param caseData بيانات القضية
   */
  openEditCaseDialog(caseData: any): void {
    const dialogRef = this.dialog.open(CaseFormDialogComponent, {
      width: '800px',
      data: {
        title: 'تعديل القضية',
        case: {...caseData},
        caseTypes: this.caseTypes,
        caseStatuses: this.caseStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCase(result);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد حذف قضية
   * @param caseData بيانات القضية
   */
  openDeleteConfirmation(caseData: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من رغبتك في حذف القضية "${caseData.title}" (${caseData.caseNumber})؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteCase(caseData.id);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد تغيير حالة قضية
   * @param caseData بيانات القضية
   * @param newStatus الحالة الجديدة
   */
  openStatusChangeConfirmation(caseData: any, newStatus: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `تأكيد تغيير حالة القضية`,
        message: `هل أنت متأكد من رغبتك في تغيير حالة القضية "${caseData.title}" (${caseData.caseNumber}) إلى "${newStatus}"؟`,
        confirmText: 'تأكيد',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.changeCaseStatus(caseData.id, newStatus);
      }
    });
  }
  
  /**
   * عرض تفاصيل القضية
   * @param caseId معرف القضية
   */
  viewCaseDetails(caseId: string): void {
    this.router.navigate(['/cases', caseId]);
  }
  
  /**
   * إضافة قضية جديدة
   * @param caseData بيانات القضية الجديدة
   */
  addCase(caseData: any): void {
    this.caseService.createCase(caseData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تمت إضافة القضية بنجاح',
          duration: 3000
        });
        this.loadCases();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث بيانات قضية
   * @param caseData بيانات القضية المحدثة
   */
  updateCase(caseData: any): void {
    this.caseService.updateCase(caseData.id, caseData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث القضية بنجاح',
          duration: 3000
        });
        this.loadCases();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حذف قضية
   * @param caseId معرف القضية
   */
  deleteCase(caseId: string): void {
    this.caseService.deleteCase(caseId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حذف القضية بنجاح',
          duration: 3000
        });
        this.loadCases();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تغيير حالة قضية
   * @param caseId معرف القضية
   * @param status الحالة الجديدة
   */
  changeCaseStatus(caseId: string, status: string): void {
    this.caseService.updateCaseStatus(caseId, status).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: `تم تغيير حالة القضية إلى "${status}" بنجاح`,
          duration: 3000
        });
        this.loadCases();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * الحصول على لون حالة القضية
   * @param status حالة القضية
   * @returns لون الحالة
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'جديدة':
        return 'info';
      case 'قيد النظر':
        return 'primary';
      case 'معلقة':
        return 'warning';
      case 'مؤجلة':
        return 'accent';
      case 'مغلقة':
        return 'secondary';
      case 'مستأنفة':
        return 'danger';
      case 'منتهية':
        return 'success';
      default:
        return 'default';
    }
  }
  
  /**
   * تنسيق التاريخ
   * @param date التاريخ
   * @returns التاريخ المنسق
   */
  formatDate(date: string): string {
    if (!date) return 'غير محدد';
    
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
