import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  label = 'Date Range',
  placeholder = 'Select date range',
}: DateRangePickerProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStartDateChange = (event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      onChange({
        ...value,
        startDate: selectedDate,
      });
    }
  };

  const handleEndDateChange = (event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      onChange({
        ...value,
        endDate: selectedDate,
      });
    }
  };

  const clearRange = () => {
    onChange({ startDate: null, endDate: null });
  };

  const applyRange = () => {
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      Alert.alert('Invalid Range', 'Start date must be before end date');
      return;
    }
    setShowModal(false);
  };

  const renderPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900">{label}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Start Date</Text>
                <DateTimePicker
                  value={value.startDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleStartDateChange}
                  maximumDate={value.endDate || undefined}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">End Date</Text>
                <DateTimePicker
                  value={value.endDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleEndDateChange}
                  minimumDate={value.startDate || undefined}
                />
              </View>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={clearRange}
                  className="flex-1 bg-gray-100 px-4 py-3 rounded-lg"
                >
                  <Text className="text-center font-semibold text-gray-700">Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={applyRange}
                  className="flex-1 bg-blue-600 px-4 py-3 rounded-lg"
                >
                  <Text className="text-center font-semibold text-white">Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <>
        {showStartPicker && (
          <DateTimePicker
            value={value.startDate || new Date()}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            maximumDate={value.endDate || undefined}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={value.endDate || new Date()}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={value.startDate || undefined}
          />
        )}
      </>
    );
  };

  return (
    <View>
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS === 'ios') {
            setShowModal(true);
          } else {
            setShowStartPicker(true);
          }
        }}
        className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between bg-white"
      >
        <View className="flex-1">
          {value.startDate && value.endDate ? (
            <Text className="text-gray-900">
              {formatDate(value.startDate)} - {formatDate(value.endDate)}
            </Text>
          ) : value.startDate ? (
            <Text className="text-gray-900">From {formatDate(value.startDate)}</Text>
          ) : value.endDate ? (
            <Text className="text-gray-900">Until {formatDate(value.endDate)}</Text>
          ) : (
            <Text className="text-gray-400">{placeholder}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          {(value.startDate || value.endDate) && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                clearRange();
              }}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
        </View>
      </TouchableOpacity>

      {Platform.OS === 'android' && (
        <View className="flex-row gap-2 mt-2">
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <Text className="text-xs text-gray-600 mb-1">Start</Text>
            <Text className="text-sm text-gray-900">
              {value.startDate ? formatDate(value.startDate) : 'Select'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <Text className="text-xs text-gray-600 mb-1">End</Text>
            <Text className="text-sm text-gray-900">
              {value.endDate ? formatDate(value.endDate) : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {renderPicker()}
    </View>
  );
}

