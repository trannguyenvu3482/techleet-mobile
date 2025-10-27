import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function StatCard({ title, value, subtitle, icon, iconColor = '#6b7280' }: StatCardProps) {
  return (
    <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-gray-600">{title}</Text>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      {subtitle && (
        <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
      )}
    </View>
  );
}

