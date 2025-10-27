import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmployeeResponseDto } from '@/types/employee';

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
  const initials = getInitials(employee.firstName, employee.lastName);
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const departmentName = employee.department?.departmentName || 'N/A';
  const positionName = employee.position?.positionName || 'N/A';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center mr-3">
          <Text className="text-white font-semibold text-lg">{initials}</Text>
        </View>

        {/* Employee Info */}
        <View className="flex-1 min-w-0">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {fullName}
          </Text>
          <Text className="text-sm text-gray-500 mb-1" numberOfLines={1}>
            {positionName}
          </Text>
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {departmentName}
          </Text>
        </View>

        {/* Status & Actions */}
        <View className="items-end ml-2">
          <View
            className={`px-2 py-1 rounded-full mb-2 ${
              employee.isActive ? 'bg-green-100' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                employee.isActive ? 'text-green-700' : 'text-gray-600'
              }`}
            >
              {employee.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} className="mt-1">
              <Ionicons name="create-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

