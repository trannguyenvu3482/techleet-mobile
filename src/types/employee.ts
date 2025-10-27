import { ApiResponse, PaginatedResponse } from './api';

// Permission Types
export interface PermissionDto {
  permissionId: number;
  permissionName: string;
  description?: string;
  resource: string;
  action: string;
  isActive: boolean;
}

// Employee Types (matching backend DTOs)
export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  address: string;
  birthDate: string; // ISO date string
  email: string;
  gender: boolean;
  startDate: string; // ISO date string
  isActive?: boolean;
  avatarUrl?: string;
  phoneNumber: string;
  baseSalary: number;
  departmentId: number;
  positionId: number;
  positionTypeId?: number;
  permissions?: number[];
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  address?: string;
  birthDate?: string; // ISO date string
  email?: string;
  gender?: boolean;
  startDate?: string; // ISO date string
  isActive?: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  baseSalary?: number;
  departmentId?: number;
  positionId?: number;
  positionTypeId?: number;
  permissions?: number[];
}

export interface EmployeeResponseDto {
  employeeId: number;
  firstName: string;
  lastName: string;
  address: string;
  birthDate: string; // ISO date string
  email: string;
  gender: boolean;
  startDate: string; // ISO date string
  isActive: boolean;
  avatarUrl?: string;
  phoneNumber: string;
  baseSalary: number;
  departmentId: number;
  positionId: number;
  positionTypeId?: number;
  permissions?: PermissionDto[];
  createdAt: string;
  updatedAt?: string;
  // Relations
  department?: {
    departmentId: number;
    departmentName: string;
  };
  position?: {
    positionId: number;
    positionName: string;
  };
  positionType?: {
    positionTypeId: number;
    typeName: string;
  };
}

export interface GetEmployeesQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  gender?: boolean;
  isActive?: boolean;
  departmentId?: number[];
  positionId?: number[];
  positionTypeId?: number;
  baseSalaryFrom?: number;
  baseSalaryTo?: number;
  startDateFrom?: string;
  startDateTo?: string;
  birthDateFrom?: string;
  birthDateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Legacy Employee interface for backward compatibility with existing components
export interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  birthDate: string;
  gender: boolean;
  startDate: string;
  isActive: boolean;
  avatarUrl?: string;
  baseSalary: number;
  departmentId: number;
  positionId: number;
  department?: {
    departmentId: number;
    departmentName: string;
  };
  position?: {
    positionId: number;
    positionName: string;
  };
  permissions?: PermissionDto[];
}

// API Response Types
export type EmployeeApiResponse = ApiResponse<EmployeeResponseDto>;
export type EmployeesApiResponse = ApiResponse<PaginatedResponse<EmployeeResponseDto>>;
export type PermissionsApiResponse = ApiResponse<PermissionDto[]>;
