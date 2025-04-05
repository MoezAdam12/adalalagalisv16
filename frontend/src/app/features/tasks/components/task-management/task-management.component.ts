import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { TaskFormDialogComponent } from '../task-form-dialog/task-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-management',
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.scss'],
  providers: [DatePipe]
})
export class TaskManagementComponent implements OnInit {
  // بيانات المهام
  tasks: any[] = [];
  
  // تكوين جدول المهام
  displayedColumns: string[] = ['taskNumber', 'title', 'relatedTo', 'assignedTo', 'priority', 'status', 'dueDate', 'actions'];
  dataSource: MatTableDataSource<any>;
  
  // مرشحات البحث
  searchTerm: string = '';
  statusFilter: string = 'all';
  priorityFilter: string = 'all';
  
  // حالة التحميل
  loading: boolean = true;
  
  // عرض لوحة كانبان
  showKanban: boolean = false;
  
  // مهام مصنفة حسب الحالة للوحة كانبان
  todoTasks: any[] = [];
  inProgressTasks: any[] = [];
  reviewTasks: any[] = [];
  completedTasks: any[] = [];
  
  // إحصائيات
  statistics = {
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    reviewTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    highPriorityTasks: 0
  };
  
  // قائمة أولويات المهام
  taskPriorities: string[] = [
    'منخفضة',
    'متوسطة',
    'عالية',
    'عاجلة'
  ];
  
