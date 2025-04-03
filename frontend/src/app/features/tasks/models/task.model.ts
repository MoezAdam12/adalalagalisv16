export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  startDate?: Date;
  completedDate?: Date;
  assignedTo?: string;
  assignedToName?: string;
  createdBy: string;
  createdByName?: string;
  createdDate: Date;
  lastModified: Date;
  categoryId?: string;
  categoryName?: string;
  tags?: string[];
  relatedDocumentIds?: string[];
  relatedDocuments?: { id: string; title: string }[];
  relatedConsultationIds?: string[];
  relatedConsultations?: { id: string; title: string }[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  reminderDate?: Date;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  parentTaskId?: string;
  subtasks?: Task[];
  tenantId: string;
  customFields?: { [key: string]: any };
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
  DEFERRED = 'deferred'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdDate: Date;
  lastModified?: Date;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  commentId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: Date;
  uploadedBy: string;
  downloadUrl?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentCategoryId?: string;
  tenantId: string;
  taskCount?: number;
  createdDate: Date;
  lastModified: Date;
}

export interface RecurringPattern {
  frequency: RecurringFrequency;
  interval: number;
  endDate?: Date;
  endAfterOccurrences?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
}

export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface TaskSearchParams {
  query?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignedTo?: string;
  createdBy?: string;
  categoryId?: string;
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdDateFrom?: Date;
  createdDateTo?: Date;
  hasAttachments?: boolean;
  hasRelatedDocuments?: boolean;
  hasRelatedConsultations?: boolean;
  isOverdue?: boolean;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  assignedBy: string;
  assignedDate: Date;
  notes?: string;
  notifyUser?: boolean;
}

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  tasksByStatus: { [key in TaskStatus]?: number };
  tasksByPriority: { [key in TaskPriority]?: number };
  tasksByAssignee: { [userId: string]: { name: string; count: number } };
  tasksByCategory: { [categoryId: string]: { name: string; count: number } };
  averageCompletionTime?: number;
  tasksTrendByDay?: { date: string; count: number }[];
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  priority: TaskPriority;
  estimatedHours?: number;
  steps?: TaskTemplateStep[];
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  tenantId: string;
}

export interface TaskTemplateStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedHours?: number;
}

export interface TaskWorkflow {
  id: string;
  name: string;
  description?: string;
  stages: TaskWorkflowStage[];
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  tenantId: string;
  isDefault?: boolean;
  isActive: boolean;
}

export interface TaskWorkflowStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  taskStatus: TaskStatus;
  allowedNextStages: string[];
  allowedPreviousStages: string[];
  isInitial?: boolean;
  isFinal?: boolean;
  requiresApproval?: boolean;
  approvers?: string[];
}
