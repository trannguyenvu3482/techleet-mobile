import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobPostingDto } from '@/types/recruitment';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface JobCardProps {
  job: JobPostingDto;
  onPress: () => void;
  onEdit?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectionMode?: boolean;
}

function formatSalary(min: number, max: number): string {
  if (!min && !max) return 'Negotiable';
  if (!min) return `Up to ${max.toLocaleString()}`;
  if (!max) return `From ${min.toLocaleString()}`;
  return `${min.toLocaleString()} - ${max.toLocaleString()}`;
}

export function JobCard({ job, onPress, onEdit, selected, onSelect, selectionMode }: JobCardProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  const statusLabels = {
    draft: 'Draft',
    published: 'Published',
    closed: 'Closed',
  };

  const getStatusColors = () => {
    if (job.status === 'published') {
      return { bg: colors.successLight, text: colors.success };
    } else if (job.status === 'closed') {
      return { bg: colors.errorLight, text: colors.error };
    } else {
      return { bg: colors.surface, text: colors.textSecondary };
    }
  };

  const statusColors = getStatusColors();

  return (
    <TouchableOpacity
      onPress={selectionMode && onSelect ? onSelect : onPress}
      className="rounded-lg p-4 mb-3 shadow-sm border"
      style={{
        backgroundColor: selected ? colors.primaryLight : colors.card,
        borderColor: selected ? colors.primary : colors.border,
      }}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        {selectionMode && (
          <TouchableOpacity
            onPress={onSelect}
            className="mr-3 mt-1"
          >
            <Ionicons
              name={selected ? 'checkbox' : 'square-outline'}
              size={24}
              color={selected ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        <View className="flex-1 min-w-0">
          <Text className="text-base font-bold" style={{ color: colors.text }} numberOfLines={2}>
            {job.title}
          </Text>
        </View>
        <View
          className="px-2 py-1 rounded-full ml-2"
          style={{ backgroundColor: statusColors.bg }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: statusColors.text }}
          >
            {statusLabels[job.status]}
          </Text>
        </View>
      </View>

      <View className="mb-2">
        <Text className="text-sm" style={{ color: colors.textSecondary }} numberOfLines={2}>
          {job.description}
        </Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
        <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
          {job.employmentType} • {job.experienceLevel}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
          <Text className="text-xs font-semibold ml-1" style={{ color: colors.text }}>
            {formatSalary(job.minSalary, job.maxSalary)}
          </Text>
        </View>

        {onEdit && (
          <TouchableOpacity onPress={onEdit} className="ml-2">
            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

