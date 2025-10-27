import React from 'react';
import { View, Text } from 'react-native';
import { useProtectedRoute } from '@/hooks';
import { SafeAreaScrollView } from '@/components/ui';

export default function Recruitment() {
  useProtectedRoute();

  return (
    <SafeAreaScrollView>
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Recruitment</Text>
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800">Recruitment Module</Text>
          <Text className="text-gray-600 mt-2">Jobs, Candidates, and Applications coming soon...</Text>
        </View>
      </View>
    </SafeAreaScrollView>
  );
}

