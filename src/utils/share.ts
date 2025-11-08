import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  mimeType?: string;
}

export class ShareService {
  static async shareText(message: string, title?: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(message, {
          dialogTitle: title || 'Share',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing text:', error);
      Alert.alert('Error', 'Failed to share');
    }
  }

  static async shareJob(job: any): Promise<void> {
    try {
      const message = `Job: ${job.title}\n\n${job.description || ''}\n\nLocation: ${job.location || 'N/A'}\nEmployment Type: ${job.employmentType || 'N/A'}\nExperience Level: ${job.experienceLevel || 'N/A'}\n\nSalary: ${job.salaryMin || 'N/A'} - ${job.salaryMax || 'N/A'}`;
      
      await this.shareText(message, `Share Job: ${job.title}`);
    } catch (error) {
      console.error('Error sharing job:', error);
      Alert.alert('Error', 'Failed to share job');
    }
  }

  static async shareCandidate(candidate: any): Promise<void> {
    try {
      const message = `Candidate: ${candidate.firstName || ''} ${candidate.lastName || ''}\n\nEmail: ${candidate.email || 'N/A'}\nPhone: ${candidate.phoneNumber || 'N/A'}\nStatus: ${candidate.status || 'N/A'}\nExperience: ${candidate.yearsOfExperience || 0} years\nExpected Salary: ${candidate.expectedSalary || 'N/A'}\n\nSkills: ${candidate.skills || 'N/A'}`;
      
      await this.shareText(message, `Share Candidate: ${candidate.firstName || ''} ${candidate.lastName || ''}`);
    } catch (error) {
      console.error('Error sharing candidate:', error);
      Alert.alert('Error', 'Failed to share candidate');
    }
  }

  static async shareApplication(application: any): Promise<void> {
    try {
      const candidateName = application.candidate
        ? `${application.candidate.firstName || ''} ${application.candidate.lastName || ''}`
        : 'Unknown Candidate';
      const jobTitle = application.jobPosting?.title || 'Unknown Position';
      
      const message = `Application Details\n\nCandidate: ${candidateName}\nJob: ${jobTitle}\nStatus: ${application.applicationStatus || 'N/A'}\nScore: ${application.score || 'N/A'}\nApplied At: ${application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}`;
      
      await this.shareText(message, `Share Application: ${candidateName}`);
    } catch (error) {
      console.error('Error sharing application:', error);
      Alert.alert('Error', 'Failed to share application');
    }
  }

  static async shareInterview(interview: any): Promise<void> {
    try {
      const candidateName = interview.application?.candidate
        ? `${interview.application.candidate.firstName || ''} ${interview.application.candidate.lastName || ''}`
        : 'Unknown Candidate';
      const jobTitle = interview.application?.jobPosting?.title || 'Unknown Position';
      const scheduledDate = interview.scheduledAt
        ? new Date(interview.scheduledAt).toLocaleString()
        : 'N/A';
      
      const message = `Interview Details\n\nCandidate: ${candidateName}\nJob: ${jobTitle}\nScheduled At: ${scheduledDate}\nDuration: ${interview.duration || 0} minutes\nStatus: ${interview.status || 'N/A'}\n${interview.location ? `Location: ${interview.location}` : ''}\n${interview.meetingUrl ? `Meeting URL: ${interview.meetingUrl}` : ''}`;
      
      await this.shareText(message, `Share Interview: ${candidateName}`);
    } catch (error) {
      console.error('Error sharing interview:', error);
      Alert.alert('Error', 'Failed to share interview');
    }
  }
}

export const shareService = ShareService;

