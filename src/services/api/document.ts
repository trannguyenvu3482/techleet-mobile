import { api } from './client';
import { PaginatedResponse } from '@/types/api';
import {
  Document,
  DocumentCategory,
  DocumentVersion,
  DocumentAccess,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  GetDocumentsParams,
  GetDocumentsResponse,
  CreateDocumentCategoryRequest,
  UpdateDocumentCategoryRequest,
  DocumentStatistics,
} from '@/types/document';

// Document Management API
export const documentAPI = {
  // Document CRUD Operations
  async getDocuments(params: GetDocumentsParams = {}): Promise<GetDocumentsResponse> {
    const response = await api.get<PaginatedResponse<Document>>('/api/v1/recruitment-service/documents', params);
    return {
      data: response.data,
      total: response.total,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil(response.total / (params.limit || 10))
    };
  },

  async getDocumentById(documentId: number): Promise<Document> {
    return api.get(`/api/v1/recruitment-service/documents/${documentId}`);
  },

  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('categoryId', data.categoryId.toString());
    if (data.tags?.length) formData.append('tags', JSON.stringify(data.tags));
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
    if (data.expirationDate) formData.append('expirationDate', data.expirationDate);
    formData.append('file', data.file);

    return api.post('/api/v1/recruitment-service/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async updateDocument(documentId: number, data: UpdateDocumentRequest): Promise<Document> {
    return api.patch(`/api/v1/recruitment-service/documents/${documentId}`, data);
  },

  async deleteDocument(documentId: number): Promise<void> {
    return api.delete(`/api/v1/recruitment-service/documents/${documentId}`);
  },

  async downloadDocument(documentId: number): Promise<Blob> {
    const url = `/api/v1/recruitment-service/documents/${documentId}/download`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'}${url}`, {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${JSON.parse(token).state?.token}` } : {},
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    return response.blob();
  },

  async previewDocument(documentId: number): Promise<string> {
    return api.get(`/api/v1/recruitment-service/documents/${documentId}/preview`);
  },

  // Document Version Management
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return api.get(`/api/v1/recruitment-service/documents/${documentId}/versions`);
  },

  async uploadNewVersion(documentId: number, file: File, changeLog?: string): Promise<DocumentVersion> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeLog) formData.append('changeLog', changeLog);

    return api.post(`/api/v1/recruitment-service/documents/${documentId}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async downloadDocumentVersion(documentId: number, versionId: number): Promise<Blob> {
    const url = `/api/v1/recruitment-service/documents/${documentId}/versions/${versionId}/download`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'}${url}`, {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${JSON.parse(token).state?.token}` } : {},
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download document version: ${response.statusText}`);
    }
    
    return response.blob();
  },

  // Document Category Management
  async getDocumentCategories(): Promise<DocumentCategory[]> {
    return api.get('/api/v1/recruitment-service/document-categories');
  },

  async getDocumentCategoryById(categoryId: number): Promise<DocumentCategory> {
    return api.get(`/api/v1/recruitment-service/document-categories/${categoryId}`);
  },

  async createDocumentCategory(data: CreateDocumentCategoryRequest): Promise<DocumentCategory> {
    return api.post('/api/v1/recruitment-service/document-categories', data);
  },

  async updateDocumentCategory(categoryId: number, data: UpdateDocumentCategoryRequest): Promise<DocumentCategory> {
    return api.patch(`/api/v1/recruitment-service/document-categories/${categoryId}`, data);
  },

  async deleteDocumentCategory(categoryId: number): Promise<void> {
    return api.delete(`/api/v1/recruitment-service/document-categories/${categoryId}`);
  },

  // Document Access Management
  async getDocumentAccess(documentId: number): Promise<DocumentAccess[]> {
    return api.get(`/api/v1/recruitment-service/documents/${documentId}/access`);
  },

  async grantDocumentAccess(documentId: number, access: Omit<DocumentAccess, 'accessId' | 'grantedBy' | 'createdAt'>): Promise<DocumentAccess> {
    return api.post(`/api/v1/recruitment-service/documents/${documentId}/access`, access);
  },

  async revokeDocumentAccess(documentId: number, accessId: number): Promise<void> {
    return api.delete(`/api/v1/recruitment-service/documents/${documentId}/access/${accessId}`);
  },

  // Document Approval Workflow
  async submitForApproval(documentId: number): Promise<Document> {
    return api.patch(`/api/v1/recruitment-service/documents/${documentId}/submit-approval`);
  },

  async approveDocument(documentId: number, approved: boolean, reason?: string): Promise<Document> {
    return api.patch(`/api/v1/recruitment-service/documents/${documentId}/approve`, {
      approved,
      reason
    });
  },

  // Document Search and Filtering
  async searchDocuments(query: string, filters?: GetDocumentsParams): Promise<GetDocumentsResponse> {
    return this.getDocuments({
      ...filters,
      keyword: query
    });
  },

  async getDocumentsByCategory(categoryId: number, params: GetDocumentsParams = {}): Promise<GetDocumentsResponse> {
    return this.getDocuments({
      ...params,
      categoryId
    });
  },

  async getDocumentsByTag(tag: string, params: GetDocumentsParams = {}): Promise<GetDocumentsResponse> {
    return this.getDocuments({
      ...params,
      tags: [tag]
    });
  },

  async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    const response = await this.getDocuments({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
    return response.data;
  },

  async getPopularDocuments(limit: number = 10): Promise<Document[]> {
    const response = await this.getDocuments({
      limit,
      sortBy: 'downloadCount',
      sortOrder: 'DESC'
    });
    return response.data;
  },

  async getExpiringDocuments(days: number = 30): Promise<Document[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    
    const response = await this.getDocuments({
      dateTo: expirationDate.toISOString().split('T')[0],
      sortBy: 'expirationDate',
      sortOrder: 'ASC'
    });
    return response.data;
  },

  // Document Statistics
  async getDocumentStatistics(): Promise<DocumentStatistics> {
    return api.get('/api/v1/recruitment-service/documents/statistics');
  },

  async getCategoryStatistics(categoryId?: number): Promise<Record<string, unknown>> {
    const endpoint = categoryId 
      ? `/api/v1/recruitment-service/document-categories/${categoryId}/statistics`
      : '/api/v1/recruitment-service/document-categories/statistics';
    return api.get(endpoint);
  },

  // Bulk Operations
  async bulkDeleteDocuments(documentIds: number[]): Promise<void> {
    return api.delete('/api/v1/recruitment-service/documents/bulk', {
      documentIds
    });
  },

  async bulkUpdateCategory(documentIds: number[], categoryId: number): Promise<void> {
    return api.patch('/api/v1/recruitment-service/documents/bulk/category', {
      documentIds,
      categoryId
    });
  },

  async bulkUpdateTags(documentIds: number[], tags: string[]): Promise<void> {
    return api.patch('/api/v1/recruitment-service/documents/bulk/tags', {
      documentIds,
      tags
    });
  }
};

// Export types for use in components
export type {
  Document,
  DocumentCategory,
  DocumentVersion,
  DocumentAccess,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  GetDocumentsParams,
  GetDocumentsResponse,
  CreateDocumentCategoryRequest,
  UpdateDocumentCategoryRequest,
  DocumentStatistics,
};
