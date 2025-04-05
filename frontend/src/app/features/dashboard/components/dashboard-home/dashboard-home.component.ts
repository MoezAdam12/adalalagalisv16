import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CaseService } from '../../../cases/services/case.service';
import { TaskService } from '../../../tasks/services/task.service';
import { ContractService } from '../../../contracts/services/contract.service';
import { ConsultationService } from '../../../consultations/services/consultation.service';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  // بيانات المستخدم
  currentUser: any;
  userRole: string;
  
  // إحصائيات عامة
  statistics: any = {
    totalCases: 0,
    activeCases: 0,
    pendingTasks: 0,
    upcomingHearings: 0,
    contractsToRenew: 0,
    pendingConsultations: 0,
    recentPayments: 0,
    monthlyRevenue: 0
  };
  
  // الأنشطة الأخيرة
  recentActivities: any[] = [];
  
  // المهام القادمة
  upcomingTasks: any[] = [];
  
  // الجلسات القادمة
  upcomingHearings: any[] = [];
  
  // العقود التي تحتاج إلى تجديد
  contractsToRenew: any[] = [];
  
  // الاستشارات المعلقة
  pendingConsultations: any[] = [];
  
  // حالة التحميل
  loading = {
    statistics: true,
    activities: true,
    tasks: true,
    hearings: true,
    contracts: true,
    consultations: true
  };
  
  // خيارات الرسوم البيانية
  chartOptions = {
    cases: {
      series: [],
      chart: {
        type: 'donut',
        height: 250
      },
      labels: ['نشطة', 'معلقة', 'مغلقة', 'مؤرشفة'],
      colors: ['#4CAF50', '#FFC107', '#9E9E9E', '#2196F3'],
      legend: {
        position: 'bottom'
      }
    },
    revenue: {
      series: [{
        name: 'الإيرادات',
        data: []
      }],
      chart: {
        type: 'area',
        height: 250,
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: []
      },
      yaxis: {
        title: {
          text: 'الإيرادات (ريال)'
        }
      },
      colors: ['#4CAF50']
    }
  };
  
  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private caseService: CaseService,
    private taskService: TaskService,
    private contractService: ContractService,
    private consultationService: ConsultationService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    // الحصول على بيانات المستخدم الحالي
    this.currentUser = this.authService.getCurrentUser();
    this.userRole = this.authService.getUserRole();
    
    // تحميل البيانات
    this.loadDashboardData();
  }
  
  /**
   * تحميل بيانات لوحة التحكم
   */
  loadDashboardData(): void {
    this.loadStatistics();
    this.loadRecentActivities();
    this.loadUpcomingTasks();
    this.loadUpcomingHearings();
    this.loadContractsToRenew();
    this.loadPendingConsultations();
  }
  
  /**
   * تحميل الإحصائيات
   */
  loadStatistics(): void {
    this.loading.statistics = true;
    
    this.dashboardService.getStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
        this.updateCaseChart(data.casesByStatus);
        this.updateRevenueChart(data.revenueByMonth);
        this.loading.statistics = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading.statistics = false;
      }
    });
  }
  
  /**
   * تحميل الأنشطة الأخيرة
   */
  loadRecentActivities(): void {
    this.loading.activities = true;
    
    this.dashboardService.getRecentActivities().subscribe({
      next: (data) => {
        this.recentActivities = data;
        this.loading.activities = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading.activities = false;
      }
    });
  }
  
  /**
   * تحميل المهام القادمة
   */
  loadUpcomingTasks(): void {
    this.loading.tasks = true;
    
    this.taskService.getUpcomingTasks().subscribe({
      next: (data) => {
        this.upcomingTasks = data;
        this.loading.tasks = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading.tasks = false;
      }
    });
  }
  
  /**
   * تحميل الجلسات القادمة
   */
  loadUpcomingHearings(): void {
    this.loading.hearings = true;
    
    this.caseService.getUpcomingHearings().subscribe({
      next: (data) => {
        this.upcomingHearings = data;
        this.loading.hearings = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading.hearings = false;
      }
    });
  }
  
  /**
   * تحميل العقود التي تحتاج إلى تجديد
   */
  loadContractsToRenew(): void {
    this.loading.contracts = true;
    
    this.contractService.getContractsToRenew().subscribe({
      next: (data) => {
        this.contractsToRenew = data;
        this.loading.contracts = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading.contracts = false;
      }
    });
  }
  
  /**
   * تحميل الاستشارات المعلقة
   */
  loadPendingConsultations(): void {
    this.loading.consultations = true;
    
    this.consultationService.getPendingConsultations().subscribe({
      next: (data) => {
        this.pendingConsultations = data;
        this.loading.consultations = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading.consultations = false;
      }
    });
  }
  
  /**
   * تحديث مخطط القضايا
   * @param casesByStatus بيانات القضايا حسب الحالة
   */
  updateCaseChart(casesByStatus: any): void {
    if (casesByStatus) {
      this.chartOptions.cases.series = [
        casesByStatus.active || 0,
        casesByStatus.pending || 0,
        casesByStatus.closed || 0,
        casesByStatus.archived || 0
      ];
    }
  }
  
  /**
   * تحديث مخطط الإيرادات
   * @param revenueByMonth بيانات الإيرادات حسب الشهر
   */
  updateRevenueChart(revenueByMonth: any[]): void {
    if (revenueByMonth && revenueByMonth.length > 0) {
      const categories = revenueByMonth.map(item => item.month);
      const data = revenueByMonth.map(item => item.amount);
      
      this.chartOptions.revenue.series = [{
        name: 'الإيرادات',
        data: data
      }];
      
      this.chartOptions.revenue.xaxis = {
        categories: categories
      };
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
  
  /**
   * تنسيق الوقت
   * @param date التاريخ والوقت
   * @returns الوقت المنسق
   */
  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * الحصول على لون حالة المهمة
   * @param status حالة المهمة
   * @returns لون الحالة
   */
  getTaskStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'overdue':
        return 'danger';
      default:
        return 'secondary';
    }
  }
  
  /**
   * الحصول على لون أولوية المهمة
   * @param priority أولوية المهمة
   * @returns لون الأولوية
   */
  getTaskPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  }
  
  /**
   * تحديث البيانات
   */
  refreshData(): void {
    this.loadDashboardData();
  }
}
