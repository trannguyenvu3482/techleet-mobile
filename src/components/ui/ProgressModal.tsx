import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProgressModalProps {
  visible: boolean;
  title: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
    currentItem?: string;
  };
  onCancel?: () => void;
}

export function ProgressModal({
  visible,
  title,
  progress,
  onCancel,
}: ProgressModalProps) {
  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        <View className="bg-white rounded-lg p-6 w-full max-w-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">{title}</Text>
          
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600">
                {progress.completed} of {progress.total} completed
              </Text>
              <Text className="text-sm font-semibold text-gray-900">
                {percentage}%
              </Text>
            </View>
            
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </View>
          </View>

          {progress.failed > 0 && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-sm text-red-600 ml-2">
                {progress.failed} failed
              </Text>
            </View>
          )}

          {progress.currentItem && (
            <Text className="text-xs text-gray-500 mt-2" numberOfLines={1}>
              Processing: {progress.currentItem}
            </Text>
          )}

          <View className="flex-row items-center justify-center mt-4">
            <ActivityIndicator size="small" color="#2563eb" />
            <Text className="text-sm text-gray-600 ml-2">Please wait...</Text>
          </View>

          {onCancel && (
            <View className="mt-4 pt-4 border-t border-gray-200">
              <Text
                onPress={onCancel}
                className="text-center text-sm text-red-600 font-semibold"
              >
                Cancel
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

