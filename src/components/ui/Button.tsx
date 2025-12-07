import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  const getBackgroundColor = (): string => {
    if (disabled || loading) {
      return colors.textTertiary;
    }
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (variant === 'outline') {
      return colors.primary;
    }
    return 'white';
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return colors.primary;
    }
    return 'transparent';
  };

  const getIndicatorColor = (): string => {
    if (variant === 'outline') {
      return colors.primary;
    }
    return 'white';
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          opacity: disabled || loading ? 0.5 : 1,
        },
      ]}
      className={className}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={getIndicatorColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

