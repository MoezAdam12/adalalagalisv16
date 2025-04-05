/**
 * @file code-splitting.config.ts
 * @description تكوين تقسيم الكود لتحسين أداء التطبيق
 * يوفر هذا الملف تكوينات لتقسيم الكود وتحميل المكونات بشكل بطيء
 */

import { Routes } from '@angular/router';

/**
 * تكوين تقسيم الكود للمسارات الرئيسية
 * يتم استخدام هذه التكوينات في ملف app-routing.module.ts
 */
export const LAZY_ROUTES: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'cases',
    loadChildren: () => import('./features/cases/cases.module').then(m => m.CasesModule)
  },
  {
    path: 'clients',
    loadChildren: () => import('./features/clients/clients.module').then(m => m.ClientsModule)
  },
  {
    path: 'contracts',
    loadChildren: () => import('./features/contracts/contracts.module').then(m => m.ContractsModule)
  },
  {
    path: 'consultations',
    loadChildren: () => import('./features/consultations/consultations.module').then(m => m.ConsultationsModule)
  },
  {
    path: 'documents',
    loadChildren: () => import('./features/documents/documents.module').then(m => m.DocumentsModule)
  },
  {
    path: 'tasks',
    loadChildren: () => import('./features/tasks/tasks.module').then(m => m.TasksModule)
  },
  {
    path: 'calendar',
    loadChildren: () => import('./features/calendar/calendar.module').then(m => m.CalendarModule)
  },
  {
    path: 'financial',
    loadChildren: () => import('./features/financial/financial.module').then(m => m.FinancialModule)
  },
  {
    path: 'hr',
    loadChildren: () => import('./features/hr/hr.module').then(m => m.HrModule)
  },
  {
    path: 'timetracking',
    loadChildren: () => import('./features/timetracking/timetracking.module').then(m => m.TimetrackingModule)
  }
];

/**
 * تكوين تحميل مسبق للوحدات
 * يتم استخدام هذه التكوينات لتحميل الوحدات مسبقًا بعد تحميل الصفحة الرئيسية
 */
export const PRELOAD_MODULES = [
  {
    path: './features/dashboard/dashboard.module',
    name: 'DashboardModule'
  },
  {
    path: './features/cases/cases.module',
    name: 'CasesModule'
  },
  {
    path: './features/tasks/tasks.module',
    name: 'TasksModule'
  }
];

/**
 * تكوين تقسيم الكود للمكونات
 * يتم استخدام هذه التكوينات لتحميل المكونات بشكل بطيء
 */
export const LAZY_COMPONENTS = [
  {
    path: './features/dashboard/components/statistics-widget/statistics-widget.component',
    name: 'StatisticsWidgetComponent'
  },
  {
    path: './features/dashboard/components/recent-activities/recent-activities.component',
    name: 'RecentActivitiesComponent'
  },
  {
    path: './features/cases/components/case-details/case-details.component',
    name: 'CaseDetailsComponent'
  },
  {
    path: './features/documents/components/document-viewer/document-viewer.component',
    name: 'DocumentViewerComponent'
  }
];

/**
 * تكوين تحميل مسبق للموارد
 * يتم استخدام هذه التكوينات لتحميل الموارد المهمة مسبقًا
 */
export const PRELOAD_RESOURCES = {
  // موارد ضرورية يتم تحميلها فورًا
  critical: [
    '/assets/styles/critical.css',
    '/assets/fonts/main-font.woff2',
    '/assets/images/logo.svg'
  ],
  
  // موارد غير ضرورية يتم تحميلها لاحقًا
  nonCritical: [
    '/assets/images/background.jpg',
    '/assets/fonts/secondary-font.woff2',
    '/assets/icons/sprite.svg'
  ]
};

/**
 * تكوين تحسين الصور
 * يتم استخدام هذه التكوينات لتحسين تحميل الصور
 */
export const IMAGE_OPTIMIZATION_CONFIG = {
  // تكوين الصور المستجيبة
  responsive: {
    enabled: true,
    breakpoints: [576, 768, 992, 1200, 1400],
    formats: ['webp', 'jpg']
  },
  
  // تكوين التحميل البطيء للصور
  lazyLoading: {
    enabled: true,
    threshold: 200, // المسافة بالبكسل قبل ظهور الصورة في منطقة العرض
    placeholder: '/assets/images/placeholder.svg'
  },
  
  // تكوين ضغط الصور
  compression: {
    quality: 80, // جودة الصور (0-100)
    progressive: true // تحميل الصور بشكل تدريجي
  }
};

/**
 * تكوين تحسين الأصول
 * يتم استخدام هذه التكوينات لتحسين تحميل الأصول
 */
export const ASSETS_OPTIMIZATION_CONFIG = {
  // تكوين الخطوط
  fonts: {
    display: 'swap', // استراتيجية عرض الخطوط
    preload: true, // تحميل الخطوط مسبقًا
    formats: ['woff2', 'woff'] // تنسيقات الخطوط المدعومة
  },
  
  // تكوين الأيقونات
  icons: {
    useSvgSprite: true, // استخدام ملف SVG sprite
    inlineCriticalIcons: true // تضمين الأيقونات الضرورية مباشرة في HTML
  },
  
  // تكوين CSS
  styles: {
    inlineCriticalCss: true, // تضمين CSS الضروري مباشرة في HTML
    minify: true, // تصغير ملفات CSS
    purge: true // إزالة CSS غير المستخدم
  },
  
  // تكوين JavaScript
  scripts: {
    defer: true, // تأجيل تحميل النصوص البرمجية
    async: true, // تحميل النصوص البرمجية بشكل غير متزامن
    minify: true // تصغير ملفات JavaScript
  }
};
