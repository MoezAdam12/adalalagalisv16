import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
})
export class AdminHeaderComponent implements OnInit {
  currentUser: any = null;
  notifications: any[] = [];
  unreadNotificationsCount = 0;
  showNotificationsDropdown = false;
  showUserDropdown = false;
  
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadNotifications();
  }
  
  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe(
      (user) => {
        this.currentUser = user;
      },
      (error) => {
        console.error('Error loading current user:', error);
      }
    );
  }
  
  loadNotifications(): void {
    // Mock notifications for now
    this.notifications = [
      {
        id: 1,
        title: 'تحديث النظام',
        message: 'تم تحديث النظام إلى الإصدار الجديد',
        time: new Date(),
        read: false,
        type: 'system'
      },
      {
        id: 2,
        title: 'مستخدم جديد',
        message: 'تم تسجيل مستخدم جديد في النظام',
        time: new Date(Date.now() - 3600000),
        read: true,
        type: 'user'
      },
      {
        id: 3,
        title: 'تنبيه أمان',
        message: 'تم تسجيل الدخول من جهاز جديد',
        time: new Date(Date.now() - 86400000),
        read: false,
        type: 'security'
      }
    ];
    
    this.unreadNotificationsCount = this.notifications.filter(n => !n.read).length;
  }
  
  toggleNotificationsDropdown(): void {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showUserDropdown) {
      this.showUserDropdown = false;
    }
  }
  
  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
    if (this.showNotificationsDropdown) {
      this.showNotificationsDropdown = false;
    }
  }
  
  markNotificationAsRead(notification: any): void {
    notification.read = true;
    this.unreadNotificationsCount = this.notifications.filter(n => !n.read).length;
  }
  
  markAllNotificationsAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.unreadNotificationsCount = 0;
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'system':
        return 'bi-gear';
      case 'user':
        return 'bi-person';
      case 'security':
        return 'bi-shield-exclamation';
      default:
        return 'bi-bell';
    }
  }
  
  getNotificationClass(type: string): string {
    switch (type) {
      case 'system':
        return 'bg-info';
      case 'user':
        return 'bg-success';
      case 'security':
        return 'bg-danger';
      default:
        return 'bg-primary';
    }
  }
  
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return 'الآن';
    } else if (diffMin < 60) {
      return `منذ ${diffMin} دقيقة`;
    } else if (diffHour < 24) {
      return `منذ ${diffHour} ساعة`;
    } else {
      return `منذ ${diffDay} يوم`;
    }
  }
}
