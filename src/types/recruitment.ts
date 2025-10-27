import { ApiResponse, PaginatedResponse } from './api';

// Application Types (matching backend DTOs)
export interface CreateApplicationDto {
  jobPostingId: number;
  candidateId: number;
  coverLetter?: string;
  resumeUrl?: string;
  expectedStartDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  applicationNotes?: string;
  tags?: string;
}

export interface UpdateApplicationDto {
  coverLetter?: string;
  resumeUrl?: string;
  status?: 'submitted' | 'screening' | 'interviewing' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  reviewNotes?: string;
  score?: number;
  feedback?: string;
  offeredSalary?: number;
  offerExpiryDate?: string;
  offerStatus?: 'pending' | 'accepted' | 'rejected' | 'expired';
  rejectionReason?: string;
  expectedStartDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  applicationNotes?: string;
  tags?: string;
  reviewedBy?: number;
  hiringManagerId?: number;
  reviewedDate?: string;
  offerDate?: string;
  offerResponseDate?: string;
}

export interface ApplicationResponseDto {
  applicationId: number;
  jobPostingId: number;
  candidateId: number;
  coverLetter?: string;
  resumeUrl?: string;
  status: string;
  appliedDate: string;
  reviewedDate?: string;
  reviewNotes?: string;
  score?: number;
  feedback?: string;
  offerDate?: string;
  offeredSalary?: number;
  offerExpiryDate?: string;
  offerStatus?: string;
  offerResponseDate?: string;
  rejectionReason?: string;
  expectedStartDate?: string;
  applicationNotes?: string;
  priority?: string;
  tags?: string;
  reviewedBy?: number;
  hiringManagerId?: number;
  isScreeningCompleted?: boolean;
  screeningScore?: number;
  screeningStatus?: string;
  screeningCompletedAt?: string;
  daysSinceApplied?: number;
  formattedOfferedSalary?: string;
  isOfferActive?: boolean;
  daysUntilOfferExpiry?: number;
  statusColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetApplicationsQueryDto {
  page?: number;
  limit?: number;
  jobPostingId?: number;
  candidateId?: number;
  status?: 'submitted' | 'screening' | 'interviewing' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  minScore?: number;
  maxScore?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
  isScreeningCompleted?: boolean;
  minScreeningScore?: number;
  offerStatus?: 'pending' | 'accepted' | 'rejected' | 'expired';
  reviewedBy?: number;
  hiringManagerId?: number;
  sortBy?: 'applicationId' | 'appliedDate' | 'score' | 'screeningScore' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

// Candidate Types
export interface CandidateDto {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  certifications?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  certifications?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}

export interface UpdateCandidateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  certifications?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}

export interface GetCandidatesQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  city?: string;
  skills?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Job Posting Types
export interface JobPostingDto {
  jobPostingId: number;
  slug: string;
  title: string;
  description: string;
  requirements: string;
  minSalary: number;
  maxSalary: number;
  employmentType: string;
  experienceLevel: string;
  benefits: string;
  applicationDeadline: string;
  status: 'draft' | 'published' | 'closed';
  departmentId: number;
  positionId: number;
  headquarterId: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  department?: {
    departmentId: number;
    departmentName: string;
  };
  position?: {
    positionId: number;
    positionName: string;
  };
  headquarter?: {
    headquarterId: number;
    headquarterName: string;
    city: string;
  };
}

export interface CreateJobPostingDto {
  title: string;
  description: string;
  requirements: string;
  minSalary: number;
  maxSalary: number;
  employmentType: string;
  experienceLevel: string;
  benefits: string;
  applicationDeadline: string;
  status?: 'draft' | 'published';
  departmentId: number;
  positionId: number;
  headquarterId: number;
}

export interface UpdateJobPostingDto {
  title?: string;
  description?: string;
  requirements?: string;
  minSalary?: number;
  maxSalary?: number;
  employmentType?: string;
  experienceLevel?: string;
  benefits?: string;
  applicationDeadline?: string;
  status?: 'draft' | 'published' | 'closed';
  departmentId?: number;
  positionId?: number;
  headquarterId?: number;
}

export interface GetJobPostingsQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: 'draft' | 'published' | 'closed';
  departmentId?: number;
  positionId?: number;
  headquarterId?: number;
  employmentType?: string;
  experienceLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// API Response Types
export type ApplicationApiResponse = ApiResponse<ApplicationResponseDto>;
export type ApplicationsApiResponse = ApiResponse<PaginatedResponse<ApplicationResponseDto>>;
export type CandidateApiResponse = ApiResponse<CandidateDto>;
export type CandidatesApiResponse = ApiResponse<PaginatedResponse<CandidateDto>>;
export type JobPostingApiResponse = ApiResponse<JobPostingDto>;
export type JobPostingsApiResponse = ApiResponse<PaginatedResponse<JobPostingDto>>;
