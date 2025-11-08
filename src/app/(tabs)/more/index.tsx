import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '@/hooks';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth-store';
import { SafeAreaScrollView } from '@/components/ui';

export default function More() {
  useProtectedRoute();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <SafeAreaScrollView>
      <View className="p-6" style={{ backgroundColor: colors.background }}>
        <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>More</Text>

        {user && (
          <View className="rounded-lg p-4 mb-6 shadow-sm" style={{ backgroundColor: colors.card }}>
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>{user.fullName}</Text>
            <Text style={{ color: colors.textSecondary }}>{user.email}</Text>
          </View>
        )}

        <View className="rounded-lg shadow-sm mb-4" style={{ backgroundColor: colors.card }}>
          <TouchableOpacity
            onPress={() => router.push('/more/notifications')}
            className="flex-row items-center p-4 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <Text className="ml-4 flex-1" style={{ color: colors.text }}>Notifications</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center p-4 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.text} />
            <Text className="ml-4 flex-1" style={{ color: colors.text }}>Documents</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center p-4 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <Ionicons name="business-outline" size={24} color={colors.text} />
            <Text className="ml-4 flex-1" style={{ color: colors.text }}>Company</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/more/settings')}
            className="flex-row items-center p-4"
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
            <Text className="ml-4 flex-1" style={{ color: colors.text }}>Settings</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="rounded-lg p-4 shadow-sm flex-row items-center"
          style={{ backgroundColor: colors.card }}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text className="ml-4 font-semibold" style={{ color: colors.error }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaScrollView>
  );
}

