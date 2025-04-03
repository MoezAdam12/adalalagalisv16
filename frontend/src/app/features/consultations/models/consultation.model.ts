export enum ConsultationType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  ROUTINE = 'routine',
  SPECIALIZED = 'specialized'
}

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show'
}

export enum ConsultationMode {
  IN_PERSON = 'in_person',
  VIDEO = 'video',
  PHONE = 'phone',
  EMAIL = 'email',
  CHAT = 'chat'
}

export enum ConsultationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Consultation {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  clientName: string;
  attorneyId?: string;
  attorneyName?: string;
  type: ConsultationType;
  status: ConsultationStatus;
  mode: ConsultationMode;
  priority: ConsultationPriority;
  scheduledDate: string | Date;
  duration: number; // in minutes
  actualStartTime?: string | Date;
  actualEndTime?: string | Date;
  location?: string;
  meetingLink?: string;
  phoneNumber?: string;
  fee?: number;
  currency?: string;
  isPaid?: boolean;
  paymentDate?: string | Date;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  summary?: string;
  followUpRequired?: boolean;
  followUpDate?: string | Date;
  relatedCaseId?: string;
  relatedCaseName?: string;
  relatedDocumentIds?: string[];
  relatedDocuments?: any[]; // Document references
  relatedTaskIds?: string[];
  relatedTasks?: any[]; // Task references
  tags?: string[];
  createdBy: string;
  createdDate: string | Date;
  updatedBy?: string;
  updatedDate?: string | Date;
  tenantId: string;
}

export interface ConsultationNote {
  id: string;
  consultationId: string;
  content: string;
  isPrivate: boolean; // If true, only visible to attorneys
  createdBy: string;
  createdByName?: string;
  createdDate: string | Date;
  updatedBy?: string;
  updatedDate?: string | Date;
}

export interface ConsultationAttachment {
  id: string;
  consultationId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  description?: string;
  isPrivate: boolean; // If true, only visible to attorneys
  uploadDate: string | Date;
  uploadedBy: string;
  uploadedByName?: string;
}

export interface ConsultationFeedback {
  id: string;
  consultationId: string;
  rating: number; // 1-5
  comments?: string;
  submittedBy: string;
  submittedByName?: string;
  submittedDate: string | Date;
}

export interface ConsultationCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  tenantId: string;
}

export interface ConsultationFilter {
  clientId?: string;
  attorneyId?: string;
  type?: ConsultationType;
  status?: ConsultationStatus;
  mode?: ConsultationMode;
  priority?: ConsultationPriority;
  startDate?: string | Date;
  endDate?: string | Date;
  isPaid?: boolean;
  followUpRequired?: boolean;
  relatedCaseId?: string;
  tags?: string[];
  searchText?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ConsultationStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
  noShow: number;
  averageDuration: number;
  averageRating: number;
  totalRevenue: number;
  unpaidAmount: number;
}
