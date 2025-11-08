import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notifications';

export interface Reminder {
  interviewId: number;
  notificationId: string;
  scheduledAt: string;
  reminderTime: number;
  createdAt: string;
}

const REMINDERS_STORAGE_KEY = 'interview-reminders';

export class ReminderService {
  private static instance: ReminderService;
  private reminders: Map<number, Reminder> = new Map();

  private constructor() {}

  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadReminders();
  }

  async loadReminders(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      if (stored) {
        const remindersArray: Reminder[] = JSON.parse(stored);
        this.reminders = new Map(remindersArray.map((r) => [r.interviewId, r]));
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  }

  async saveReminders(): Promise<void> {
    try {
      const remindersArray = Array.from(this.reminders.values());
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(remindersArray));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }

  async scheduleReminder(
    interviewId: number,
    scheduledAt: Date,
    reminderMinutes: number = 60,
    candidateName?: string,
    jobTitle?: string
  ): Promise<string | null> {
    if (!notificationService.shouldShowNotification('reminders')) {
      return null;
    }

    try {
      const reminderTime = new Date(scheduledAt.getTime() - reminderMinutes * 60 * 1000);
      const now = new Date();

      if (reminderTime <= now) {
        console.warn('Reminder time is in the past');
        return null;
      }

      const title = 'Interview Reminder';
      const body = candidateName && jobTitle
        ? `Interview with ${candidateName} for ${jobTitle} in ${reminderMinutes} minutes`
        : `Interview reminder in ${reminderMinutes} minutes`;

      const notificationId = await notificationService.scheduleLocalNotification(
        title,
        body,
        reminderTime,
        {
          type: 'interview-reminder',
          interviewId,
          scheduledAt: scheduledAt.toISOString(),
        }
      );

      const reminder: Reminder = {
        interviewId,
        notificationId,
        scheduledAt: scheduledAt.toISOString(),
        reminderTime: reminderMinutes,
        createdAt: new Date().toISOString(),
      };

      this.reminders.set(interviewId, reminder);
      await this.saveReminders();

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      return null;
    }
  }

  async cancelReminder(interviewId: number): Promise<void> {
    try {
      const reminder = this.reminders.get(interviewId);
      if (reminder) {
        await notificationService.cancelNotification(reminder.notificationId);
        this.reminders.delete(interviewId);
        await this.saveReminders();
      }
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
    }
  }

  async cancelAllReminders(): Promise<void> {
    try {
      for (const reminder of this.reminders.values()) {
        await notificationService.cancelNotification(reminder.notificationId);
      }
      this.reminders.clear();
      await this.saveReminders();
    } catch (error) {
      console.error('Failed to cancel all reminders:', error);
    }
  }

  async updateReminder(
    interviewId: number,
    scheduledAt: Date,
    reminderMinutes: number = 60,
    candidateName?: string,
    jobTitle?: string
  ): Promise<string | null> {
    await this.cancelReminder(interviewId);
    return await this.scheduleReminder(interviewId, scheduledAt, reminderMinutes, candidateName, jobTitle);
  }

  getReminder(interviewId: number): Reminder | undefined {
    return this.reminders.get(interviewId);
  }

  getAllReminders(): Reminder[] {
    return Array.from(this.reminders.values());
  }

  hasReminder(interviewId: number): boolean {
    return this.reminders.has(interviewId);
  }
}

export const reminderService = ReminderService.getInstance();

