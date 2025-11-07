import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { recruitmentAPI } from '@/services/api/recruitment';

interface ApproveOfferModalProps {
  visible: boolean;
  onClose: () => void;
  applicationId: number;
  onSuccess: () => void;
}

export function ApproveOfferModal({
  visible,
  onClose,
  applicationId,
  onSuccess,
}: ApproveOfferModalProps) {
  const [loading, setLoading] = useState(false);
  const [offeredSalary, setOfferedSalary] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!offeredSalary.trim()) {
      Alert.alert('Validation Error', 'Please enter offered salary');
      return;
    }

    const salary = parseFloat(offeredSalary);
    if (isNaN(salary) || salary <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid salary');
      return;
    }

    if (expectedStartDate <= new Date()) {
      Alert.alert('Validation Error', 'Expected start date must be in the future');
      return;
    }

    try {
      setLoading(true);
      await recruitmentAPI.approveApplicationAfterInterview(applicationId, {
        offeredSalary: salary,
        expectedStartDate: expectedStartDate.toISOString().split('T')[0],
      });
      Alert.alert('Success', 'Application approved and offer sent');
      onSuccess();
      onClose();
      // Reset form
      setOfferedSalary('');
      setExpectedStartDate(new Date());
    } catch (error: any) {
      console.error('Error approving application:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to approve application';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpectedStartDate(selectedDate);
    }
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
            <Text className="text-xl font-bold text-gray-900">Approve & Make Offer</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Offered Salary (VND) *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Enter salary amount"
                placeholderTextColor="#9ca3af"
                value={offeredSalary}
                onChangeText={setOfferedSalary}
                keyboardType="numeric"
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Expected Start Date *
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-gray-900">
                  {expectedStartDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expectedStartDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-gray-100 px-6 py-3 rounded-lg"
                disabled={loading}
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="flex-1 bg-blue-600 px-6 py-3 rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

