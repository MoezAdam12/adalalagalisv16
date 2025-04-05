import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ConsultationService } from '../../services/consultation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ConsultationFormDialogComponent } from '../consultation-form-dialog/consultation-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-consultation-management',
  templateUrl: './consultation-management.component.html',
  styleUrls: ['./consultation-management.component.scss'],
  providers: [DatePipe]
})
export class ConsultationManagementComponent implements OnInit {
  // بيانات الاستشارات
  consultations: any[] = [];
  
  // تكوين جدول الاستشارات
  displayedColumns: string[] = ['consultationNumber', 'title', 'client', 'type', 'status', 'requestDate', 'dueDate', 'assignedTo', 'actions'];
  dataSource: MatTableDataSource<any>;
  
  // مرشحات البحث
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  
  // حالة التحميل
  loading: boolean = true;
  
  // إحصائيات
  statistics = {
    totalConsultations: 0,
    pendingConsultations: 0,
    inProgressConsultations: 0,
    completedConsultations: 0,
    overdueConsultations: 0
  };
  
  // قائمة أنواع الاستشارات
  consultationTypes: string[] = [
    'قانون مدني',
    'قانون جنائي',
    'قانون تجاري',
    'قانون عمل',
    'أحوال شخصية',
    'قانون إداري',
    'قانون عقاري',
    'قانون ضريبي',
    'قانون دولي',
    'أخرى'
  ];
  
