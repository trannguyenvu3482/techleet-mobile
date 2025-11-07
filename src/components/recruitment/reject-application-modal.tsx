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
import { recruitmentAPI } from '@/services/api/recruitment';

interface RejectApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  applicationId: number;
  onSuccess: () => void;
}

export function RejectApplicationModal({
  visible,
  onClose,
  applicationId,
  onSuccess,
}: RejectApplicationModalProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await recruitmentAPI.rejectApplicationAfterInterview(applicationId, {
        rejectionReason: rejectionReason.trim() || undefined,
      });
      Alert.alert('Success', 'Application rejected and email sent');
      onSuccess();
      onClose();
      // Reset form
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to reject application';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
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
            <Text className="text-xl font-bold text-gray-900">Reject Application</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Rejection Reason (Optional)
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-24"
                placeholder="Enter rejection reason..."
                placeholderTextColor="#9ca3af"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                textAlignVertical="top"
              />
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
                className="flex-1 bg-red-600 px-6 py-3 rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

