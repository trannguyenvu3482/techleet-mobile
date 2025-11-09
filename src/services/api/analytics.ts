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
  totalEmployees?: number;
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

    try {
      const response = await api.get('/api/v1/recruitment-service/analytics/dashboard/stats', {
        period,
      });
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  async getSummary(params?: GetAnalyticsParams): Promise<AnalyticsSummary> {
    const period = params?.period || '30d';

    try {
      const response = await api.get('/api/v1/recruitment-service/analytics/dashboard/summary', {
        period,
        departmentId: params?.departmentId,
        jobId: params?.jobId,
      });
      return response;
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  async getApplicationTrends(params?: GetAnalyticsParams): Promise<TrendData[]> {
    const period = params?.period || '30d';

    try {
      const response = await api.get('/api/v1/recruitment-service/analytics/dashboard/trends', {
        period,
        type: 'applications',
      });
      return response;
    } catch (error) {
      console.error('Error fetching application trends:', error);
      throw error;
    }
  },

  async getHiringFunnel(jobId?: number): Promise<HiringFunnelData[]> {
    try {
      const response = await api.get('/api/v1/recruitment-service/analytics/dashboard/funnel', {
        period: '30d',
        jobId,
      });
      return response;
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

