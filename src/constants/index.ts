// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3030',
  TIMEOUT: 10000,
};

// Employment Types
export const EMPLOYMENT_TYPES = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
];

// Experience Levels
export const EXPERIENCE_LEVELS = [
  { label: 'Entry Level', value: 'entry' },
  { label: 'Mid Level', value: 'mid' },
  { label: 'Senior Level', value: 'senior' },
  { label: 'Lead/Manager', value: 'lead' },
];

// Application Status
export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  SCREENING: 'screening',
  INTERVIEWING: 'interviewing',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

// Application Status Colors
export const APPLICATION_STATUS_COLORS = {
  submitted: '#3b82f6',
  screening: '#f59e0b',
  interviewing: '#8b5cf6',
  offer: '#10b981',
  hired: '#059669',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
};

// Job Posting Status
export const JOB_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
} as const;

// Job Status Colors
export const JOB_STATUS_COLORS = {
  draft: '#6b7280',
  published: '#10b981',
  closed: '#ef4444',
};

// Priority Levels
export const PRIORITY_LEVELS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

// Priority Colors
export const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#dc2626',
};

