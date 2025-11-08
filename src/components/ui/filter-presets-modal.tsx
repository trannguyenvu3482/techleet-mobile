import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { filterPresetsService, FilterPreset } from '@/services/filter-presets';

interface FilterPresetsModalProps {
  visible: boolean;
  type: 'jobs' | 'candidates' | 'applications' | 'interviews';
  currentFilters: Record<string, unknown>;
  onSelectPreset: (preset: FilterPreset) => void;
  onSavePreset: (name: string, filters: Record<string, unknown>) => void;
  onClose: () => void;
}

export function FilterPresetsModal({
  visible,
  type,
  currentFilters,
  onSelectPreset,
  onSavePreset,
  onClose,
}: FilterPresetsModalProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    if (visible) {
      loadPresets();
    }
  }, [visible, type]);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const data = await filterPresetsService.getPresets(type);
      setPresets(data);
    } catch (error) {
      console.error('Error loading presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      Alert.alert('Error', 'Please enter a preset name');
      return;
    }

    try {
      await filterPresetsService.savePreset({
        name: presetName.trim(),
        type,
        filters: currentFilters,
      });
      setPresetName('');
      setShowSaveModal(false);
      await loadPresets();
      Alert.alert('Success', 'Filter preset saved');
    } catch (error) {
      console.error('Error saving preset:', error);
      Alert.alert('Error', 'Failed to save preset');
    }
  };

  const handleDeletePreset = async (id: string) => {
    Alert.alert(
      'Delete Preset',
      'Are you sure you want to delete this preset?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await filterPresetsService.deletePreset(id);
              await loadPresets();
            } catch (error) {
              console.error('Error deleting preset:', error);
              Alert.alert('Error', 'Failed to delete preset');
            }
          },
        },
      ]
    );
  };

  const handleSelectPreset = (preset: FilterPreset) => {
    onSelectPreset(preset);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Filter Presets</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowSaveModal(true)}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold text-sm">Save Current</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : presets.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="bookmark-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4">No saved presets</Text>
            </View>
          ) : (
            <FlatList
              data={presets}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectPreset(item)}
                  className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 mb-1">
                        {item.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleSelectPreset(item)}
                        className="bg-blue-600 px-3 py-2 rounded-lg"
                      >
                        <Ionicons name="checkmark" size={18} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePreset(item.id)}
                        className="bg-red-100 px-3 py-2 rounded-lg"
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
            />
          )}
        </View>
      </View>

      {/* Save Preset Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-900 mb-4">Save Filter Preset</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 mb-4"
              placeholder="Enter preset name"
              value={presetName}
              onChangeText={setPresetName}
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowSaveModal(false);
                  setPresetName('');
                }}
                className="flex-1 bg-gray-100 px-4 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePreset}
                className="flex-1 bg-blue-600 px-4 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

