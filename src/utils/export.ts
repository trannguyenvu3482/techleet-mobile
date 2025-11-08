import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export interface ExportData {
  headers: string[];
  rows: Array<string[]>;
}

export interface ExportOptions {
  filename?: string;
  format?: 'csv' | 'json';
}

export class ExportService {
  static async exportToCSV(data: ExportData, options: ExportOptions = {}): Promise<void> {
    try {
      const { headers, rows } = data;
      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.csv`;

      let csvContent = headers.join(',') + '\n';
      rows.forEach((row) => {
        const escapedRow = row.map((cell) => {
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        });
        csvContent += escapedRow.join(',') + '\n';
      });

      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export CSV',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      Alert.alert('Error', 'Failed to export CSV file');
      throw error;
    }
  }

  static async exportToJSON(data: unknown, options: ExportOptions = {}): Promise<void> {
    try {
      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.json`;

      const jsonContent = JSON.stringify(data, null, 2);
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export JSON',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      Alert.alert('Error', 'Failed to export JSON file');
      throw error;
    }
  }

  static async exportJobsToCSV(jobs: any[]): Promise<void> {
    const headers = [
      'ID',
      'Title',
      'Status',
      'Location',
      'Employment Type',
      'Experience Level',
      'Vacancies',
      'Application Count',
      'Created At',
      'Updated At',
    ];

    const rows = jobs.map((job) => [
      String(job.jobPostingId || ''),
      job.title || '',
      job.status || '',
      job.location || '',
      job.employmentType || '',
      job.experienceLevel || '',
      String(job.vacancies || 0),
      String(job.applicationCount || 0),
      job.createdAt || '',
      job.updatedAt || '',
    ]);

    await this.exportToCSV(
      { headers, rows },
      { filename: `jobs_export_${new Date().toISOString().split('T')[0]}.csv` }
    );
  }

  static async exportApplicationsToCSV(applications: any[]): Promise<void> {
    const headers = [
      'ID',
      'Job Title',
      'Candidate Name',
      'Status',
      'Score',
      'Applied At',
      'Created At',
    ];

    const rows = applications.map((app) => [
      String(app.applicationId || ''),
      app.jobPosting?.title || '',
      app.candidate
        ? `${app.candidate.firstName || ''} ${app.candidate.lastName || ''}`.trim()
        : '',
      app.applicationStatus || '',
      String(app.score || 0),
      app.appliedAt || '',
      app.createdAt || '',
    ]);

    await this.exportToCSV(
      { headers, rows },
      { filename: `applications_export_${new Date().toISOString().split('T')[0]}.csv` }
    );
  }

  static async exportCandidatesToCSV(candidates: any[]): Promise<void> {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Status',
      'Years of Experience',
      'Expected Salary',
      'Skills',
      'Created At',
    ];

    const rows = candidates.map((candidate) => [
      String(candidate.candidateId || ''),
      candidate.firstName || '',
      candidate.lastName || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.status || '',
      String(candidate.yearsOfExperience || 0),
      String(candidate.expectedSalary || 0),
      candidate.skills || '',
      candidate.createdAt || '',
    ]);

    await this.exportToCSV(
      { headers, rows },
      { filename: `candidates_export_${new Date().toISOString().split('T')[0]}.csv` }
    );
  }

  static async exportInterviewsToCSV(interviews: any[]): Promise<void> {
    const headers = [
      'ID',
      'Job Title',
      'Candidate Name',
      'Scheduled At',
      'Duration',
      'Status',
      'Location',
      'Meeting URL',
      'Created At',
    ];

    const rows = interviews.map((interview) => [
      String(interview.interviewId || ''),
      interview.application?.jobPosting?.title || '',
      interview.application?.candidate
        ? `${interview.application.candidate.firstName || ''} ${interview.application.candidate.lastName || ''}`.trim()
        : '',
      interview.scheduledAt || '',
      String(interview.duration || 0),
      interview.status || '',
      interview.location || '',
      interview.meetingUrl || '',
      interview.createdAt || '',
    ]);

    await this.exportToCSV(
      { headers, rows },
      { filename: `interviews_export_${new Date().toISOString().split('T')[0]}.csv` }
    );
  }

  static async exportReportsToCSV(summary: any, trends: any[], funnel: any[]): Promise<void> {
    const headers = ['Report Type', 'Metric', 'Value'];
    const rows: string[][] = [];

    if (summary) {
      rows.push(['Summary', 'Total Jobs', String(summary.totalJobs || 0)]);
      rows.push(['Summary', 'Total Applications', String(summary.totalApplications || 0)]);
      rows.push(['Summary', 'Total Candidates', String(summary.totalCandidates || 0)]);
      rows.push(['Summary', 'Total Interviews', String(summary.totalInterviews || 0)]);
    }

    if (trends && trends.length > 0) {
      trends.forEach((trend) => {
        rows.push(['Trend', trend.date || '', String(trend.value || 0)]);
      });
    }

    if (funnel && funnel.length > 0) {
      funnel.forEach((stage) => {
        rows.push(['Funnel', stage.stage || '', String(stage.count || 0)]);
      });
    }

    await this.exportToCSV(
      { headers, rows },
      { filename: `reports_export_${new Date().toISOString().split('T')[0]}.csv` }
    );
  }
}

export const exportService = ExportService;

