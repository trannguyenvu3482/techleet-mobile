import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = 'document-outline',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View className={`items-center justify-center py-12 px-4 ${className}`}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
      <Text
        className="text-lg font-semibold mt-4 text-center"
        style={{ color: colors.textSecondary }}
      >
        {title}
      </Text>
      {description && (
        <Text
          className="mt-2 text-center px-4"
          style={{ color: colors.textTertiary }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-6 px-6 py-3 rounded-lg"
          style={{
            backgroundColor: colors.primary,
            minHeight: 44,
            minWidth: 120,
          }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="text-white font-semibold text-center">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

