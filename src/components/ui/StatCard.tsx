import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function StatCard({ title, value, subtitle, icon, iconColor }: StatCardProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const defaultIconColor = iconColor || colors.primary;

  return (
    <View 
      className="rounded-lg p-4 shadow-sm mb-4"
      style={{ backgroundColor: colors.card }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>{title}</Text>
        <Ionicons name={icon} size={20} color={defaultIconColor} />
      </View>
      <Text className="text-2xl font-bold" style={{ color: colors.text }}>{value}</Text>
      {subtitle && (
        <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>{subtitle}</Text>
      )}
    </View>
  );
}

