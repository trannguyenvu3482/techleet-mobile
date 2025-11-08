import { api } from './client';

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalCandidates: number;
  totalInterviews: number;
  interviewsThisWeek: number;
  recentApplications: number;
  recentCandidates: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface JobStatusBreakdown extends StatusBreakdown {
  status: 'draft' | 'published' | 'closed';
}

export interface ApplicationStatusBreakdown extends StatusBreakdown {
  status: string;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  jobCount: number;
  applicationCount: number;
  interviewCount: number;
}

export interface HiringFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  period: string;
  totalJobs: number;
  totalApplications: number;
  totalCandidates: number;
  totalInterviews: number;
  recentJobs: number;
  recentApplications: number;
  recentCandidates: number;
  jobStatusBreakdown: JobStatusBreakdown[];
  applicationStatusBreakdown: ApplicationStatusBreakdown[];
  topDepartments: DepartmentStats[];
}

export interface GetAnalyticsParams {
  period?: '7d' | '30d' | '90d' | '1y' | 'all';
  departmentId?: number;
  jobId?: number;
  startDate?: string;
  endDate?: string;
}

export const analyticsAPI = {
  async getDashboardStats(params?: GetAnalyticsParams): Promise<DashboardStats> {
    const period = params?.period || '30d';
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    try {
      const [jobsRes, applicationsRes, candidatesRes, interviewsRes] = await Promise.all([
        api.get('/api/v1/recruitment-service/job-postings', {
          limit: 1,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
        api.get('/api/v1/recruitment-service/applications', {
          limit: 1,
          sortBy: 'appliedDate',
          sortOrder: 'DESC',
        }),
        api.get('/api/v1/recruitment-service/candidates', {
          limit: 1,
          sortBy: 'candidateId',
          sortOrder: 'DESC',
        }),
        api.get('/api/v1/recruitment-service/interview', {
          limit: 100,
          sortBy: 'scheduledAt',
          sortOrder: 'ASC',
        }),
      ]);

      const totalJobs = jobsRes.total || 0;
      const activeJobs = jobsRes.data?.filter((job: any) => job.status === 'published').length || 0;
      const totalApplications = applicationsRes.total || 0;
      const pendingApplications = applicationsRes.data?.filter((app: any) => 
        app.applicationStatus === 'pending' || app.applicationStatus === 'screening'
      ).length || 0;
      const totalCandidates = candidatesRes.total || 0;
      const totalInterviews = interviewsRes.total || 0;

      const interviewsThisWeek = interviewsRes.data?.filter((interview: any) => {
        const scheduledDate = new Date(interview.scheduledAt);
        return scheduledDate >= startOfWeek && scheduledDate <= now;
      }).length || 0;

      const dateFilter = getDateFilter(period);
      const recentApplications = applicationsRes.data?.filter((app: any) => {
        if (!dateFilter) return true;
        const appliedDate = new Date(app.appliedAt);
        return appliedDate >= dateFilter.start && appliedDate <= dateFilter.end;
      }).length || 0;

      const recentCandidates = candidatesRes.data?.filter((candidate: any) => {
        if (!dateFilter) return true;
        const createdDate = new Date(candidate.createdAt);
        return createdDate >= dateFilter.start && createdDate <= dateFilter.end;
      }).length || 0;

      return {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        totalCandidates,
        totalInterviews,
        interviewsThisWeek,
        recentApplications,
        recentCandidates,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  async getSummary(params?: GetAnalyticsParams): Promise<AnalyticsSummary> {
    const period = params?.period || '30d';
    const dateFilter = getDateFilter(period);

    try {
      const [jobsRes, applicationsRes, candidatesRes, interviewsRes] = await Promise.all([
        api.get('/api/v1/recruitment-service/job-postings', {
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
        api.get('/api/v1/recruitment-service/applications', {
          limit: 100,
          sortBy: 'appliedDate',
          sortOrder: 'DESC',
        }),
        api.get('/api/v1/recruitment-service/candidates', {
          limit: 100,
          sortBy: 'candidateId',
          sortOrder: 'DESC',
        }),
        api.get('/api/v1/recruitment-service/interview', {
          limit: 100,
          sortBy: 'scheduledAt',
          sortOrder: 'ASC',
        }),
      ]);

      const totalJobs = jobsRes.total || 0;
      const totalApplications = applicationsRes.total || 0;
      const totalCandidates = candidatesRes.total || 0;
      const totalInterviews = interviewsRes.total || 0;

      const recentJobs = jobsRes.data?.filter((job: any) => {
        if (!dateFilter) return true;
        const createdDate = new Date(job.createdAt);
        return createdDate >= dateFilter.start && createdDate <= dateFilter.end;
      }).length || 0;

      const recentApplications = applicationsRes.data?.filter((app: any) => {
        if (!dateFilter) return true;
        const appliedDate = new Date(app.appliedAt);
        return appliedDate >= dateFilter.start && appliedDate <= dateFilter.end;
      }).length || 0;

      const recentCandidates = candidatesRes.data?.filter((candidate: any) => {
        if (!dateFilter) return true;
        const createdDate = new Date(candidate.createdAt);
        return createdDate >= dateFilter.start && createdDate <= dateFilter.end;
      }).length || 0;

      const jobStatusBreakdown = calculateStatusBreakdown(
        jobsRes.data || [],
        'status'
      ) as JobStatusBreakdown[];

      const applicationStatusBreakdown = calculateStatusBreakdown(
        applicationsRes.data || [],
        'applicationStatus'
      ) as ApplicationStatusBreakdown[];

      const topDepartments = calculateDepartmentStats(jobsRes.data || [], applicationsRes.data || [], interviewsRes.data || []);

      return {
        period,
        totalJobs,
        totalApplications,
        totalCandidates,
        totalInterviews,
        recentJobs,
        recentApplications,
        recentCandidates,
        jobStatusBreakdown,
        applicationStatusBreakdown,
        topDepartments,
      };
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  async getApplicationTrends(params?: GetAnalyticsParams): Promise<TrendData[]> {
    const period = params?.period || '30d';
    const dateFilter = getDateFilter(period);

    try {
      const applicationsRes = await api.get('/api/v1/recruitment-service/applications', {
        limit: 100,
        sortBy: 'appliedDate',
        sortOrder: 'ASC',
      });

      const applications = applicationsRes.data || [];
      const filteredApplications = dateFilter
        ? applications.filter((app: any) => {
            const appliedDate = new Date(app.appliedAt);
            return appliedDate >= dateFilter.start && appliedDate <= dateFilter.end;
          })
        : applications;

      return groupByDate(filteredApplications, 'appliedAt');
    } catch (error) {
      console.error('Error fetching application trends:', error);
      throw error;
    }
  },

  async getHiringFunnel(jobId?: number): Promise<HiringFunnelData[]> {
    try {
      const applicationsRes = await jobId
        ? await api.get(`/api/v1/recruitment-service/applications/by-job-posting/${jobId}`, {
            limit: 100,
          })
        : await api.get('/api/v1/recruitment-service/applications', {
            limit: 100,
          });

      const applications = applicationsRes.data || [];
      const total = applications.length;

      const funnel: HiringFunnelData[] = [
        {
          stage: 'Applied',
          count: total,
          percentage: 100,
        },
        {
          stage: 'Screening',
          count: applications.filter((app: any) => app.applicationStatus === 'screening').length,
          percentage: 0,
        },
        {
          stage: 'Interview',
          count: applications.filter((app: any) => 
            app.applicationStatus === 'interview' || app.applicationStatus === 'interview_scheduled'
          ).length,
          percentage: 0,
        },
        {
          stage: 'Offer',
          count: applications.filter((app: any) => app.applicationStatus === 'offer').length,
          percentage: 0,
        },
        {
          stage: 'Hired',
          count: applications.filter((app: any) => app.applicationStatus === 'hired').length,
          percentage: 0,
        },
      ];

      funnel.forEach((stage, index) => {
        if (index > 0) {
          stage.percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
        }
      });

      return funnel;
    } catch (error) {
      console.error('Error fetching hiring funnel:', error);
      throw error;
    }
  },
};

function getDateFilter(period: string): { start: Date; end: Date } | null {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (period) {
    case '7d':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      break;
    case '90d':
      start = new Date(now);
      start.setDate(now.getDate() - 90);
      break;
    case '1y':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
    default:
      return null;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function calculateStatusBreakdown(data: any[], statusField: string): StatusBreakdown[] {
  const breakdown: Record<string, number> = {};

  data.forEach((item) => {
    const status = item[statusField] || 'unknown';
    breakdown[status] = (breakdown[status] || 0) + 1;
  });

  return Object.entries(breakdown).map(([status, count]) => ({
    status,
    count,
  }));
}

function calculateDepartmentStats(
  jobs: any[],
  applications: any[],
  interviews: any[]
): DepartmentStats[] {
  const departmentMap: Record<number, DepartmentStats> = {};

  jobs.forEach((job) => {
    const deptId = job.departmentId || 0;
    if (!departmentMap[deptId]) {
      departmentMap[deptId] = {
        departmentId: deptId,
        departmentName: job.department?.departmentName || `Department ${deptId}`,
        jobCount: 0,
        applicationCount: 0,
        interviewCount: 0,
      };
    }
    departmentMap[deptId].jobCount++;
  });

  applications.forEach((app) => {
    const deptId = app.jobPosting?.departmentId || 0;
    if (departmentMap[deptId]) {
      departmentMap[deptId].applicationCount++;
    }
  });

  interviews.forEach((interview) => {
    const deptId = interview.application?.jobPosting?.departmentId || 0;
    if (departmentMap[deptId]) {
      departmentMap[deptId].interviewCount++;
    }
  });

  return Object.values(departmentMap)
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 5);
}

function groupByDate(data: any[], dateField: string): TrendData[] {
  const grouped: Record<string, number> = {};

  data.forEach((item) => {
    const date = new Date(item[dateField]);
    const dateKey = date.toISOString().split('T')[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([date, value]) => ({
      date,
      value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

