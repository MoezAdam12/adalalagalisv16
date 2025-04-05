import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ContractService } from '../../services/contract.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ContractFormDialogComponent } from '../contract-form-dialog/contract-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-contract-management',
  templateUrl: './contract-management.component.html',
  styleUrls: ['./contract-management.component.scss'],
  providers: [DatePipe]
})
export class ContractManagementComponent implements OnInit {
  // بيانات العقود
  contracts: any[] = [];
  
  // تكوين جدول العقود
  displayedColumns: string[] = ['contractNumber', 'title', 'client', 'type', 'status', 'startDate', 'endDate', 'value', 'actions'];
  dataSource: MatTableDataSource<any>;
  
  // مرشحات البحث
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  
  // حالة التحميل
  loading: boolean = true;
  
  // إحصائيات
  statistics = {
    totalContracts: 0,
    activeContracts: 0,
    expiringContracts: 0,
    expiredContracts: 0,
    draftContracts: 0,
    totalValue: 0
  };
  
  // قائمة أنواع العقود
  contractTypes: string[] = [
    'استشارة قانونية',
    'تمثيل قانوني',
    'صياغة عقد',
    'مراجعة قانونية',
    'خدمات قانونية عامة',
    'اشتراك شهري',
    'اشتراك سنوي',
    'أخرى'
  ];
  
