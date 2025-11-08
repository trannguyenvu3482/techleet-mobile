import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  applications: boolean;
  interviews: boolean;
  reminders: boolean;
  statusChanges: boolean;
}

const NOTIFICATION_PREFERENCES_KEY = 'notification-preferences';
const DEVICE_TOKEN_KEY = 'device-token';

export class NotificationService {
  private static instance: NotificationService;
  private deviceToken: string | null = null;
  private preferences: NotificationPreferences = {
    applications: true,
    interviews: true,
    reminders: true,
    statusChanges: true,
  };

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadPreferences();
    await this.registerForPushNotifications();
  }

  async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      this.preferences = preferences;
      await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '4f7ecbdd-a1bc-44a6-87c3-bc5d2572071b',
      });

      this.deviceToken = token.data;
      await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token.data);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      await this.registerTokenWithBackend(token.data);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/api/v1/user-service/notifications/register', {
        deviceToken: token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register device token with backend:', error);
    }
  }

  async unregisterToken(): Promise<void> {
    try {
      if (this.deviceToken) {
        await api.post('/api/v1/user-service/notifications/unregister', {
          deviceToken: this.deviceToken,
        });
      }
      await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
      this.deviceToken = null;
    } catch (error) {
      console.error('Failed to unregister device token:', error);
    }
  }

  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date | number,
    data?: Record<string, unknown>
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger,
    });
    return identifier;
  }

  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  shouldShowNotification(type: keyof NotificationPreferences): boolean {
    return this.preferences[type];
  }

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = NotificationService.getInstance();

