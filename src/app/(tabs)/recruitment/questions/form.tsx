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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { recruitmentAPI, Question, CreateQuestionRequest, UpdateQuestionRequest } from '@/services/api/recruitment';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function QuestionFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    content: '',
    sampleAnswer: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (params.id) {
        const response = await recruitmentAPI.getQuestions({ limit: 100 });
        const foundQuestion = response.data.find(
          (q) => q.questionId === Number(params.id)
        );
        if (foundQuestion) {
          setQuestion(foundQuestion);
          setFormData({
            content: foundQuestion.content || '',
            sampleAnswer: foundQuestion.sampleAnswer || '',
            difficulty: foundQuestion.difficulty || 'medium',
          });
        } else {
          Alert.alert('Error', 'Question not found');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load question data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.content.trim()) {
      Alert.alert('Validation Error', 'Question content is required');
      return false;
    }
    if (!formData.sampleAnswer.trim()) {
      Alert.alert('Validation Error', 'Sample answer is required');
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
        const updateData: UpdateQuestionRequest = {
          content: formData.content.trim(),
          sampleAnswer: formData.sampleAnswer.trim(),
          difficulty: formData.difficulty,
        };
        await recruitmentAPI.updateQuestion(Number(params.id), updateData);
        Alert.alert('Success', 'Question updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const createData: CreateQuestionRequest = {
          content: formData.content.trim(),
          sampleAnswer: formData.sampleAnswer.trim(),
          difficulty: formData.difficulty,
        };
        await recruitmentAPI.createQuestion(createData);
        Alert.alert('Success', 'Question created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      Alert.alert('Error', 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Question' : 'Create Question'}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Content Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Question Content <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              placeholder="Enter question content..."
              value={formData.content}
              onChangeText={(value) => handleInputChange('content', value)}
              multiline
              numberOfLines={4}
              className="bg-white p-3 rounded-lg border border-gray-300 text-base"
              textAlignVertical="top"
            />
          </View>

          {/* Sample Answer Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Sample Answer <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              placeholder="Enter sample answer..."
              value={formData.sampleAnswer}
              onChangeText={(value) => handleInputChange('sampleAnswer', value)}
              multiline
              numberOfLines={6}
              className="bg-white p-3 rounded-lg border border-gray-300 text-base"
              textAlignVertical="top"
            />
          </View>

          {/* Difficulty Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Difficulty <Text className="text-red-500">*</Text>
            </Text>
            <View className="bg-white rounded-lg border border-gray-300">
              <Picker
                selectedValue={formData.difficulty}
                onValueChange={(value) => handleInputChange('difficulty', value)}
                style={{ height: 50 }}
              >
                {DIFFICULTIES.map((diff) => (
                  <Picker.Item
                    key={diff}
                    label={diff.charAt(0).toUpperCase() + diff.slice(1)}
                    value={diff}
                  />
                ))}
              </Picker>
            </View>
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
                {isEdit ? 'Update Question' : 'Create Question'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

