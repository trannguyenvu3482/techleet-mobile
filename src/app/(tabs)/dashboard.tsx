import React from 'react';
import { View, Text } from 'react-native';
import { useProtectedRoute } from '@/hooks';
import { SafeAreaScrollView } from '@/components/ui';

export default function Dashboard() {
  useProtectedRoute();

  return (
    <SafeAreaScrollView>
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Dashboard</Text>
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800">Welcome to TechLeet Admin</Text>
          <Text className="text-gray-600 mt-2">Dashboard features coming soon...</Text>
        </View>
      </View>
    </SafeAreaScrollView>
  );
}