  // قائمة حالات المهام
  taskStatuses: string[] = [
    'قيد الانتظار',
    'قيد التنفيذ',
    'قيد المراجعة',
    'مكتملة'
  ];
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadTasks();
  }
  
  /**
   * تحميل بيانات المهام
   */
  loadTasks(): void {
    this.loading = true;
    
    this.taskService.getAllTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.dataSource = new MatTableDataSource(this.tasks);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.calculateStatistics();
        this.groupTasksByStatus();
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
    
    this.statistics.totalTasks = this.tasks.length;
    this.statistics.todoTasks = this.tasks.filter(t => t.status === 'قيد الانتظار').length;
    this.statistics.inProgressTasks = this.tasks.filter(t => t.status === 'قيد التنفيذ').length;
    this.statistics.reviewTasks = this.tasks.filter(t => t.status === 'قيد المراجعة').length;
    this.statistics.completedTasks = this.tasks.filter(t => t.status === 'مكتملة').length;
    this.statistics.highPriorityTasks = this.tasks.filter(t => t.priority === 'عالية' || t.priority === 'عاجلة').length;
    
    // حساب المهام المتأخرة
    this.statistics.overdueTasks = this.tasks.filter(t => {
      if (!t.dueDate || t.status === 'مكتملة') return false;
      
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate < today;
    }).length;
  }
  
  /**
   * تجميع المهام حسب الحالة للوحة كانبان
   */
  groupTasksByStatus(): void {
    this.todoTasks = this.tasks.filter(t => t.status === 'قيد الانتظار');
    this.inProgressTasks = this.tasks.filter(t => t.status === 'قيد التنفيذ');
    this.reviewTasks = this.tasks.filter(t => t.status === 'قيد المراجعة');
    this.completedTasks = this.tasks.filter(t => t.status === 'مكتملة');
  }
  
  /**
   * تبديل طريقة العرض بين الجدول ولوحة كانبان
   */
  toggleView(): void {
    this.showKanban = !this.showKanban;
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
   * تطبيق مرشح الأولوية
   * @param priority الأولوية المحددة
   */
  applyPriorityFilter(priority: string): void {
    this.priorityFilter = priority;
    this.applyFilters();
  }
  
  /**
   * تطبيق المرشحات
   */
  applyFilters(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    
    if (this.statusFilter !== 'all' || this.priorityFilter !== 'all') {
      this.dataSource.data = this.tasks.filter(task => {
        const matchesStatus = this.statusFilter === 'all' || task.status === this.statusFilter;
        const matchesPriority = this.priorityFilter === 'all' || task.priority === this.priorityFilter;
        const matchesSearch = this.searchTerm === '' || 
                             task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             task.taskNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                             (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
        
        return matchesStatus && matchesPriority && matchesSearch;
      });
    } else {
      this.dataSource.data = this.tasks.filter(task => {
        return this.searchTerm === '' || 
               task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               task.taskNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
               (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
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
    this.priorityFilter = 'all';
    this.dataSource.data = this.tasks;
  }
  
  /**
   * فتح نافذة إضافة مهمة جديدة
   */
  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '800px',
      data: {
        title: 'إضافة مهمة جديدة',
        task: {},
        taskPriorities: this.taskPriorities,
        taskStatuses: this.taskStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addTask(result);
      }
    });
  }
  
  /**
   * فتح نافذة تعديل مهمة
   * @param taskData بيانات المهمة
   */
  openEditTaskDialog(taskData: any): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '800px',
      data: {
        title: 'تعديل المهمة',
        task: {...taskData},
        taskPriorities: this.taskPriorities,
        taskStatuses: this.taskStatuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTask(result);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد حذف مهمة
   * @param taskData بيانات المهمة
   */
  openDeleteConfirmation(taskData: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من رغبتك في حذف المهمة "${taskData.title}" (${taskData.taskNumber})؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteTask(taskData.id);
      }
    });
  }
  
  /**
   * فتح نافذة تأكيد تغيير حالة مهمة
   * @param taskData بيانات المهمة
   * @param newStatus الحالة الجديدة
   */
  openStatusChangeConfirmation(taskData: any, newStatus: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `تأكيد تغيير حالة المهمة`,
        message: `هل أنت متأكد من رغبتك في تغيير حالة المهمة "${taskData.title}" (${taskData.taskNumber}) إلى "${newStatus}"؟`,
        confirmText: 'تأكيد',
        cancelText: 'إلغاء'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.changeTaskStatus(taskData.id, newStatus);
      }
    });
  }
  
  /**
   * عرض تفاصيل المهمة
   * @param taskId معرف المهمة
   */
  viewTaskDetails(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }
  
  /**
   * إضافة مهمة جديدة
   * @param taskData بيانات المهمة الجديدة
   */
  addTask(taskData: any): void {
    this.taskService.createTask(taskData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تمت إضافة المهمة بنجاح',
          duration: 3000
        });
        this.loadTasks();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تحديث بيانات مهمة
   * @param taskData بيانات المهمة المحدثة
   */
  updateTask(taskData: any): void {
    this.taskService.updateTask(taskData.id, taskData).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم تحديث المهمة بنجاح',
          duration: 3000
        });
        this.loadTasks();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * حذف مهمة
   * @param taskId معرف المهمة
   */
  deleteTask(taskId: string): void {
    this.taskService.deleteTask(taskId).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: 'تم حذف المهمة بنجاح',
          duration: 3000
        });
        this.loadTasks();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * تغيير حالة مهمة
   * @param taskId معرف المهمة
   * @param status الحالة الجديدة
   */
  changeTaskStatus(taskId: string, status: string): void {
    this.taskService.updateTaskStatus(taskId, status).subscribe({
      next: (response) => {
        this.notificationService.showNotification({
          type: 'success',
          message: `تم تغيير حالة المهمة إلى "${status}" بنجاح`,
          duration: 3000
        });
        this.loadTasks();
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  /**
   * معالجة إسقاط المهمة في لوحة كانبان
   * @param event حدث السحب والإفلات
   */
  drop(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // تحديث حالة المهمة بناءً على العمود الذي تم إسقاطها فيه
      const task = event.container.data[event.currentIndex];
      let newStatus: string;
      
      switch (event.container.id) {
        case 'todoList':
          newStatus = 'قيد الانتظار';
          break;
        case 'inProgressList':
          newStatus = 'قيد التنفيذ';
          break;
        case 'reviewList':
          newStatus = 'قيد المراجعة';
          break;
        case 'completedList':
          newStatus = 'مكتملة';
          break;
        default:
          return;
      }
      
      if (task.status !== newStatus) {
        this.changeTaskStatus(task.id, newStatus);
      }
    }
  }
  
  /**
   * الحصول على لون أولوية المهمة
   * @param priority أولوية المهمة
   * @returns لون الأولوية
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'منخفضة':
        return 'low';
      case 'متوسطة':
        return 'medium';
      case 'عالية':
        return 'high';
      case 'عاجلة':
        return 'urgent';
      default:
        return 'default';
    }
  }
  
  /**
   * الحصول على لون حالة المهمة
   * @param status حالة المهمة
   * @returns لون الحالة
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'قيد الانتظار':
        return 'info';
      case 'قيد التنفيذ':
        return 'warning';
      case 'قيد المراجعة':
        return 'primary';
      case 'مكتملة':
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
    
    return this.datePipe.transform(date, 'yyyy-MM-dd');
  }
  
  /**
   * التحقق من تأخر المهمة
   * @param task بيانات المهمة
   * @returns هل المهمة متأخرة
   */
  isTaskOverdue(task: any): boolean {
    if (!task.dueDate || task.status === 'مكتملة') return false;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  }
  
  /**
   * التحقق من اقتراب موعد استحقاق المهمة
   * @param task بيانات المهمة
   * @returns هل موعد استحقاق المهمة قريب
   */
  isTaskDueSoon(task: any): boolean {
    if (!task.dueDate || task.status === 'مكتملة') return false;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);
    
    return dueDate <= threeDaysFromNow && dueDate >= today;
  }
}
