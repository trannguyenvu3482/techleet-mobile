import { api } from './client';
import { JobPosting, Candidate, Application, Interview } from './recruitment';

export interface SearchResult {
  jobs: JobPosting[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  total: number;
}

export interface SearchParams {
  query: string;
  types?: ('jobs' | 'candidates' | 'applications' | 'interviews')[];
  limit?: number;
  page?: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
}

const searchAPI = {
  async search(params: SearchParams): Promise<SearchResult> {
    const { query, types, limit = 20, page = 0 } = params;
    
    const searchTypes = types || ['jobs', 'candidates', 'applications', 'interviews'];
    const results: SearchResult = {
      jobs: [],
      candidates: [],
      applications: [],
      interviews: [],
      total: 0,
    };

    try {
      const promises: Promise<unknown>[] = [];

      if (searchTypes.includes('jobs')) {
        promises.push(
          api.get('/api/v1/recruitment-service/job-postings', {
            keyword: query,
            limit,
            page,
          }).then((response) => {
            results.jobs = response.data || [];
          })
        );
      }

      if (searchTypes.includes('candidates')) {
        promises.push(
          api.get('/api/v1/recruitment-service/candidates', {
            keyword: query,
            limit,
            page,
          }).then((response) => {
            results.candidates = response.data || [];
          })
        );
      }

      if (searchTypes.includes('applications')) {
        promises.push(
          api.get('/api/v1/recruitment-service/applications', {
            keyword: query,
            limit,
            page,
          }).then((response) => {
            results.applications = response.data || [];
          })
        );
      }

      if (searchTypes.includes('interviews')) {
        promises.push(
          api.get('/api/v1/recruitment-service/interview', {
            keyword: query,
            limit,
            page,
          }).then((response) => {
            results.interviews = response.data || [];
          })
        );
      }

      await Promise.all(promises);

      results.total =
        results.jobs.length +
        results.candidates.length +
        results.applications.length +
        results.interviews.length;

      return results;
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  },

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const suggestions: string[] = [];
      
      const [jobsRes, candidatesRes] = await Promise.all([
        api.get('/api/v1/recruitment-service/job-postings', {
          keyword: query,
          limit: 5,
        }),
        api.get('/api/v1/recruitment-service/candidates', {
          keyword: query,
          limit: 5,
        }),
      ]);

      if (jobsRes.data) {
        jobsRes.data.forEach((job: JobPosting) => {
          if (job.title.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push(job.title);
          }
        });
      }

      if (candidatesRes.data) {
        candidatesRes.data.forEach((candidate: Candidate) => {
          const fullName = `${candidate.firstName} ${candidate.lastName}`;
          if (fullName.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push(fullName);
          }
        });
      }

      return [...new Set(suggestions)].slice(0, 5);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  },
};

export { searchAPI };

