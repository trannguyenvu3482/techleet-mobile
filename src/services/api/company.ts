import { api } from './client';
import { PaginatedResponse } from '@/types/api';

// Department Types
export interface Department {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  description?: string;
  managerId?: number;
  parentDepartmentId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manager?: {
    employeeId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  parentDepartment?: Department;
  childDepartments?: Department[];
  employeeCount?: number;
}

export interface CreateDepartmentRequest {
  departmentName: string;
  departmentCode: string;
  description?: string;
  managerId?: number;
  parentDepartmentId?: number;
  isActive?: boolean;
}

export interface UpdateDepartmentRequest {
  departmentName?: string;
  departmentCode?: string;
  description?: string;
  managerId?: number;
  parentDepartmentId?: number;
  isActive?: boolean;
}

export interface GetDepartmentsParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
  parentDepartmentId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface GetDepartmentsResponse {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Position Types
export interface Position {
  positionId: number;
  positionName: string;
  positionCode: string;
  description?: string;
  departmentId: number;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: Department;
  employeeCount?: number;
}

export interface CreatePositionRequest {
  positionName: string;
  positionCode: string;
  description?: string;
  departmentId: number;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  isActive?: boolean;
}

export interface UpdatePositionRequest {
  positionName?: string;
  positionCode?: string;
  description?: string;
  departmentId?: number;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
  isActive?: boolean;
}

export interface GetPositionsParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  keyword?: string;
  departmentId?: number;
  level?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface GetPositionsResponse {
  data: Position[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Headquarter Types
export interface Headquarter {
  headquarterId: number;
  headquarterName: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

export interface CreateHeadquarterRequest {
  headquarterName: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

export interface UpdateHeadquarterRequest {
  headquarterName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

export interface GetHeadquartersParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  keyword?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface GetHeadquartersResponse {
  data: Headquarter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Company Settings Types
export interface CompanySetting {
  settingId: number;
  settingKey: string;
  settingValue: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanySettingRequest {
  settingKey: string;
  settingValue: string;
  description?: string;
  category: string;
  isActive?: boolean;
}

export interface UpdateCompanySettingRequest {
  settingValue?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

export interface GetCompanySettingsParams extends Record<string, unknown> {
  category?: string;
  isActive?: boolean;
  keyword?: string;
}

// Company Statistics Types
export interface CompanyStatistics {
  totalEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  totalHeadquarters: number;
  activeJobPostings: number;
  totalApplications: number;
  pendingApplications: number;
  scheduledInterviews: number;
  employeesByDepartment: {
    departmentName: string;
    employeeCount: number;
  }[];
  employeesByHeadquarter: {
    headquarterName: string;
    employeeCount: number;
  }[];
  applicationsByStatus: {
    status: string;
    count: number;
  }[];
}

// Company Management API
export const companyAPI = {
  // Department Management
  async getDepartments(params: GetDepartmentsParams = {}): Promise<GetDepartmentsResponse> {
    const response = await api.get<PaginatedResponse<Department>>('/api/v1/company-service/departments', params);
    return {
      data: response.data,
      total: response.total,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil(response.total / (params.limit || 10))
    };
  },

  async getDepartmentById(departmentId: number): Promise<Department> {
    return api.get(`/api/v1/company-service/departments/${departmentId}`);
  },

  async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    return api.post('/api/v1/company-service/departments', data);
  },

  async updateDepartment(departmentId: number, data: UpdateDepartmentRequest): Promise<Department> {
    return api.patch(`/api/v1/company-service/departments/${departmentId}`, data);
  },

  async deleteDepartment(departmentId: number): Promise<void> {
    return api.delete(`/api/v1/company-service/departments/${departmentId}`);
  },

  async getDepartmentHierarchy(): Promise<Department[]> {
    return api.get('/api/v1/company-service/departments/hierarchy');
  },

  // Position Management
  async getPositions(params: GetPositionsParams = {}): Promise<GetPositionsResponse> {
    const response = await api.get<PaginatedResponse<Position>>('/api/v1/company-service/positions', params);
    return {
      data: response.data,
      total: response.total,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil(response.total / (params.limit || 10))
    };
  },

  async getPositionById(positionId: number): Promise<Position> {
    return api.get(`/api/v1/company-service/positions/${positionId}`);
  },

  async createPosition(data: CreatePositionRequest): Promise<Position> {
    return api.post('/api/v1/company-service/positions', data);
  },

  async updatePosition(positionId: number, data: UpdatePositionRequest): Promise<Position> {
    return api.patch(`/api/v1/company-service/positions/${positionId}`, data);
  },

  async deletePosition(positionId: number): Promise<void> {
    return api.delete(`/api/v1/company-service/positions/${positionId}`);
  },

  async getPositionsByDepartment(departmentId: number): Promise<Position[]> {
    return api.get(`/api/v1/company-service/departments/${departmentId}/positions`);
  },

  // Headquarter Management
  async getHeadquarters(params: GetHeadquartersParams = {}): Promise<GetHeadquartersResponse> {
    const response = await api.get<PaginatedResponse<Headquarter>>('/api/v1/company-service/headquarters', params);
    return {
      data: response.data,
      total: response.total,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil(response.total / (params.limit || 10))
    };
  },

  async getHeadquarterById(headquarterId: number): Promise<Headquarter> {
    return api.get(`/api/v1/company-service/headquarters/${headquarterId}`);
  },

  async createHeadquarter(data: CreateHeadquarterRequest): Promise<Headquarter> {
    return api.post('/api/v1/company-service/headquarters', data);
  },

  async updateHeadquarter(headquarterId: number, data: UpdateHeadquarterRequest): Promise<Headquarter> {
    return api.patch(`/api/v1/company-service/headquarters/${headquarterId}`, data);
  },

  async deleteHeadquarter(headquarterId: number): Promise<void> {
    return api.delete(`/api/v1/company-service/headquarters/${headquarterId}`);
  },

  // Company Settings Management
  async getCompanySettings(params: GetCompanySettingsParams = {}): Promise<CompanySetting[]> {
    return api.get('/api/v1/company-service/settings', params);
  },

  async getCompanySettingById(settingId: number): Promise<CompanySetting> {
    return api.get(`/api/v1/company-service/settings/${settingId}`);
  },

  async getCompanySettingByKey(settingKey: string): Promise<CompanySetting> {
    return api.get(`/api/v1/company-service/settings/key/${settingKey}`);
  },

  async createCompanySetting(data: CreateCompanySettingRequest): Promise<CompanySetting> {
    return api.post('/api/v1/company-service/settings', data);
  },

  async updateCompanySetting(settingId: number, data: UpdateCompanySettingRequest): Promise<CompanySetting> {
    return api.patch(`/api/v1/company-service/settings/${settingId}`, data);
  },

  async updateCompanySettingByKey(settingKey: string, settingValue: string): Promise<CompanySetting> {
    return api.patch(`/api/v1/company-service/settings/key/${settingKey}`, { settingValue });
  },

  async deleteCompanySetting(settingId: number): Promise<void> {
    return api.delete(`/api/v1/company-service/settings/${settingId}`);
  },

  // Company Statistics
  async getCompanyStatistics(): Promise<CompanyStatistics> {
    return api.get('/api/v1/company-service/statistics');
  },

  async getDepartmentStatistics(departmentId: number): Promise<Record<string, unknown>> {
    return api.get(`/api/v1/company-service/departments/${departmentId}/statistics`);
  },

  async getHeadquarterStatistics(headquarterId: number): Promise<Record<string, unknown>> {
    return api.get(`/api/v1/company-service/headquarters/${headquarterId}/statistics`);
  },
};

// Export types for use in components
// export type {
//   Department,
//   CreateDepartmentRequest,
//   UpdateDepartmentRequest,
//   GetDepartmentsParams,
//   GetDepartmentsResponse,
//   Position,
//   CreatePositionRequest,
//   UpdatePositionRequest,
//   GetPositionsParams,
//   GetPositionsResponse,
//   Headquarter,
//   CreateHeadquarterRequest,
//   UpdateHeadquarterRequest,
//   GetHeadquartersParams,
//   GetHeadquartersResponse,
//   CompanySetting,
//   CreateCompanySettingRequest,
//   UpdateCompanySettingRequest,
//   GetCompanySettingsParams,
//   CompanyStatistics,
// };
