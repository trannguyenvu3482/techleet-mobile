import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useProtectedRoute } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationService } from '@/services/notifications';
import type { NotificationPreferences } from '@/services/notifications';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function NotificationSettingsScreen() {
  useProtectedRoute();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    applications: true,
    interviews: true,
    reminders: true,
    statusChanges: true,
  });
  const [loading, setLoading] = useState(true);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const prefs = notificationService.getPreferences();
      setPreferences(prefs);
      const token = notificationService.getDeviceToken();
      setDeviceToken(token);

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await notificationService.savePreferences(newPreferences);
  };

  const handleRequestPermission = async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        setDeviceToken(token);
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
        Alert.alert('Success', 'Push notifications enabled');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      Alert.alert('Error', 'Failed to enable notifications');
    }
  };

  const handleUnregister = async () => {
    Alert.alert(
      'Unregister Device',
      'Are you sure you want to disable push notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            await notificationService.unregisterToken();
            setDeviceToken(null);
            Alert.alert('Success', 'Device unregistered');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>Notification Settings</Text>
        </View>
      </View>

      <View className="flex-1 p-4">
        {/* Permission Status */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>Push Notifications</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: permissionStatus === 'granted' ? colors.successLight : colors.errorLight,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color: permissionStatus === 'granted' ? colors.success : colors.error,
                }}
              >
                {permissionStatus === 'granted' ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
          {permissionStatus !== 'granted' ? (
            <TouchableOpacity
              onPress={handleRequestPermission}
              className="px-4 py-2 rounded-lg mt-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold text-center">Enable Notifications</Text>
            </TouchableOpacity>
          ) : (
            <>
              {deviceToken && (
                <View className="mt-2">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Device Token:</Text>
                  <Text className="text-xs font-mono" style={{ color: colors.text }} numberOfLines={1}>
                    {deviceToken}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={handleUnregister}
                className="px-4 py-2 rounded-lg mt-2"
                style={{ backgroundColor: colors.error }}
              >
                <Text className="text-white font-semibold text-center">Unregister Device</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Notification Preferences */}
        <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Notification Types</Text>

          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>New Applications</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Get notified when new applications are received</Text>
              </View>
              <Switch
                value={preferences.applications}
                onValueChange={(value) => handlePreferenceChange('applications', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Interviews</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Get notified about interview schedules and updates</Text>
              </View>
              <Switch
                value={preferences.interviews}
                onValueChange={(value) => handlePreferenceChange('interviews', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Reminders</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Receive reminders before interviews</Text>
              </View>
              <Switch
                value={preferences.reminders}
                onValueChange={(value) => handlePreferenceChange('reminders', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Status Changes</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Get notified when application status changes</Text>
              </View>
              <Switch
                value={preferences.statusChanges}
                onValueChange={(value) => handlePreferenceChange('statusChanges', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

