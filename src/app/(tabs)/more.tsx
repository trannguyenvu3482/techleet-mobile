import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProtectedRoute } from '@/hooks';
import { useAuthStore } from '@/store/auth-store';
import { SafeAreaScrollView } from '@/components/ui';

export default function More() {
  useProtectedRoute();
  const { user, logout } = useAuthStore();

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
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">More</Text>

        {user && (
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800">{user.fullName}</Text>
            <Text className="text-gray-600">{user.email}</Text>
          </View>
        )}

        <View className="bg-white rounded-lg shadow-sm mb-4">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-200">
            <Ionicons name="document-text-outline" size={24} color="#6b7280" />
            <Text className="text-gray-800 ml-4 flex-1">Documents</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-200">
            <Ionicons name="business-outline" size={24} color="#6b7280" />
            <Text className="text-gray-800 ml-4 flex-1">Company</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
            <Text className="text-gray-800 ml-4 flex-1">Settings</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white rounded-lg p-4 shadow-sm flex-row items-center"
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text className="text-red-500 ml-4 font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaScrollView>
  );
}

