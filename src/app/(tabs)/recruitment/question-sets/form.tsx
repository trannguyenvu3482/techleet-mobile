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
import { recruitmentAPI, QuestionSet, CreateQuestionSetRequest, UpdateQuestionSetRequest } from '@/services/api/recruitment';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function QuestionSetFormScreen() {
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
      Alert.alert(tCommon('error'), t('failedToLoadQuestionSetData'));
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
      Alert.alert(t('validationError'), t('titleRequired'));
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
        Alert.alert(tCommon('success'), t('questionSetUpdatedSuccess'), [
          { text: tCommon('ok'), onPress: () => router.back() },
        ]);
      } else {
        const createData: CreateQuestionSetRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        };
        await recruitmentAPI.createQuestionSet(createData);
        Alert.alert(tCommon('success'), t('questionSetCreatedSuccess'), [
          { text: tCommon('ok'), onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error saving question set:', error);
      Alert.alert(tCommon('error'), t('failedToSaveQuestionSet'));
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
            {isEdit ? t('editQuestionSet') : t('createQuestionSet')}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
          {/* Title Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              {t('title')} <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              placeholder={t('enterQuestionSetTitle')}
              placeholderTextColor={colors.textTertiary}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              className="p-3 rounded-lg border text-base"
              style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
            />
          </View>

          {/* Description Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              {t('description')}
            </Text>
            <TextInput
              placeholder={t('enterDescriptionOptional')}
              placeholderTextColor={colors.textTertiary}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              className="p-3 rounded-lg border text-base"
              style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
              textAlignVertical="top"
            />
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
                {isEdit ? t('updateQuestionSet') : t('createQuestionSet')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

