import { api } from './client';
import {
  EmployeeResponseDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  GetEmployeesQueryDto,
  PermissionDto,
} from '@/types/employee';
import { PaginatedResponse } from '@/types/api';

export interface GetEmployeesResponse {
  data: EmployeeResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const employeeAPI = {
  async getEmployees(params: GetEmployeesQueryDto = {}): Promise<GetEmployeesResponse> {
    const response = await api.get<PaginatedResponse<EmployeeResponseDto>>('/api/v1/user-service/employee', params);
    return {
      data: response.data,
      total: response.total,
      page: response.page || 1,
      limit: response.limit || 10,
      totalPages: response.totalPages || 1,
    };
  },

  async getEmployeeById(employeeId: number): Promise<EmployeeResponseDto> {
    return api.get(`/api/v1/user-service/employee/${employeeId}`);
  },

  async createEmployee(data: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    return api.post('/api/v1/user-service/employee', data);
  },

  async updateEmployee(employeeId: number, data: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
    return api.patch(`/api/v1/user-service/employee/${employeeId}`, data);
  },

  async deleteEmployee(employeeId: number): Promise<void> {
    return api.delete(`/api/v1/user-service/employee/${employeeId}`);
  },

  async getMyProfile(): Promise<EmployeeResponseDto> {
    return api.get('/api/v1/user-service/employee/my-profile');
  },

  async getPermissions(): Promise<PermissionDto[]> {
    return api.get('/api/v1/user-service/permissions');
  },
};

