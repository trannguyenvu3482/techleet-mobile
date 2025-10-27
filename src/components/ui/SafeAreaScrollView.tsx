import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeAreaScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  className?: string;
}

export function SafeAreaScrollView({ children, className = '', ...props }: SafeAreaScrollViewProps) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-gray-50">
      <ScrollView
        className={`flex-1 ${className}`}
        contentContainerClassName="pb-0"
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

