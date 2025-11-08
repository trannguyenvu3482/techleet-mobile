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
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { recruitmentAPI, Question, CreateQuestionRequest, UpdateQuestionRequest } from '@/services/api/recruitment';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function QuestionFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
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
          Alert.alert(tCommon('error'), t('questionNotFound'));
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(tCommon('error'), t('failedToLoadQuestionData'));
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
      Alert.alert(t('validationError'), t('questionContentRequired'));
      return false;
    }
    if (!formData.sampleAnswer.trim()) {
      Alert.alert(t('validationError'), t('sampleAnswerRequired'));
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
        Alert.alert(tCommon('success'), t('questionUpdatedSuccess'), [
          { text: tCommon('ok'), onPress: () => router.back() },
        ]);
      } else {
        const createData: CreateQuestionRequest = {
          content: formData.content.trim(),
          sampleAnswer: formData.sampleAnswer.trim(),
          difficulty: formData.difficulty,
        };
        await recruitmentAPI.createQuestion(createData);
        Alert.alert(tCommon('success'), t('questionCreatedSuccess'), [
          { text: tCommon('ok'), onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      Alert.alert(tCommon('error'), t('failedToSaveQuestion'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b flex-row items-center" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {isEdit ? t('editQuestion') : t('createQuestion')}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
          {/* Content Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              {t('questionContent')} <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              placeholder={t('enterQuestionContent')}
              placeholderTextColor={colors.textTertiary}
              value={formData.content}
              onChangeText={(value) => handleInputChange('content', value)}
              multiline
              numberOfLines={4}
              className="p-3 rounded-lg border text-base"
              style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
              textAlignVertical="top"
            />
          </View>

          {/* Sample Answer Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              {t('sampleAnswer')} <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              placeholder={t('enterSampleAnswer')}
              placeholderTextColor={colors.textTertiary}
              value={formData.sampleAnswer}
              onChangeText={(value) => handleInputChange('sampleAnswer', value)}
              multiline
              numberOfLines={6}
              className="p-3 rounded-lg border text-base"
              style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
              textAlignVertical="top"
            />
          </View>

          {/* Difficulty Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              {t('difficulty')} <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View className="rounded-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Picker
                selectedValue={formData.difficulty}
                onValueChange={(value) => handleInputChange('difficulty', value)}
                style={{ height: 50, color: colors.text }}
              >
                {DIFFICULTIES.map((diff) => (
                  <Picker.Item
                    key={diff}
                    label={t(diff)}
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
            className="px-6 py-4 rounded-lg items-center mt-4"
            style={{
              backgroundColor: colors.primary,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {isEdit ? t('updateQuestion') : t('createQuestion')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

