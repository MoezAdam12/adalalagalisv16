import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent implements OnInit {
  menuItems = [
    {
      title: 'لوحة التحكم',
      icon: 'bi-speedometer2',
      route: '/admin',
      exact: true
    },
    {
      title: 'إدارة المستخدمين',
      icon: 'bi-people',
      route: '/admin/users'
    },
    {
      title: 'الأدوار والصلاحيات',
      icon: 'bi-shield-lock',
      route: '/admin/roles'
    },
    {
      title: 'إدارة المؤسسات',
      icon: 'bi-building',
      route: '/admin/businesses'
    },
    {
      title: 'الاشتراكات والفوترة',
      icon: 'bi-credit-card',
      route: '/admin/subscriptions'
    },
    {
      title: 'الإعدادات',
      icon: 'bi-gear',
      children: [
        {
          title: 'إعدادات البريد الإلكتروني',
          icon: 'bi-envelope',
          route: '/admin/email-settings'
        },
        {
          title: 'إعدادات الإشعارات',
          icon: 'bi-bell',
          route: '/admin/notification-settings'
        },
        {
          title: 'تخصيص واجهة المستخدم',
          icon: 'bi-palette',
          route: '/admin/ui-settings'
        },
        {
          title: 'إعدادات الأمان',
          icon: 'bi-shield',
          route: '/admin/security-settings'
        },
        {
          title: 'التكاملات الخارجية',
          icon: 'bi-box-arrow-up-right',
          route: '/admin/integrations'
        }
      ]
    },
    {
      title: 'قوالب البريد الإلكتروني',
      icon: 'bi-file-earmark-text',
      route: '/admin/email-templates'
    },
    {
      title: 'إدارة اللغات',
      icon: 'bi-translate',
      route: '/admin/languages'
    },
    {
      title: 'سجلات التدقيق',
      icon: 'bi-journal-text',
      route: '/admin/audit-logs'
    }
  ];

  expandedMenus: { [key: string]: boolean } = {};

  constructor() { }

  ngOnInit(): void {
    // Initialize expanded state based on current route
    this.menuItems.forEach(item => {
      if (item.children) {
        this.expandedMenus[item.title] = false;
      }
    });
  }

  toggleSubMenu(menuTitle: string): void {
    this.expandedMenus[menuTitle] = !this.expandedMenus[menuTitle];
  }

  isExpanded(menuTitle: string): boolean {
    return this.expandedMenus[menuTitle] || false;
  }
}
