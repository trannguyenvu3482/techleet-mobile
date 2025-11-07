import { api } from "./client";
import { PaginatedResponse } from "@/types/api";

// Job Posting Types
export interface JobPosting {
  jobPostingId: number;
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  salaryMin: string;
  salaryMax: string;
  vacancies: number;
  applicationDeadline: string;
  status: "draft" | "published" | "closed";
  location: string;
  employmentType: string;
  experienceLevel: string;
  skills: string;
  minExperience: number;
  maxExperience: number;
  educationLevel: string;
  departmentId: number;
  positionId: number;
  hiringManagerId: number;
  salaryRange: string;
  isJobActive: boolean;
  daysUntilDeadline: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPostingRequest {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  salaryMin: number;
  salaryMax: number;
  vacancies: number;
  applicationDeadline: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  skills: string;
  minExperience: number;
  maxExperience: number;
  educationLevel: string;
  departmentId: number;
  positionId: number;
  hiringManagerId: number;
}

export interface UpdateJobPostingRequest {
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  vacancies?: number;
  applicationDeadline?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  skills?: string;
  minExperience?: number;
  maxExperience?: number;
  educationLevel?: string;
  departmentId?: number;
  positionId?: number;
  hiringManagerId?: number;
  status?: string;
}

export interface GetJobPostingsParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: "draft" | "published" | "closed";
  departmentId?: number;
  positionId?: number;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface GetJobPostingsResponse {
  data: JobPosting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Candidate Types
export interface Candidate {
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

export interface CreateCandidateRequest {
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

export interface UpdateCandidateRequest {
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

export interface GetCandidatesParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  keyword?: string;
  city?: string;
  skills?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface GetCandidatesResponse {
  data: Candidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Application Types
export interface Application {
  applicationId: number;
  candidateId: number;
  jobPostingId: number;
  coverLetter?: string;
  applicationStatus:
    | "pending"
    | "reviewing"
    | "interview"
    | "rejected"
    | "accepted";
  appliedAt: string;
  updatedAt: string;
  candidate?: Candidate;
  jobPosting?: JobPosting;
  score?: number;
}

export interface CreateApplicationRequest {
  candidateId: number;
  jobPostingId: number;
  coverLetter?: string;
}

export interface UpdateApplicationRequest {
  applicationStatus?:
    | "pending"
    | "reviewing"
    | "interview"
    | "rejected"
    | "accepted";
  coverLetter?: string;
}

export interface GetApplicationsParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  jobPostingId?: number;
  candidateId?: number;
  applicationStatus?:
    | "pending"
    | "reviewing"
    | "interview"
    | "rejected"
    | "accepted";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface GetApplicationsResponse {
  data: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interview Types
export interface Interview {
  interviewId: number;
  applicationId: number;
  interviewerUserId: number;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingUrl?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  createdAt: string;
  updatedAt: string;
  application?: Application;
  interviewer?: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateInterviewRequest {
  applicationId: number;
  interviewerUserId: number;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingUrl?: string;
  notes?: string;
}

export interface UpdateInterviewRequest {
  interviewerUserId?: number;
  scheduledAt?: string;
  duration?: number;
  location?: string;
  meetingUrl?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
}

export interface GetInterviewsParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  applicationId?: number;
  interviewerUserId?: number;
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface GetInterviewsResponse {
  data: Interview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Examination Types
export interface Examination {
  examinationId: number;
  applicationId: number;
  sourceSetId?: number;
  status?: string;
  submittedAt?: string | null;
  totalScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
  examQuestions?: ExamQuestion[];
}

export interface ExamQuestion {
  examinationQuestionId: number;
  examinationId: number;
  questionId: number;
  answerText?: string | null;
  score?: number | null;
  reason?: string | null;
  question?: {
    questionId: number;
    content: string;
    sampleAnswer?: string;
    difficulty: string;
    createdAt?: string;
    updatedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Question Types
export interface Question {
  questionId: number;
  content: string;
  sampleAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionRequest {
  content: string;
  sampleAnswer: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface UpdateQuestionRequest {
  content?: string;
  sampleAnswer?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface GetQuestionsResponse {
  data: Question[];
  total: number;
}

export interface QuestionSetItem {
  setItemId: number;
  question: Question;
}

export interface QuestionSet {
  setId: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  questionSetItems?: QuestionSetItem[];
}

export interface CreateQuestionSetRequest {
  title: string;
  description?: string;
}

export interface UpdateQuestionSetRequest {
  title?: string;
  description?: string;
}

export interface GetQuestionSetsResponse {
  data: QuestionSet[];
  total: number;
}

// CV Screening Types
export interface CvTestRequest {
  filePath: string;
  jobPostingId: number;
  mockApplicationId?: number;
  applicationId?: number;
}

export interface CvTestResult {
  success: boolean;
  processingTimeMs: number;
  extractedText: string;
  processedData: {
    skills: {
      technical: string[];
      soft: string[];
      languages: string[];
      frameworks: string[];
      tools: string[];
      certifications: string[];
    };
    experienceYears: number;
    education: Record<string, unknown>[];
    workExperience: Record<string, unknown>[];
  };
  scores: {
    overallScore: number;
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
  };
  summary: {
    summary: string;
    highlights: string[];
    concerns: string[];
    fitScore: number;
    recommendation: string;
    skillsAssessment: {
      technicalSkills: string[];
      experienceLevel: string;
      strengthAreas: string[];
      improvementAreas: string[];
    };
  };
  testInfo: {
    filePath: string;
    jobPostingId: string | number;
    mockApplicationId: number;
  };
}

// Candidate File Types
export interface CandidateFile {
  fileId: number;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: string;
  fileType: string;
  referenceId: number;
  status: string;
  description: string | null;
  metadata: {
    source: string;
    messageId: string;
    senderEmail: string;
    subject: string;
    downloadToken: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Recruitment Management API
export const recruitmentAPI = {
  // Job Posting Management
  async getJobPostings(
    params: GetJobPostingsParams = {}
  ): Promise<GetJobPostingsResponse> {
    const response = await api.get<PaginatedResponse<JobPosting>>(
      "/api/v1/recruitment-service/job-postings",
      params
    );
    return {
      data: response.data,
      total: response.total,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: Math.ceil(response.total / (params.limit || 10)),
    };
  },

  async getJobPostingById(jobPostingId: number): Promise<JobPosting> {
    return api.get(`/api/v1/recruitment-service/job-postings/${jobPostingId}`);
  },

  async getJobPostingBySlug(slug: string): Promise<JobPosting> {
    return api.get(`/api/v1/recruitment-service/job-postings/slug/${slug}`);
  },

  async createJobPosting(data: CreateJobPostingRequest): Promise<JobPosting> {
    return api.post("/api/v1/recruitment-service/job-postings", data);
  },

  async updateJobPosting(
    jobPostingId: number,
    data: UpdateJobPostingRequest
  ): Promise<JobPosting> {
    return api.patch(
      `/api/v1/recruitment-service/job-postings/${jobPostingId}`,
      data
    );
  },

  async deleteJobPosting(jobPostingId: number): Promise<void> {
    return api.delete(
      `/api/v1/recruitment-service/job-postings/${jobPostingId}`
    );
  },

  async publishJobPosting(jobPostingId: number): Promise<JobPosting> {
    return api.patch(
      `/api/v1/recruitment-service/job-postings/${jobPostingId}/publish`
    );
  },

  async closeJobPosting(jobPostingId: number): Promise<JobPosting> {
    return api.patch(
      `/api/v1/recruitment-service/job-postings/${jobPostingId}/close`
    );
  },

  // Candidate Management
  async getCandidates(
    params: GetCandidatesParams = {}
  ): Promise<GetCandidatesResponse> {
    return api.get("/api/v1/recruitment-service/candidates", params);
  },

  async getCandidateById(candidateId: number): Promise<Candidate> {
    return api.get(`/api/v1/recruitment-service/candidates/${String(candidateId)}`);
  },

  async createCandidate(data: CreateCandidateRequest): Promise<Candidate> {
    return api.post("/api/v1/recruitment-service/candidates", data);
  },

  async updateCandidate(
    candidateId: number,
    data: UpdateCandidateRequest
  ): Promise<Candidate> {
    return api.patch(
      `/api/v1/recruitment-service/candidates/${String(candidateId)}`,
      data
    );
  },

  async deleteCandidate(candidateId: number): Promise<void> {
    return api.delete(`/api/v1/recruitment-service/candidates/${String(candidateId)}`);
  },

  async uploadCandidateResume(
    candidateId: number,
    fileUri: string,
    fileName: string,
    fileType: string
  ): Promise<{ resumeUrl: string }> {
    return api.upload(
      `/api/v1/recruitment-service/candidates/${String(candidateId)}/resume`,
      fileUri,
      fileName,
      fileType
    );
  },

  async getCandidateFiles(candidateId: number): Promise<CandidateFile[]> {
    return api.get(
      `/api/v1/recruitment-service/files/candidate/${String(candidateId)}`
    );
  },

  // Application Management
  async getApplications(
    params: GetApplicationsParams = {}
  ): Promise<GetApplicationsResponse> {
    return api.get("/api/v1/recruitment-service/applications", params);
  },

  async getApplicationById(
    applicationId: number
  ): Promise<{ application: Application; candidate: Candidate }> {
    // Ensure applicationId is converted to a string for the route parameter
    // ParseIntPipe expects a numeric string
    return api.get(`/api/v1/recruitment-service/applications/${String(applicationId)}`);
  },

  async getApplicationsByJobId(jobId: number): Promise<{ 
    data: {
      applicationId: number;
      candidateId: number;
      firstName: string;
      lastName: string;
      email: string;
      status: string;
      createdAt: string;
      score: number | null;
    }[]
  }> {
    return api.get(`/api/v1/recruitment-service/applications/job/${jobId}`);
  },

  async createApplication(
    data: CreateApplicationRequest
  ): Promise<Application> {
    return api.post("/api/v1/recruitment-service/applications", data);
  },

  async updateApplication(
    applicationId: number,
    data: UpdateApplicationRequest
  ): Promise<Application> {
    return api.patch(
      `/api/v1/recruitment-service/applications/${applicationId}`,
      data
    );
  },

  async deleteApplication(applicationId: number): Promise<void> {
    return api.delete(
      `/api/v1/recruitment-service/applications/${applicationId}`
    );
  },

  async approveApplicationAfterInterview(
    applicationId: number,
    data: {
      offeredSalary: number;
      expectedStartDate: string;
      offerExpiryDate?: string;
    }
  ): Promise<Application> {
    return api.post(
      `/api/v1/recruitment-service/applications/${String(applicationId)}/approve`,
      data
    );
  },

  async rejectApplicationAfterInterview(
    applicationId: number,
    data?: {
      rejectionReason?: string;
    }
  ): Promise<Application> {
    return api.post(
      `/api/v1/recruitment-service/applications/${String(applicationId)}/reject`,
      data || {}
    );
  },

  // Interview Management
  async getInterviewRequests(params?: {
    page?: number;
    limit?: number;
    jobPostingId?: number;
    minScreeningScore?: number;
  }): Promise<GetApplicationsResponse> {
    return api.get("/api/v1/recruitment-service/applications/interview-requests", params);
  },

  async getInterviews(
    params: GetInterviewsParams = {}
  ): Promise<GetInterviewsResponse> {
    return api.get("/api/v1/recruitment-service/interview", params);
  },

  async getInterviewById(interviewId: number): Promise<Interview> {
    return api.get(`/api/v1/recruitment-service/interview/${interviewId}`);
  },

  async createInterview(data: CreateInterviewRequest): Promise<Interview> {
    return api.post("/api/v1/recruitment-service/interview", data);
  },

  async updateInterview(
    interviewId: number,
    data: UpdateInterviewRequest
  ): Promise<Interview> {
    return api.patch(
      `/api/v1/recruitment-service/interview/${interviewId}`,
      data
    );
  },

  async deleteInterview(interviewId: number): Promise<void> {
    return api.delete(`/api/v1/recruitment-service/interview/${interviewId}`);
  },

  async completeInterview(
    interviewId: number,
    feedback: string,
    rating: number
  ): Promise<Interview> {
    return api.patch(
      `/api/v1/recruitment-service/interviews/${interviewId}/complete`,
      {
        feedback,
        rating,
      }
    );
  },

  async cancelInterview(
    interviewId: number,
    reason?: string
  ): Promise<Interview> {
    return api.patch(
      `/api/v1/recruitment-service/interviews/${interviewId}/cancel`,
      {
        reason,
      }
    );
  },

  // CV Screening Management
  async testCvScreening(data: CvTestRequest): Promise<CvTestResult> {
    return api.post(
      "/api/v1/recruitment-service/cv-screening/test-local-cv",
      data
    );
  },

  // Get applications for testing purposes
  async getApplicationsForTesting(): Promise<
    {
      applicationId: number;
      candidateName: string;
      jobTitle: string;
      appliedDate: string;
    }[]
  > {
    const applications = await api.get<GetApplicationsResponse>(
      "/api/v1/recruitment-service/applications",
      { limit: 50 }
    );
    return applications.data.map((app) => ({
      applicationId: app.applicationId,
      candidateName: app.candidate
        ? `${app.candidate.firstName} ${app.candidate.lastName}`
        : "Unknown",
      jobTitle: app.jobPosting?.title || "Unknown Position",
      appliedDate: app.appliedAt,
    }));
  },

  // Examination Management
  async getExaminationsToDo(applicationId: number): Promise<Examination[]> {
    return api.get(`/api/v1/recruitment-service/question/examinations/todo/${applicationId}`);
  },

  async getExaminationDetail(examinationId: number): Promise<Examination> {
    return api.get(`/api/v1/recruitment-service/question/examinations/${examinationId}`);
  },

  async updateExamScore(examQuestionId: number, score: number, reason?: string): Promise<void> {
    return api.put(`/api/v1/recruitment-service/question/examinations/score/${examQuestionId}`, {
      score,
      reason,
    });
  },

  async revaluateExamination(examinationId: number): Promise<Examination> {
    return api.post(`/api/v1/recruitment-service/question/examinations/${examinationId}/revaluate`);
  },

  // Question Management
  async getQuestions(filter?: {
    page?: number;
    limit?: number;
    text?: string;
    difficulty?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<GetQuestionsResponse> {
    return api.get("/api/v1/recruitment-service/question/questions", filter);
  },

  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    return api.post("/api/v1/recruitment-service/question/questions", data);
  },

  async updateQuestion(
    questionId: number,
    data: UpdateQuestionRequest
  ): Promise<Question> {
    return api.put(
      `/api/v1/recruitment-service/question/questions/${questionId}`,
      data
    );
  },

  async deleteQuestion(questionId: number): Promise<void> {
    return api.delete(
      `/api/v1/recruitment-service/question/questions/${questionId}`
    );
  },

  // Question Set Management
  async getQuestionSets(filter?: {
    page?: number;
    limit?: number;
    text?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<GetQuestionSetsResponse> {
    return api.get(
      "/api/v1/recruitment-service/question/question-sets",
      filter
    );
  },

  async getQuestionSetById(setId: number): Promise<QuestionSet> {
    try {
      // Fetch with pagination if needed
      let allQuestionSets: QuestionSet[] = [];
      let page = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await api.get<GetQuestionSetsResponse>(
          '/api/v1/recruitment-service/question/question-sets',
          { page, limit }
        );
        allQuestionSets = [...allQuestionSets, ...response.data];
        
        // Check if we found the question set or if there are more pages
        const foundSet = allQuestionSets.find((set) => set.setId === setId);
        if (foundSet) {
          return foundSet;
        }
        
        // Check if there are more pages
        const totalPages = Math.ceil(response.total / limit);
        hasMore = page + 1 < totalPages;
        page++;
      }

      throw new Error(`Question set with ID ${setId} not found`);
    } catch (error) {
      console.error('Error in getQuestionSetById:', error);
      throw error;
    }
  },

  async createQuestionSet(
    data: CreateQuestionSetRequest
  ): Promise<QuestionSet> {
    return api.post("/api/v1/recruitment-service/question/question-sets", data);
  },

  async updateQuestionSet(
    setId: number,
    data: UpdateQuestionSetRequest
  ): Promise<QuestionSet> {
    return api.put(
      `/api/v1/recruitment-service/question/question-sets/${setId}`,
      data
    );
  },

  async deleteQuestionSet(setId: number): Promise<void> {
    return api.delete(
      `/api/v1/recruitment-service/question/question-sets/${setId}`
    );
  },

  async addQuestionToSet(
    setId: number,
    questionId: number
  ): Promise<QuestionSetItem> {
    return api.post(
      `/api/v1/recruitment-service/question/question-sets/${setId}/items/${questionId}`
    );
  },

  async removeQuestionFromSet(itemId: number): Promise<void> {
    return api.delete(
      `/api/v1/recruitment-service/question/question-sets/items/${itemId}`
    );
  },
};
