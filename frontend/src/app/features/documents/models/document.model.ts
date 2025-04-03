export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: Date;
  lastModified: Date;
  categoryId?: string;
  categoryName?: string;
  tags?: string[];
  status: DocumentStatus;
  createdBy: string;
  tenantId: string;
  versionNumber: number;
  isLatestVersion: boolean;
  downloadUrl?: string;
  shareableLink?: string;
  permissions?: DocumentPermission[];
  metadata?: DocumentMetadata;
}

export enum DocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export interface DocumentPermission {
  userId: string;
  userName: string;
  permissionType: PermissionType;
  grantedDate: Date;
}

export enum PermissionType {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  FULL_ACCESS = 'full_access'
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  createdBy: string;
  changeDescription?: string;
  downloadUrl?: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  tenantId: string;
  documentCount?: number;
  createdDate: Date;
  lastModified: Date;
}

export interface DocumentMetadata {
  author?: string;
  creationDate?: Date;
  lastEditDate?: Date;
  pageCount?: number;
  keywords?: string[];
  language?: string;
  customFields?: { [key: string]: any };
}

export interface DocumentSearchParams {
  query?: string;
  categoryId?: string;
  tags?: string[];
  status?: DocumentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: string;
  fileType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DocumentShareSettings {
  documentId: string;
  expiryDate?: Date;
  password?: string;
  allowDownload: boolean;
  allowPrint: boolean;
  recipientEmails?: string[];
  message?: string;
}

export interface DocumentAnalysisResult {
  documentId: string;
  entities?: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    monetaryValues: string[];
  };
  classification?: {
    documentType: string;
    confidence: number;
    subcategory?: string;
    language: string;
  };
  summary?: string;
  keyPhrases?: string[];
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
}
