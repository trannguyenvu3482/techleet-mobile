import React from 'react';
import { View, ViewProps, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View
      className={`rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: colors.card,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <View className={`mb-2 ${className}`}>{children}</View>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <Text
      className={`text-lg font-semibold ${className}`}
      style={{ color: colors.text }}
    >
      {children}
    </Text>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <Text
      className={`text-sm ${className}`}
      style={{ color: colors.textSecondary }}
    >
      {children}
    </Text>
  );
}