  // قائمة حالات الاستشارات
  consultationStatuses: string[] = [
    'جديدة',
    'قيد المراجعة',
    'قيد التنفيذ',
    'بانتظار معلومات إضافية',
    'مكتملة',
    'ملغاة'
  ];
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private consultationService: ConsultationService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadConsultations();
  }
  
  /**
   * تحميل بيانات الاستشارات
   */
  loadConsultations(): void {
    this.loading = true;
    
    this.consultationService.getAllConsultations().subscribe({
      next: (data) => {
        this.consultations = data;
        this.dataSource = new MatTableDataSource(this.consultations);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.statistics.totalConsultations = this.consultations.length;
    this.statistics.pendingConsultations = this.consultations.filter(c => c.status === 'جديدة' || c.status === 'قيد المراجعة').length;
    this.statistics.inProgressConsultations = this.consultations.filter(c => c.status === 'قيد التنفيذ' || c.status === 'بانتظار معلومات إضافية').length;
    this.statistics.completedConsultations = this.consultations.filter(c => c.status === 'مكتملة').length;
    
    // حساب الاستشارات المتأخرة
    this.statistics.overdueConsultations = this.consultations.filter(c => {
      if (!c.dueDate || c.status === 'مكتملة' || c.status === 'ملغاة') return false;
      
      const dueDate = new Date(c.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate < today;
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
      this.dataSource.data = this.consultations.filter(consultation => {
        const matchesStatus = this.statusFilter === 'all' || consultation.status === this.statusFilter;
        const matchesType = this.typeFilter === 'all' || consultation.type === this.typeFilter;
        const matchesSearch = this.searchTerm === '' || 
                             consultation.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             consultation.consultationNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             consultation.client.name.toLowerCase().includes(this.searchTerm.toLowerCase());
        
        return matchesStatus && matchesType && matchesSearch;
      });
    } else {
      this.dataSource.data = this.consultations.filter(consultation => {
        return this.searchTerm === '' || 
               consultation.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               consultation.consultationNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               consultation.client.name.toLowerCase().includes(this.searchTerm.toLowerCase());
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
    this.dataSource.data = this.consultations;
  }
  
  /**
   * فتح نافذة إضافة استشارة جديدة
   */
  openAddConsultationDialog(): void {
    const dialogRef = this.dialog.open(ConsultationFormDialogComponent, {
      width: '800px',
      data: {
        title: 'إضافة استشارة جديدة',
        consultation: {},
        consultationTypes: this.consultationTypes,
        consultationStatuses: this.consultationStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addConsultation(result);
      }
    });
  }
  
  /**
   * فتح نافذة تعديل استشارة
   * @param consultationData بيانات الاستشارة
   */
  openEditConsultationDialog(consultationData: any): void {
    const dialogRef = this.dialog.open(ConsultationFormDialogComponent, {
      width: '800px',
      data: {
        title: 'تعديل الاستشارة',
        consultation: {...consultationData},
        consultationTypes: this.consultationTypes,
        consultationStatuses: this.consultationStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateConsultation(result);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد حذف استشارة
   * @param consultationData بيانات الاستشارة
   */
  openDeleteConfirmation(consultationData: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من رغبتك في حذف الاستشارة "${consultationData.title}" (${consultationData.consultationNumber})؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteConsultation(consultationData.id);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد تغيير حالة استشارة
   * @param consultationData بيانات الاستشارة
   * @param newStatus الحالة الجديدة
   */
  openStatusChangeConfirmation(consultationData: any, newStatus: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `تأكيد تغيير حالة الاستشارة`,
        message: `هل أنت متأكد من رغبتك في تغيير حالة الاستشارة "${consultationData.title}" (${consultationData.consultationNumber}) إلى "${newStatus}"؟`,
        confirmText: 'تأكيد',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.changeConsultationStatus(consultationData.id, newStatus);
      }
    });
  }
  
  /**
   * عرض تفاصيل الاستشارة
   * @param consultationId معرف الاستشارة
   */
  viewConsultationDetails(consultationId: string): void {
    this.router.navigate(['/consultations', consultationId]);
  }
  
  /**
   * إضافة استشارة جديدة
   * @param consultationData بيانات الاستشارة الجديدة
   */
  addConsultation(consultationData: any): void {
    this.consultationService.createConsultation(consultationData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تمت إضافة الاستشارة بنجاح',
          duration: 3000
        });
        this.loadConsultations();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث بيانات استشارة
   * @param consultationData بيانات الاستشارة المحدثة
   */
  updateConsultation(consultationData: any): void {
    this.consultationService.updateConsultation(consultationData.id, consultationData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث الاستشارة بنجاح',
          duration: 3000
        });
        this.loadConsultations();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حذف استشارة
   * @param consultationId معرف الاستشارة
   */
  deleteConsultation(consultationId: string): void {
    this.consultationService.deleteConsultation(consultationId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حذف الاستشارة بنجاح',
          duration: 3000
        });
        this.loadConsultations();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تغيير حالة استشارة
   * @param consultationId معرف الاستشارة
   * @param status الحالة الجديدة
   */
  changeConsultationStatus(consultationId: string, status: string): void {
    this.consultationService.updateConsultationStatus(consultationId, status).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: `تم تغيير حالة الاستشارة إلى "${status}" بنجاح`,
          duration: 3000
        });
        this.loadConsultations();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * الحصول على لون حالة الاستشارة
   * @param status حالة الاستشارة
   * @returns لون الحالة
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'جديدة':
        return 'info';
      case 'قيد المراجعة':
        return 'primary';
      case 'قيد التنفيذ':
        return 'warning';
      case 'بانتظار معلومات إضافية':
        return 'accent';
      case 'مكتملة':
        return 'success';
      case 'ملغاة':
        return 'danger';
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
    
    return this.datePipe.transform(date, 'yyyy-MM-dd');
  }
  
  /**
   * التحقق من تأخر الاستشارة
   * @param consultation بيانات الاستشارة
   * @returns هل الاستشارة متأخرة
   */
  isConsultationOverdue(consultation: any): boolean {
    if (!consultation.dueDate || consultation.status === 'مكتملة' || consultation.status === 'ملغاة') return false;
    
    const dueDate = new Date(consultation.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  }
  
  /**
   * التحقق من اقتراب موعد استحقاق الاستشارة
   * @param consultation بيانات الاستشارة
   * @returns هل موعد استحقاق الاستشارة قريب
   */
  isConsultationDueSoon(consultation: any): boolean {
    if (!consultation.dueDate || consultation.status === 'مكتملة' || consultation.status === 'ملغاة') return false;
    
    const dueDate = new Date(consultation.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);
    
    return dueDate <= threeDaysFromNow && dueDate >= today;
  }
}
