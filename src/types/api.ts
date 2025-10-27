// Standardized API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
}

// Paginated Response Type
export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// API Error Type
export interface ApiError {
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  error?: string;
}

// Generic API Request Options
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: unknown;
  timeout?: number;
}

// Export common HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

