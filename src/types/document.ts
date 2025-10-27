export interface Document {
  documentId: number;
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  tags: string[];
  version: string;
  isActive: boolean;
  isPublic: boolean;
  downloadCount: number;
  uploadedBy: {
    employeeId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    employeeId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCategory {
  categoryId: number;
  categoryName: string;
  description?: string;
  color: string;
  icon: string;
  parentCategoryId?: number;
  isActive: boolean;
  documentCount?: number;
}

export interface DocumentVersion {
  versionId: number;
  documentId: number;
  version: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedBy: {
    employeeId: number;
    firstName: string;
    lastName: string;
  };
  changeLog?: string;
  createdAt: string;
}

export interface DocumentAccess {
  accessId: number;
  documentId: number;
  employeeId?: number;
  departmentId?: number;
  positionId?: number;
  accessType: 'read' | 'write' | 'admin';
  grantedBy: number;
  createdAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  categoryId: number;
  tags?: string[];
  isPublic?: boolean;
  expirationDate?: string;
  file: File;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  categoryId?: number;
  tags?: string[];
  isActive?: boolean;
  isPublic?: boolean;
  expirationDate?: string;
}

export interface GetDocumentsParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  keyword?: string;
  categoryId?: number;
  tags?: string[];
  isActive?: boolean;
  isPublic?: boolean;
  uploadedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface GetDocumentsResponse {
  data: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateDocumentCategoryRequest {
  categoryName: string;
  description?: string;
  color: string;
  icon: string;
  parentCategoryId?: number;
  isActive?: boolean;
}

export interface UpdateDocumentCategoryRequest {
  categoryName?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentCategoryId?: number;
  isActive?: boolean;
}

export interface DocumentStatistics {
  totalDocuments: number;
  totalCategories: number;
  totalDownloads: number;
  totalFileSize: number;
  documentsThisMonth: number;
  downloadsByCategory: {
    categoryName: string;
    downloadCount: number;
  }[];
  recentDocuments: Document[];
  popularDocuments: Document[];
  expiringDocuments: Document[];
}

// Document management specific enums
export enum DocumentCategoryType {
  ONBOARDING = 'onboarding',
  POLICIES = 'policies',
  REGULATIONS = 'regulations',
  TEMPLATES = 'templates',
  TRAINING = 'training',
  PROCEDURES = 'procedures',
  FORMS = 'forms',
  CONTRACTS = 'contracts',
  GUIDELINES = 'guidelines',
  ANNOUNCEMENTS = 'announcements'
}

export enum DocumentAccessType {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ARCHIVED = 'archived'
}
