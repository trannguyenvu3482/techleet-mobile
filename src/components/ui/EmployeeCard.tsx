import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmployeeResponseDto } from '@/types/employee';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface EmployeeCardProps {
  employee: EmployeeResponseDto;
  onPress: () => void;
  onEdit?: () => void;
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return `${first}${last}`;
}

export function EmployeeCard({ employee, onPress, onEdit }: EmployeeCardProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const initials = getInitials(employee.firstName, employee.lastName);
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const departmentName = employee.department?.departmentName || 'N/A';
  const positionName = employee.position?.positionName || 'N/A';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-lg p-4 mb-3 shadow-sm border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
          <Text className="text-white font-semibold text-lg">{initials}</Text>
        </View>

        {/* Employee Info */}
        <View className="flex-1 min-w-0">
          <Text className="text-base font-semibold" style={{ color: colors.text }} numberOfLines={1}>
            {fullName}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {positionName}
          </Text>
          <Text className="text-xs" style={{ color: colors.textTertiary }} numberOfLines={1}>
            {departmentName}
          </Text>
        </View>

        {/* Status & Actions */}
        <View className="items-end ml-2">
          <View
            className="px-2 py-1 rounded-full mb-2"
            style={{
              backgroundColor: employee.isActive ? colors.successLight : colors.surface,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: employee.isActive ? colors.success : colors.textSecondary,
              }}
            >
              {employee.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} className="mt-1">
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

