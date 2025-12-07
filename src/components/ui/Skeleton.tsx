import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  className = '' 
}: SkeletonProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
      ] as any}
      className={className}
    />
  );
}

export function SkeletonText({ 
  lines = 1, 
  width = '100%',
  className = '' 
}: { 
  lines?: number; 
  width?: number | string;
  className?: string;
}) {
  return (
    <View className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? width : '100%'}
          height={16}
          className={index < lines - 1 ? 'mb-2' : ''}
        />
      ))}
    </View>
  );
}

export function JobCardSkeleton() {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View
      className="rounded-lg p-4 mb-4 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-2">
          <Skeleton width="80%" height={20} className="mb-2" />
          <Skeleton width="60%" height={16} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <SkeletonText lines={2} width="90%" className="mb-3" />
      <View className="flex-row gap-2">
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={100} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function CandidateCardSkeleton() {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View
      className="rounded-lg p-4 mb-4 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-center mb-3">
        <Skeleton width={48} height={48} borderRadius={24} className="mr-3" />
        <View className="flex-1">
          <Skeleton width="70%" height={18} className="mb-2" />
          <Skeleton width="50%" height={16} />
        </View>
      </View>
      <SkeletonText lines={2} width="85%" className="mb-3" />
      <View className="flex-row gap-2">
        <Skeleton width={100} height={24} borderRadius={12} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function ApplicationCardSkeleton() {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View
      className="rounded-lg p-4 mb-4 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Skeleton width="75%" height={18} className="mb-2" />
          <Skeleton width="60%" height={16} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>
      <SkeletonText lines={1} width="90%" className="mb-3" />
      <View className="flex-row items-center justify-between">
        <Skeleton width={100} height={20} />
        <Skeleton width={80} height={20} />
      </View>
    </View>
  );
}

export function InterviewCardSkeleton() {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View
      className="rounded-lg p-4 mb-4 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-3">
          <Skeleton width="40%" height={20} className="mb-2" />
          <Skeleton width="60%" height={16} className="mb-2" />
          <Skeleton width="50%" height={16} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <View className="flex-row items-center justify-between mt-2 pt-2 border-t" style={{ borderTopColor: colors.border }}>
        <Skeleton width={100} height={16} />
        <Skeleton width={24} height={24} borderRadius={4} />
      </View>
    </View>
  );
}

