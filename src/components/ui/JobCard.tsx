import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobPostingDto } from '@/types/recruitment';

interface JobCardProps {
  job: JobPostingDto;
  onPress: () => void;
  onEdit?: () => void;
}

function formatSalary(min: number, max: number): string {
  if (!min && !max) return 'Negotiable';
  if (!min) return `Up to ${max.toLocaleString()}`;
  if (!max) return `From ${min.toLocaleString()}`;
  return `${min.toLocaleString()} - ${max.toLocaleString()}`;
}

export function JobCard({ job, onPress, onEdit }: JobCardProps) {
  const statusColors = {
    draft: '#6b7280',
    published: '#10b981',
    closed: '#ef4444',
  };

  const statusLabels = {
    draft: 'Draft',
    published: 'Published',
    closed: 'Closed',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 min-w-0">
          <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
            {job.title}
          </Text>
        </View>
        <View
          className={`px-2 py-1 rounded-full ml-2 ${
            job.status === 'published'
              ? 'bg-green-100'
              : job.status === 'closed'
              ? 'bg-red-100'
              : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              job.status === 'published'
                ? 'text-green-700'
                : job.status === 'closed'
                ? 'text-red-700'
                : 'text-gray-600'
            }`}
          >
            {statusLabels[job.status]}
          </Text>
        </View>
      </View>

      <View className="mb-2">
        <Text className="text-sm text-gray-600" numberOfLines={2}>
          {job.description}
        </Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Ionicons name="briefcase-outline" size={16} color="#6b7280" />
        <Text className="text-xs text-gray-600 ml-1">
          {job.employmentType} • {job.experienceLevel}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={16} color="#6b7280" />
          <Text className="text-xs font-semibold text-gray-700 ml-1">
            {formatSalary(job.minSalary, job.maxSalary)}
          </Text>
        </View>

        {onEdit && (
          <TouchableOpacity onPress={onEdit} className="ml-2">
            <Ionicons name="create-outline" size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

