import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  url?: string;
  alarms?: Array<{ relativeOffset?: number; method?: Calendar.AlarmMethod }>;
}

export class CalendarService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Calendar access is required to add interview events to your calendar.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      Alert.alert('Error', 'Failed to request calendar permissions');
      return false;
    }
  }

  static async getCalendars(): Promise<Calendar.Calendar[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      return calendars.filter((cal) => cal.allowsModifications);
    } catch (error) {
      console.error('Error getting calendars:', error);
      return [];
    }
  }

  static async getDefaultCalendar(): Promise<Calendar.Calendar | null> {
    try {
      const calendars = await this.getCalendars();
      if (calendars.length === 0) {
        return null;
      }

      const defaultCal = calendars.find((cal) => cal.isPrimary);
      return defaultCal || calendars[0];
    } catch (error) {
      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  static async createEvent(
    event: CalendarEvent,
    calendarId?: string
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const calendar = calendarId
        ? await Calendar.getCalendarAsync(calendarId)
        : await this.getDefaultCalendar();

      if (!calendar) {
        Alert.alert('Error', 'No calendar available to create event');
        return null;
      }

      const eventId = await Calendar.createEventAsync(calendar.id, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        url: event.url,
        alarms: event.alarms || [
          { relativeOffset: -60, method: Calendar.AlarmMethod.ALERT },
        ],
        timeZone: 'Asia/Ho_Chi_Minh',
      });

      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      Alert.alert('Error', 'Failed to create calendar event');
      return null;
    }
  }

  static async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId?: string
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      const calendar = calendarId
        ? await Calendar.getCalendarAsync(calendarId)
        : await this.getDefaultCalendar();

      if (!calendar) {
        return false;
      }

      await Calendar.updateEventAsync(eventId, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        url: event.url,
        alarms: event.alarms,
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      Alert.alert('Error', 'Failed to update calendar event');
      return false;
    }
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      Alert.alert('Error', 'Failed to delete calendar event');
      return false;
    }
  }

  static async getEvent(eventId: string): Promise<Calendar.Event | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const event = await Calendar.getEventAsync(eventId, {
        futureEvents: true,
      });
      return event;
    } catch (error) {
      console.error('Error getting calendar event:', error);
      return null;
    }
  }

  static async getEventsInRange(
    startDate: Date,
    endDate: Date,
    calendarIds?: string[]
  ): Promise<Calendar.Event[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const calendars = calendarIds
        ? await Promise.all(calendarIds.map((id) => Calendar.getCalendarAsync(id)))
        : await this.getCalendars();

      if (calendars.length === 0) {
        return [];
      }

      const allEvents: Calendar.Event[] = [];
      for (const calendar of calendars) {
        const events = await Calendar.getEventsAsync(
          [calendar.id],
          startDate,
          endDate
        );
        allEvents.push(...events);
      }

      return allEvents;
    } catch (error) {
      console.error('Error getting events in range:', error);
      return [];
    }
  }

  static createInterviewEvent(interview: {
    interviewId: number;
    candidateName: string;
    jobTitle: string;
    scheduledAt: string;
    duration: number;
    location?: string;
    meetingUrl?: string;
    notes?: string;
  }): CalendarEvent {
    const startDate = new Date(interview.scheduledAt);
    const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);

    const title = `Interview: ${interview.candidateName} - ${interview.jobTitle}`;
    let notes = `Interview ID: ${interview.interviewId}\n`;
    notes += `Candidate: ${interview.candidateName}\n`;
    notes += `Job: ${interview.jobTitle}\n`;
    if (interview.notes) {
      notes += `\nNotes: ${interview.notes}`;
    }

    return {
      title,
      startDate,
      endDate,
      location: interview.location,
      notes,
      url: interview.meetingUrl,
      alarms: [
        { relativeOffset: -60, method: Calendar.AlarmMethod.ALERT },
        { relativeOffset: -15, method: Calendar.AlarmMethod.ALERT },
      ],
    };
  }
}

export const calendarService = CalendarService;

