import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AnalyticsService } from '../../services/analytics.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-analytics-reporting',
  templateUrl: './analytics-reporting.component.html',
  styleUrls: ['./analytics-reporting.component.scss'],
  providers: [DatePipe]
})
export class AnalyticsReportingComponent implements OnInit {
  // بيانات التحليلات
  tenantAnalytics: any[] = [];
  subscriptionAnalytics: any[] = [];
  
  // تكوين جدول تحليلات المستأجرين
  tenantDisplayedColumns: string[] = ['tenant', 'activeUsers', 'casesCount', 'contractsCount', 'consultationsCount', 'lastActivity'];
  tenantDataSource: MatTableDataSource<any>;
  
  // تكوين جدول تحليلات الاشتراكات
  subscriptionDisplayedColumns: string[] = ['package', 'tenantCount', 'revenue', 'averageUsage', 'renewalRate'];
  subscriptionDataSource: MatTableDataSource<any>;
  
  // حالة التحميل
  loading: boolean = true;
  
  // علامات التبويب النشطة
  activeTab: string = 'dashboard';
  
  // مرشحات التاريخ
  dateRange = {
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  };
  
  // إحصائيات عامة
  statistics = {
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalUsers: 0,
    activeUsers: 0
  };
  
  // بيانات الرسوم البيانية
  chartData = {
    tenantGrowth: [],
    revenueByMonth: [],
    usageByModule: [],
    subscriptionDistribution: []
  };
  
  // تقارير مخصصة
  customReports: any[] = [];
  
  @ViewChild('tenantPaginator') tenantPaginator: MatPaginator;
  @ViewChild('tenantSort') tenantSort: MatSort;
  @ViewChild('subscriptionPaginator') subscriptionPaginator: MatPaginator;
  @ViewChild('subscriptionSort') subscriptionSort: MatSort;
  
  constructor(
    private analyticsService: AnalyticsService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadAnalyticsData();
  }
  
  /**
   * تحميل بيانات التحليلات
   */
  loadAnalyticsData(): void {
    this.loading = true;
    
    // تحميل إحصائيات عامة
    this.analyticsService.getGeneralStatistics(this.formatDateRange()).subscribe({
      next: (data) => {
        this.statistics = data;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
    
    // تحميل بيانات الرسوم البيانية
    this.analyticsService.getChartData(this.formatDateRange()).subscribe({
      next: (data) => {
        this.chartData = data;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
    
    // تحميل تحليلات المستأجرين
    this.analyticsService.getTenantAnalytics(this.formatDateRange()).subscribe({
      next: (data) => {
        this.tenantAnalytics = data;
        this.tenantDataSource = new MatTableDataSource(this.tenantAnalytics);
        this.tenantDataSource.paginator = this.tenantPaginator;
        this.tenantDataSource.sort = this.tenantSort;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
    
    // تحميل تحليلات الاشتراكات
    this.analyticsService.getSubscriptionAnalytics(this.formatDateRange()).subscribe({
      next: (data) => {
        this.subscriptionAnalytics = data;
        this.subscriptionDataSource = new MatTableDataSource(this.subscriptionAnalytics);
        this.subscriptionDataSource.paginator = this.subscriptionPaginator;
        this.subscriptionDataSource.sort = this.subscriptionSort;
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
    
    // تحميل التقارير المخصصة
    this.analyticsService.getCustomReports().subscribe({
      next: (data) => {
        this.customReports = data;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تنسيق نطاق التاريخ للاستعلامات
   * @returns نطاق التاريخ المنسق
   */
  formatDateRange(): any {
    return {
      startDate: this.datePipe.transform(this.dateRange.start, 'yyyy-MM-dd'),
      endDate: this.datePipe.transform(this.dateRange.end, 'yyyy-MM-dd')
    };
  }
  
  /**
   * تغيير علامة التبويب النشطة
   * @param tabName اسم علامة التبويب
   */
  changeTab(tabName: string): void {
    this.activeTab = tabName;
  }
  
  /**
   * تحديث نطاق التاريخ وإعادة تحميل البيانات
   */
  updateDateRange(): void {
    this.loadAnalyticsData();
  }
  
  /**
   * تعيين نطاق تاريخ محدد مسبقًا
   * @param range نطاق التاريخ المحدد مسبقًا
   */
  setPresetRange(range: string): void {
    const today = new Date();
    
    switch (range) {
      case 'today':
        this.dateRange.start = new Date();
        this.dateRange.end = new Date();
        break;
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        this.dateRange.start = yesterday;
        this.dateRange.end = yesterday;
        break;
      case 'last7days':
        this.dateRange.start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        this.dateRange.end = today;
        break;
      case 'last30days':
        this.dateRange.start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
        this.dateRange.end = today;
        break;
      case 'thisMonth':
        this.dateRange.start = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dateRange.end = today;
        break;
      case 'lastMonth':
        this.dateRange.start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        this.dateRange.end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        this.dateRange.start = new Date(today.getFullYear(), 0, 1);
        this.dateRange.end = today;
        break;
    }
    
    this.updateDateRange();
  }
  
  /**
   * تطبيق مرشح البحث على جدول تحليلات المستأجرين
   * @param event حدث تغيير النص
   */
  applyTenantFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.tenantDataSource.filter = filterValue.trim().toLowerCase();

    if (this.tenantDataSource.paginator) {
      this.tenantDataSource.paginator.firstPage();
    }
  }
  
  /**
   * تطبيق مرشح البحث على جدول تحليلات الاشتراكات
   * @param event حدث تغيير النص
   */
  applySubscriptionFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.subscriptionDataSource.filter = filterValue.trim().toLowerCase();

    if (this.subscriptionDataSource.paginator) {
      this.subscriptionDataSource.paginator.firstPage();
    }
  }
  
  /**
   * تصدير التقرير
   * @param format تنسيق التصدير
   */
  exportReport(format: string): void {
    this.analyticsService.exportReport(this.activeTab, this.formatDateRange(), format).subscribe({
      next: (response) => {
        // تنزيل الملف
        const blob = new Blob([response], { type: this.getContentType(format) });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.activeTab}_report_${this.datePipe.transform(new Date(), 'yyyyMMdd')}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.notificationService.showNotification({
          type: 'success',
          message: `تم تصدير التقرير بنجاح بتنسيق ${format.toUpperCase()}`,
          duration: 3000
        });
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * الحصول على نوع المحتوى لتنسيق التصدير
   * @param format تنسيق التصدير
   * @returns نوع المحتوى
   */
  getContentType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }
  
  /**
   * تنفيذ تقرير مخصص
   * @param report التقرير المخصص
   */
  runCustomReport(report: any): void {
    this.loading = true;
    
    this.analyticsService.runCustomReport(report.id, this.formatDateRange()).subscribe({
      next: (data) => {
        // عرض نتائج التقرير المخصص
        report.results = data;
        report.expanded = true;
        this.loading = false;
        
        this.notificationService.showNotification({
          type: 'success',
          message: `تم تنفيذ التقرير "${report.name}" بنجاح`,
          duration: 3000
        });
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
  }
  
  /**
   * تنسيق التاريخ
   * @param date التاريخ
   * @returns التاريخ المنسق
   */
  formatDate(date: string): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd');
  }
  
  /**
   * تنسيق العملة
   * @param value القيمة
   * @returns القيمة المنسقة
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(value);
  }
  
  /**
   * تنسيق النسبة المئوية
   * @param value القيمة
   * @returns القيمة المنسقة
   */
  formatPercentage(value: number): string {
    return new Intl.NumberFormat('ar-SA', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
  }
}
