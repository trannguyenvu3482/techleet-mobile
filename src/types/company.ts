import { ApiResponse, PaginatedResponse } from './api';

// Department Types (matching backend DTOs)
export interface CreateDepartmentDto {
  departmentName: string;
  headquarterId?: number;
  departmentTypeId?: number;
  leaderId?: number;
  description?: string;
}

export interface UpdateDepartmentDto {
  departmentName?: string;
  headquarterId?: number;
  departmentTypeId?: number;
  leaderId?: number;
  description?: string;
}

export interface DepartmentResponseDto {
  departmentId: number;
  departmentName: string;
  headquarterId?: number;
  departmentTypeId?: number;
  leaderId?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  headquarter?: {
    headquarterId: number;
    headquarterName: string;
  };
  departmentType?: {
    departmentTypeId: number;
    typeName: string;
  };
  leader?: {
    employeeId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  employeeCount?: number;
}

export interface GetDepartmentsQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  headquarterId?: number;
  departmentTypeId?: number;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Position Types (matching backend DTOs)
export interface CreatePositionDto {
  positionName: string;
  departmentId: number;
  positionTypeId?: number;
  description?: string;
  requirements?: string;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface UpdatePositionDto {
  positionName?: string;
  departmentId?: number;
  positionTypeId?: number;
  description?: string;
  requirements?: string;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface PositionResponseDto {
  positionId: number;
  positionName: string;
  departmentId: number;
  positionTypeId?: number;
  description?: string;
  requirements?: string;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: {
    departmentId: number;
    departmentName: string;
  };
  positionType?: {
    positionTypeId: number;
    typeName: string;
  };
  employeeCount?: number;
}

export interface GetPositionsQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  departmentId?: number;
  positionTypeId?: number;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Headquarter Types (matching backend DTOs)
export interface CreateHeadquarterDto {
  headquarterName: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber?: string;
  email?: string;
}

export interface UpdateHeadquarterDto {
  headquarterName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  email?: string;
}

export interface HeadquarterResponseDto {
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
  departmentCount?: number;
}

export interface GetHeadquartersQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Department Type (lookup)
export interface DepartmentTypeDto {
  departmentTypeId: number;
  typeName: string;
  description?: string;
  isActive: boolean;
}

// Position Type (lookup)
export interface PositionTypeDto {
  positionTypeId: number;
  typeName: string;
  description?: string;
  isActive: boolean;
}

// Company Statistics
export interface CompanyStatisticsDto {
  totalEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  totalHeadquarters: number;
  employeesByDepartment: Array<{
    departmentName: string;
    employeeCount: number;
  }>;
  employeesByHeadquarter: Array<{
    headquarterName: string;
    employeeCount: number;
  }>;
  employeesByLevel: Array<{
    level: string;
    employeeCount: number;
  }>;
}

// API Response Types
export type DepartmentApiResponse = ApiResponse<DepartmentResponseDto>;
export type DepartmentsApiResponse = ApiResponse<PaginatedResponse<DepartmentResponseDto>>;
export type PositionApiResponse = ApiResponse<PositionResponseDto>;
export type PositionsApiResponse = ApiResponse<PaginatedResponse<PositionResponseDto>>;
export type HeadquarterApiResponse = ApiResponse<HeadquarterResponseDto>;
export type HeadquartersApiResponse = ApiResponse<PaginatedResponse<HeadquarterResponseDto>>;
export type DepartmentTypesApiResponse = ApiResponse<DepartmentTypeDto[]>;
export type PositionTypesApiResponse = ApiResponse<PositionTypeDto[]>;
export type CompanyStatisticsApiResponse = ApiResponse<CompanyStatisticsDto>;
