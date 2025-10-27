import { api } from './client';
import { LoginRequest, LoginResponse, RefreshTokenRequest, ChangePasswordRequest, User } from '@/types/auth';

export const authAPI = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return api.post('/api/v1/user-service/auth/login', data);
  },

  async logout(): Promise<void> {
    return api.post('/api/v1/user-service/auth/logout');
  },

  async refreshToken(data: RefreshTokenRequest): Promise<LoginResponse> {
    return api.post('/api/v1/user-service/auth/refresh', data);
  },

  async getProfile(): Promise<User> {
    return api.get('/api/v1/user-service/auth/profile');
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return api.post('/api/v1/user-service/auth/change-password', data);
  },
};

