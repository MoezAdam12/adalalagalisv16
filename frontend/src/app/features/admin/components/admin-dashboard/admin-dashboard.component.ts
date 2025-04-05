import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // بيانات الإحصائيات
  statistics = {
    totalTenants: 0,
    activeTenants: 0,
    inactiveTenants: 0,
    trialTenants: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0
  };

  // بيانات الرسوم البيانية
  tenantGrowthData: any[] = [];
  revenueData: any[] = [];
  subscriptionDistributionData: any[] = [];
  moduleUsageData: any[] = [];

  // نموذج البحث
  searchForm: FormGroup;

  // مصادر البيانات للجداول
  tenantsDataSource = new MatTableDataSource<any>([]);
  subscriptionsDataSource = new MatTableDataSource<any>([]);
  packagesDataSource = new MatTableDataSource<any>([]);

  // أعمدة الجداول
  tenantColumns: string[] = ['id', 'name', 'email', 'status', 'createdAt', 'subscriptionType', 'actions'];
  subscriptionColumns: string[] = ['id', 'tenantName', 'packageName', 'startDate', 'endDate', 'status', 'amount', 'actions'];
  packageColumns: string[] = ['id', 'name', 'description', 'price', 'duration', 'features', 'actions'];

  // عناصر التحكم في الجداول
  @ViewChild('tenantPaginator') tenantPaginator: MatPaginator;
  @ViewChild('tenantSort') tenantSort: MatSort;
  @ViewChild('subscriptionPaginator') subscriptionPaginator: MatPaginator;
  @ViewChild('subscriptionSort') subscriptionSort: MatSort;
  @ViewChild('packagePaginator') packagePaginator: MatPaginator;
  @ViewChild('packageSort') packageSort: MatSort;

  // حالة عرض البيانات
  activeTab = 'dashboard';
  loading = false;
  error = null;

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initSearchForm();
    this.loadDashboardData();
  }

  /**
   * تهيئة نموذج البحث
   */
  initSearchForm(): void {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      status: ['all'],
      dateRange: [null],
      subscriptionType: ['all']
    });

    // الاستماع لتغييرات نموذج البحث
    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  /**
   * تحميل بيانات لوحة التحكم
   */
  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // محاكاة تحميل البيانات من الخادم
    setTimeout(() => {
      try {
        this.loadStatistics();
        this.loadChartData();
        this.loadTenants();
        this.loadSubscriptions();
        this.loadPackages();
        this.loading = false;
      } catch (err) {
        this.error = 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.';
        this.loading = false;
        console.error('Error loading dashboard data:', err);
      }
    }, 1000);
  }

  /**
   * تحميل بيانات الإحصائيات
   */
  loadStatistics(): void {
    // محاكاة بيانات الإحصائيات
    this.statistics = {
      totalTenants: 156,
      activeTenants: 132,
      inactiveTenants: 24,
      trialTenants: 18,
      totalSubscriptions: 178,
      activeSubscriptions: 142,
      expiringSubscriptions: 12,
      totalRevenue: 1250000,
      monthlyRevenue: 85000,
      yearlyRevenue: 950000
    };
  }

  /**
   * تحميل بيانات الرسوم البيانية
   */
  loadChartData(): void {
    // محاكاة بيانات نمو المستأجرين
    this.tenantGrowthData = [
      { name: 'يناير', value: 98 },
      { name: 'فبراير', value: 105 },
      { name: 'مارس', value: 112 },
      { name: 'أبريل', value: 118 },
      { name: 'مايو', value: 127 },
      { name: 'يونيو', value: 135 },
      { name: 'يوليو', value: 142 },
      { name: 'أغسطس', value: 148 },
      { name: 'سبتمبر', value: 152 },
      { name: 'أكتوبر', value: 156 },
      { name: 'نوفمبر', value: 156 },
      { name: 'ديسمبر', value: 156 }
    ];

    // محاكاة بيانات الإيرادات
    this.revenueData = [
      { name: 'يناير', value: 65000 },
      { name: 'فبراير', value: 68000 },
      { name: 'مارس', value: 72000 },
      { name: 'أبريل', value: 75000 },
      { name: 'مايو', value: 78000 },
      { name: 'يونيو', value: 80000 },
      { name: 'يوليو', value: 82000 },
      { name: 'أغسطس', value: 83000 },
      { name: 'سبتمبر', value: 84000 },
      { name: 'أكتوبر', value: 85000 },
      { name: 'نوفمبر', value: 85000 },
      { name: 'ديسمبر', value: 85000 }
    ];

    // محاكاة بيانات توزيع الاشتراكات
    this.subscriptionDistributionData = [
      { name: 'أساسي', value: 45 },
      { name: 'متقدم', value: 65 },
      { name: 'احترافي', value: 32 },
      { name: 'مؤسسات', value: 14 }
    ];

    // محاكاة بيانات استخدام الوحدات
    this.moduleUsageData = [
      { name: 'إدارة القضايا', value: 85 },
      { name: 'إدارة العقود', value: 72 },
      { name: 'إدارة الاستشارات', value: 65 },
      { name: 'إدارة المهام', value: 90 },
      { name: 'التقارير', value: 55 },
      { name: 'الفوترة', value: 48 }
    ];
  }

  /**
   * تحميل بيانات المستأجرين
   */
  loadTenants(): void {
    // محاكاة بيانات المستأجرين
    const tenants = [
      {
        id: 'T001',
        name: 'شركة الفيصل للمحاماة',
        email: 'info@alfaisal-law.com',
        status: 'نشط',
        createdAt: '2023-01-15',
        subscriptionType: 'احترافي',
        usersCount: 12,
        lastLogin: '2023-10-25'
      },
      {
        id: 'T002',
        name: 'مكتب العدالة للاستشارات القانونية',
        email: 'contact@adala-legal.com',
        status: 'نشط',
        createdAt: '2023-02-20',
        subscriptionType: 'متقدم',
        usersCount: 8,
        lastLogin: '2023-10-26'
      },
      {
        id: 'T003',
        name: 'مجموعة الحقوق القانونية',
        email: 'info@rights-legal.com',
        status: 'نشط',
        createdAt: '2023-03-10',
        subscriptionType: 'مؤسسات',
        usersCount: 25,
        lastLogin: '2023-10-24'
      },
      {
        id: 'T004',
        name: 'مكتب النور للمحاماة',
        email: 'office@alnoor-advocates.com',
        status: 'غير نشط',
        createdAt: '2023-04-05',
        subscriptionType: 'أساسي',
        usersCount: 3,
        lastLogin: '2023-09-15'
      },
      {
        id: 'T005',
        name: 'شركة الصفوة للخدمات القانونية',
        email: 'info@safwa-legal.com',
        status: 'نشط',
        createdAt: '2023-05-12',
        subscriptionType: 'احترافي',
        usersCount: 15,
        lastLogin: '2023-10-26'
      }
    ];

    this.tenantsDataSource = new MatTableDataSource(tenants);
    this.tenantsDataSource.paginator = this.tenantPaginator;
    this.tenantsDataSource.sort = this.tenantSort;
  }

  /**
   * تحميل بيانات الاشتراكات
   */
  loadSubscriptions(): void {
    // محاكاة بيانات الاشتراكات
    const subscriptions = [
      {
        id: 'S001',
        tenantId: 'T001',
        tenantName: 'شركة الفيصل للمحاماة',
        packageId: 'P003',
        packageName: 'احترافي',
        startDate: '2023-01-15',
        endDate: '2024-01-14',
        status: 'نشط',
        amount: 12000,
        paymentMethod: 'بطاقة ائتمان',
        autoRenew: true
      },
      {
        id: 'S002',
        tenantId: 'T002',
        tenantName: 'مكتب العدالة للاستشارات القانونية',
        packageId: 'P002',
        packageName: 'متقدم',
        startDate: '2023-02-20',
        endDate: '2024-02-19',
        status: 'نشط',
        amount: 8000,
        paymentMethod: 'تحويل بنكي',
        autoRenew: false
      },
      {
        id: 'S003',
        tenantId: 'T003',
        tenantName: 'مجموعة الحقوق القانونية',
        packageId: 'P004',
        packageName: 'مؤسسات',
        startDate: '2023-03-10',
        endDate: '2024-03-09',
        status: 'نشط',
        amount: 25000,
        paymentMethod: 'بطاقة ائتمان',
        autoRenew: true
      },
      {
        id: 'S004',
        tenantId: 'T004',
        tenantName: 'مكتب النور للمحاماة',
        packageId: 'P001',
        packageName: 'أساسي',
        startDate: '2023-04-05',
        endDate: '2023-10-04',
        status: 'منتهي',
        amount: 4000,
        paymentMethod: 'تحويل بنكي',
        autoRenew: false
      },
      {
        id: 'S005',
        tenantId: 'T005',
        tenantName: 'شركة الصفوة للخدمات القانونية',
        packageId: 'P003',
        packageName: 'احترافي',
        startDate: '2023-05-12',
        endDate: '2024-05-11',
        status: 'نشط',
        amount: 12000,
        paymentMethod: 'بطاقة ائتمان',
        autoRenew: true
      }
    ];

    this.subscriptionsDataSource = new MatTableDataSource(subscriptions);
    this.subscriptionsDataSource.paginator = this.subscriptionPaginator;
    this.subscriptionsDataSource.sort = this.subscriptionSort;
  }

  /**
   * تحميل بيانات الباقات
   */
  loadPackages(): void {
    // محاكاة بيانات الباقات
    const packages = [
      {
        id: 'P001',
        name: 'أساسي',
        description: 'باقة أساسية للمكاتب الصغيرة',
        price: 4000,
        duration: 6,
        durationType: 'شهر',
        maxUsers: 5,
        features: [
          'إدارة القضايا (محدود)',
          'إدارة المهام',
          'التقويم القانوني',
          'دعم فني أساسي'
        ],
        isActive: true,
        createdAt: '2023-01-01'
      },
      {
        id: 'P002',
        name: 'متقدم',
        description: 'باقة متقدمة للمكاتب المتوسطة',
        price: 8000,
        duration: 12,
        durationType: 'شهر',
        maxUsers: 10,
        features: [
          'إدارة القضايا (غير محدود)',
          'إدارة العقود',
          'إدارة المهام',
          'التقويم القانوني',
          'إدارة الفواتير',
          'دعم فني متقدم'
        ],
        isActive: true,
        createdAt: '2023-01-01'
      },
      {
        id: 'P003',
        name: 'احترافي',
        description: 'باقة احترافية للمكاتب الكبيرة',
        price: 12000,
        duration: 12,
        durationType: 'شهر',
        maxUsers: 20,
        features: [
          'إدارة القضايا (غير محدود)',
          'إدارة العقود',
          'إدارة الاستشارات',
          'إدارة المهام',
          'التقويم القانوني',
          'إدارة الفواتير',
          'التقارير المتقدمة',
          'دعم فني متميز'
        ],
        isActive: true,
        createdAt: '2023-01-01'
      },
      {
        id: 'P004',
        name: 'مؤسسات',
        description: 'باقة مخصصة للمؤسسات القانونية الكبرى',
        price: 25000,
        duration: 12,
        durationType: 'شهر',
        maxUsers: 50,
        features: [
          'جميع الميزات',
          'تخصيص حسب الطلب',
          'تكامل مع الأنظمة الخارجية',
          'تدريب مخصص',
          'مدير حساب مخصص',
          'دعم فني على مدار الساعة'
        ],
        isActive: true,
        createdAt: '2023-01-01'
      }
    ];

    this.packagesDataSource = new MatTableDataSource(packages);
    this.packagesDataSource.paginator = this.packagePaginator;
    this.packagesDataSource.sort = this.packageSort;
  }

  /**
   * تطبيق المرشحات على البيانات
   */
  applyFilters(): void {
    const filters = this.searchForm.value;
    
    // تطبيق المرشحات على جدول المستأجرين
    this.tenantsDataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerm = filters.searchTerm.toLowerCase();
      const matchesSearchTerm = !searchTerm || 
        data.name.toLowerCase().includes(searchTerm) || 
        data.email.toLowerCase().includes(searchTerm) || 
        data.id.toLowerCase().includes(searchTerm);
      
      const matchesStatus = filters.status === 'all' || data.status === filters.status;
      const matchesSubscription = filters.subscriptionType === 'all' || data.subscriptionType === filters.subscriptionType;
      
      return matchesSearchTerm && matchesStatus && matchesSubscription;
    };
    
    this.tenantsDataSource.filter = 'apply';
    
    // تطبيق المرشحات على جدول الاشتراكات
    this.subscriptionsDataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerm = filters.searchTerm.toLowerCase();
      const matchesSearchTerm = !searchTerm || 
        data.tenantName.toLowerCase().includes(searchTerm) || 
        data.packageName.toLowerCase().includes(searchTerm) || 
        data.id.toLowerCase().includes(searchTerm);
      
      const matchesStatus = filters.status === 'all' || data.status === filters.status;
      
      return matchesSearchTerm && matchesStatus;
    };
    
    this.subscriptionsDataSource.filter = 'apply';
  }

  /**
   * تغيير التبويب النشط
   * @param tabName اسم التبويب
   */
  changeTab(tabName: string): void {
    this.activeTab = tabName;
  }

  /**
   * فتح مربع حوار إضافة مستأجر جديد
   */
  openAddTenantDialog(): void {
    // تنفيذ فتح مربع حوار إضافة مستأجر جديد
    console.log('Opening add tenant dialog');
  }

  /**
   * فتح مربع حوار تعديل مستأجر
   * @param tenant بيانات المستأجر
   */
  openEditTenantDialog(tenant: any): void {
    // تنفيذ فتح مربع حوار تعديل مستأجر
    console.log('Opening edit tenant dialog', tenant);
  }

  /**
   * فتح مربع حوار حذف مستأجر
   * @param tenant بيانات المستأجر
   */
  openDeleteTenantDialog(tenant: any): void {
    // تنفيذ فتح مربع حوار حذف مستأجر
    console.log('Opening delete tenant dialog', tenant);
  }

  /**
   * فتح مربع حوار عرض تفاصيل المستأجر
   * @param tenant بيانات المستأجر
   */
  openTenantDetailsDialog(tenant: any): void {
    // تنفيذ فتح مربع حوار عرض تفاصيل المستأجر
    console.log('Opening tenant details dialog', tenant);
  }

  /**
   * فتح مربع حوار إضافة اشتراك جديد
   */
  openAddSubscriptionDialog(): void {
    // تنفيذ فتح مربع حوار إضافة اشتراك جديد
    console.log('Opening add subscription dialog');
  }

  /**
   * فتح مربع حوار تعديل اشتراك
   * @param subscription بيانات الاشتراك
   */
  openEditSubscriptionDialog(subscription: any): void {
    // تنفيذ فتح مربع حوار تعديل اشتراك
    console.log('Opening edit subscription dialog', subscription);
  }

  /**
   * فتح مربع حوار إلغاء اشتراك
   * @param subscription بيانات الاشتراك
   */
  openCancelSubscriptionDialog(subscription: any): void {
    // تنفيذ فتح مربع حوار إلغاء اشتراك
    console.log('Opening cancel subscription dialog', subscription);
  }

  /**
   * فتح مربع حوار إضافة باقة جديدة
   */
  openAddPackageDialog(): void {
    // تنفيذ فتح مربع حوار إضافة باقة جديدة
    console.log('Opening add package dialog');
  }

  /**
   * فتح مربع حوار تعديل باقة
   * @param packageData بيانات الباقة
   */
  openEditPackageDialog(packageData: any): void {
    // تنفيذ فتح مربع حوار تعديل باقة
    console.log('Opening edit package dialog', packageData);
  }

  /**
   * فتح مربع حوار حذف باقة
   * @param packageData بيانات الباقة
   */
  openDeletePackageDialog(packageData: any): void {
    // تنفيذ فتح مربع حوار حذف باقة
    console.log('Opening delete package dialog', packageData);
  }

  /**
   * تنسيق المبلغ المالي
   * @param amount المبلغ
   * @returns المبلغ المنسق
   */
  formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' });
  }

  /**
   * تنسيق التاريخ
   * @param date التاريخ
   * @returns التاريخ المنسق
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  /**
   * تصدير البيانات
   * @param type نوع التصدير
   * @param dataSource مصدر البيانات
   */
  exportData(type: string, dataSource: any): void {
    // تنفيذ تصدير البيانات
    console.log(`Exporting ${type} data`, dataSource.data);
  }
}