  // قائمة حالات العقود
  contractStatuses: string[] = [
    'مسودة',
    'قيد المراجعة',
    'نشط',
    'معلق',
    'منتهي',
    'ملغي',
    'مجدد'
  ];
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private contractService: ContractService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadContracts();
  }
  
  /**
   * تحميل بيانات العقود
   */
  loadContracts(): void {
    this.loading = true;
    
    this.contractService.getAllContracts().subscribe({
      next: (data) => {
        this.contracts = data;
        this.dataSource = new MatTableDataSource(this.contracts);
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
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    this.statistics.totalContracts = this.contracts.length;
    this.statistics.activeContracts = this.contracts.filter(c => c.status === 'نشط').length;
    this.statistics.draftContracts = this.contracts.filter(c => c.status === 'مسودة' || c.status === 'قيد المراجعة').length;
    this.statistics.expiredContracts = this.contracts.filter(c => c.status === 'منتهي' || c.status === 'ملغي').length;
    
    // حساب العقود التي ستنتهي خلال 30 يوم
    this.statistics.expiringContracts = this.contracts.filter(c => {
      if (!c.endDate || c.status !== 'نشط') return false;
      
      const endDate = new Date(c.endDate);
      return endDate <= thirtyDaysFromNow && endDate >= today;
    }).length;
    
    // حساب إجمالي قيمة العقود النشطة
    this.statistics.totalValue = this.contracts
      .filter(c => c.status === 'نشط')
      .reduce((total, contract) => total + (parseFloat(contract.value) || 0), 0);
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
      this.dataSource.data = this.contracts.filter(contract => {
        const matchesStatus = this.statusFilter === 'all' || contract.status === this.statusFilter;
        const matchesType = this.typeFilter === 'all' || contract.type === this.typeFilter;
        const matchesSearch = this.searchTerm === '' || 
                             contract.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             contract.contractNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             contract.client.name.toLowerCase().includes(this.searchTerm.toLowerCase());
        
        return matchesStatus && matchesType && matchesSearch;
      });
    } else {
      this.dataSource.data = this.contracts.filter(contract => {
        return this.searchTerm === '' || 
               contract.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               contract.contractNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               contract.client.name.toLowerCase().includes(this.searchTerm.toLowerCase());
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
    this.dataSource.data = this.contracts;
  }
  
  /**
   * فتح نافذة إضافة عقد جديد
   */
  openAddContractDialog(): void {
    const dialogRef = this.dialog.open(ContractFormDialogComponent, {
      width: '800px',
      data: {
        title: 'إضافة عقد جديد',
        contract: {},
        contractTypes: this.contractTypes,
        contractStatuses: this.contractStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addContract(result);
      }
    });
  }
  
  /**
   * فتح نافذة تعديل عقد
   * @param contractData بيانات العقد
   */
  openEditContractDialog(contractData: any): void {
    const dialogRef = this.dialog.open(ContractFormDialogComponent, {
      width: '800px',
      data: {
        title: 'تعديل العقد',
        contract: {...contractData},
        contractTypes: this.contractTypes,
        contractStatuses: this.contractStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateContract(result);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد حذف عقد
   * @param contractData بيانات العقد
   */
  openDeleteConfirmation(contractData: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من رغبتك في حذف العقد "${contractData.title}" (${contractData.contractNumber})؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteContract(contractData.id);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد تغيير حالة عقد
   * @param contractData بيانات العقد
   * @param newStatus الحالة الجديدة
   */
  openStatusChangeConfirmation(contractData: any, newStatus: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `تأكيد تغيير حالة العقد`,
        message: `هل أنت متأكد من رغبتك في تغيير حالة العقد "${contractData.title}" (${contractData.contractNumber}) إلى "${newStatus}"؟`,
        confirmText: 'تأكيد',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.changeContractStatus(contractData.id, newStatus);
      }
    });
  }
  
  /**
   * فتح نافذة تجديد العقد
   * @param contractData بيانات العقد
   */
  openRenewContractDialog(contractData: any): void {
    // حساب تاريخ البداية والنهاية الجديد
    const currentEndDate = new Date(contractData.endDate);
    const newStartDate = new Date(currentEndDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    
    const newEndDate = new Date(newStartDate);
    // افتراض أن مدة العقد سنة واحدة
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    
    const renewedContract = {
      ...contractData,
      startDate: this.datePipe.transform(newStartDate, 'yyyy-MM-dd'),
      endDate: this.datePipe.transform(newEndDate, 'yyyy-MM-dd'),
      status: 'نشط',
      renewedFrom: contractData.id,
      id: null // سيتم إنشاء معرف جديد
    };
    
    const dialogRef = this.dialog.open(ContractFormDialogComponent, {
      width: '800px',
      data: {
        title: 'تجديد العقد',
        contract: renewedContract,
        contractTypes: this.contractTypes,
        contractStatuses: this.contractStatuses,
        isRenewal: true
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // تحديث العقد القديم إلى حالة "مجدد"
        this.changeContractStatus(contractData.id, 'مجدد');
        // إضافة العقد الجديد
        this.addContract(result);
      }
    });
  }
  
  /**
   * عرض تفاصيل العقد
   * @param contractId معرف العقد
   */
  viewContractDetails(contractId: string): void {
    this.router.navigate(['/contracts', contractId]);
  }
  
  /**
   * إضافة عقد جديد
   * @param contractData بيانات العقد الجديد
   */
  addContract(contractData: any): void {
    this.contractService.createContract(contractData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تمت إضافة العقد بنجاح',
          duration: 3000
        });
        this.loadContracts();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث بيانات عقد
   * @param contractData بيانات العقد المحدثة
   */
  updateContract(contractData: any): void {
    this.contractService.updateContract(contractData.id, contractData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث العقد بنجاح',
          duration: 3000
        });
        this.loadContracts();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حذف عقد
   * @param contractId معرف العقد
   */
  deleteContract(contractId: string): void {
    this.contractService.deleteContract(contractId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حذف العقد بنجاح',
          duration: 3000
        });
        this.loadContracts();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تغيير حالة عقد
   * @param contractId معرف العقد
   * @param status الحالة الجديدة
   */
  changeContractStatus(contractId: string, status: string): void {
    this.contractService.updateContractStatus(contractId, status).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: `تم تغيير حالة العقد إلى "${status}" بنجاح`,
          duration: 3000
        });
        this.loadContracts();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * الحصول على لون حالة العقد
   * @param status حالة العقد
   * @returns لون الحالة
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'مسودة':
        return 'secondary';
      case 'قيد المراجعة':
        return 'info';
      case 'نشط':
        return 'success';
      case 'معلق':
        return 'warning';
      case 'منتهي':
        return 'danger';
      case 'ملغي':
        return 'dark';
      case 'مجدد':
        return 'primary';
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
   * تنسيق القيمة المالية
   * @param value القيمة المالية
   * @returns القيمة المنسقة
   */
  formatCurrency(value: number): string {
    if (!value && value !== 0) return 'غير محدد';
    
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(value);
  }
  
  /**
   * التحقق من انتهاء العقد
   * @param contract بيانات العقد
   * @returns هل العقد منتهي
   */
  isContractExpired(contract: any): boolean {
    if (!contract.endDate || contract.status !== 'نشط') return false;
    
    const endDate = new Date(contract.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return endDate < today;
  }
  
  /**
   * التحقق من اقتراب انتهاء العقد
   * @param contract بيانات العقد
   * @returns هل العقد على وشك الانتهاء
   */
  isContractExpiring(contract: any): boolean {
    if (!contract.endDate || contract.status !== 'نشط') return false;
    
    const endDate = new Date(contract.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return endDate <= thirtyDaysFromNow && endDate >= today;
  }
}
