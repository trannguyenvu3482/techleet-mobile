import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore, ThemeMode } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, isDark, setMode } = useThemeStore();
  const colors = getColors(isDark);

  useEffect(() => {
    useThemeStore.getState().initialize();
  }, []);

  const handleThemeChange = async (newMode: ThemeMode) => {
    await setMode(newMode);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        className="px-4 pt-4 pb-2 border-b"
        style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Settings
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Appearance Section */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            Appearance
          </Text>

          {/* Theme Mode */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-3"
              style={{ color: colors.textSecondary }}
            >
              Theme
            </Text>

            <TouchableOpacity
              onPress={() => handleThemeChange('light')}
              className="flex-row items-center justify-between py-3 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="sunny-outline"
                  size={20}
                  color={mode === 'light' ? colors.primary : colors.textSecondary}
                />
                <Text
                  className="ml-3 text-base"
                  style={{
                    color: mode === 'light' ? colors.primary : colors.text,
                    fontWeight: mode === 'light' ? '600' : '400',
                  }}
                >
                  Light
                </Text>
              </View>
              {mode === 'light' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleThemeChange('dark')}
              className="flex-row items-center justify-between py-3 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="moon-outline"
                  size={20}
                  color={mode === 'dark' ? colors.primary : colors.textSecondary}
                />
                <Text
                  className="ml-3 text-base"
                  style={{
                    color: mode === 'dark' ? colors.primary : colors.text,
                    fontWeight: mode === 'dark' ? '600' : '400',
                  }}
                >
                  Dark
                </Text>
              </View>
              {mode === 'dark' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleThemeChange('system')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={mode === 'system' ? colors.primary : colors.textSecondary}
                />
                <Text
                  className="ml-3 text-base"
                  style={{
                    color: mode === 'system' ? colors.primary : colors.text,
                    fontWeight: mode === 'system' ? '600' : '400',
                  }}
                >
                  System
                </Text>
              </View>
              {mode === 'system' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Current Theme Info */}
          <View
            className="rounded-lg p-3"
            style={{ backgroundColor: colors.surface }}
          >
            <Text
              className="text-xs text-center"
              style={{ color: colors.textSecondary }}
            >
              Current theme: {isDark ? 'Dark' : 'Light'}
              {mode === 'system' && ' (System)'}
            </Text>
          </View>
        </View>

        {/* Other Settings */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            General
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/more/notifications')}
            className="flex-row items-center justify-between py-3 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <Text className="ml-3 text-base" style={{ color: colors.text }}>
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert('About', 'TechLeet Mobile App v1.0.0');
            }}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={20} color={colors.text} />
              <Text className="ml-3 text-base" style={{ color: colors.text }}>
                About
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

