import { ApiResponse } from './api';

// Authentication Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Authentication Response Types (matching backend DTOs)
export interface LoginResponse {
  employeeId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  token: string;
  refreshToken: string;
}

// User/Employee Types
export interface User {
  employeeId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  firstName?: string;
  lastName?: string;
  address?: string;
  birthDate?: string;
  gender?: boolean;
  startDate?: string;
  isActive?: boolean;
  baseSalary?: number;
  departmentId?: number;
  positionId?: number;
  permissions?: number[];
  department?: {
    departmentId: number;
    departmentName: string;
  };
  position?: {
    positionId: number;
    positionName: string;
  };
}

// API Response Types
export type LoginApiResponse = ApiResponse<LoginResponse>;
export type UserApiResponse = ApiResponse<User>;
export type RefreshTokenApiResponse = ApiResponse<LoginResponse>;

