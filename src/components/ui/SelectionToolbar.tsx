import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkShare?: () => void;
  onBulkStatusUpdate?: () => void;
  onCancel: () => void;
}

export function SelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkExport,
  onBulkShare,
  onBulkStatusUpdate,
  onCancel,
}: SelectionToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <View className="bg-blue-600 px-4 py-3 flex-row items-center justify-between border-b border-blue-700">
      <View className="flex-row items-center flex-1">
        <TouchableOpacity
          onPress={allSelected ? onDeselectAll : onSelectAll}
          className="mr-3"
        >
          <Ionicons
            name={allSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text className="text-white font-semibold">
          {selectedCount} selected
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {onBulkStatusUpdate && (
          <TouchableOpacity
            onPress={onBulkStatusUpdate}
            className="bg-white/20 px-3 py-2 rounded-lg"
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          </TouchableOpacity>
        )}
        {onBulkExport && (
          <TouchableOpacity
            onPress={onBulkExport}
            className="bg-white/20 px-3 py-2 rounded-lg"
          >
            <Ionicons name="download-outline" size={20} color="white" />
          </TouchableOpacity>
        )}
        {onBulkShare && (
          <TouchableOpacity
            onPress={onBulkShare}
            className="bg-white/20 px-3 py-2 rounded-lg"
          >
            <Ionicons name="share-outline" size={20} color="white" />
          </TouchableOpacity>
        )}
        {onBulkDelete && (
          <TouchableOpacity
            onPress={onBulkDelete}
            className="bg-red-500 px-3 py-2 rounded-lg"
          >
            <Ionicons name="trash-outline" size={20} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onCancel}
          className="bg-white/20 px-3 py-2 rounded-lg"
        >
          <Ionicons name="close-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

