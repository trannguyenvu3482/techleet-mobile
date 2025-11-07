import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentAPI, QuestionSet, CreateQuestionSetRequest, UpdateQuestionSetRequest } from '@/services/api/recruitment';

export default function QuestionSetFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (params.id) {
        const questionSetData = await recruitmentAPI.getQuestionSetById(Number(params.id));
        setQuestionSet(questionSetData);
        setFormData({
          title: questionSetData.title || '',
          description: questionSetData.description || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load question set data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (isEdit && params.id) {
        const updateData: UpdateQuestionSetRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        };
        await recruitmentAPI.updateQuestionSet(Number(params.id), updateData);
        Alert.alert('Success', 'Question set updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const createData: CreateQuestionSetRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        };
        await recruitmentAPI.createQuestionSet(createData);
        Alert.alert('Success', 'Question set created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error saving question set:', error);
      Alert.alert('Error', 'Failed to save question set');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Question Set' : 'Create Question Set'}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Title Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Title <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              placeholder="Enter question set title..."
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              className="bg-white p-3 rounded-lg border border-gray-300 text-base"
            />
          </View>

          {/* Description Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Description
            </Text>
            <TextInput
              placeholder="Enter description (optional)..."
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              className="bg-white p-3 rounded-lg border border-gray-300 text-base"
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            className={`bg-blue-600 px-6 py-4 rounded-lg items-center mt-4 ${
              saving ? 'opacity-50' : ''
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {isEdit ? 'Update Question Set' : 'Create Question Set'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

