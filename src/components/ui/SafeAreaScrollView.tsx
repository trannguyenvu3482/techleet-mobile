import React from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface SafeAreaScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  className?: string;
}

export function SafeAreaScrollView({ children, className = '', ...props }: SafeAreaScrollViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View 
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      <ScrollView
        className={`flex-1 ${className}`}
        contentContainerClassName="pb-0"
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colors.background }}
        {...props}
      >
        {children}
      </ScrollView>
    </View>
  );
}

