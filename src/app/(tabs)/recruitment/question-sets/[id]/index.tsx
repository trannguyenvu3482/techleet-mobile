import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, QuestionSet, Question, QuestionSetItem } from '@/services/api/recruitment';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function QuestionSetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  const questionSetId = params.id && params.id !== 'index' && params.id.trim() !== ''
    ? Number(params.id)
    : null;

  const isValidId = questionSetId !== null && !isNaN(questionSetId) && questionSetId > 0;

  const fetchQuestionSet = useCallback(async () => {
    if (!isValidId || !questionSetId) {
      Alert.alert(tCommon('error'), t('invalidQuestionSetId'));
      router.back();
      return;
    }

    try {
      setLoading(true);
      // Use getQuestionSetById which handles pagination internally
      const foundSet = await recruitmentAPI.getQuestionSetById(questionSetId);
      setQuestionSet(foundSet);
    } catch (error) {
      console.error('Error fetching question set:', error);
      const errorMessage = error instanceof Error ? error.message : t('failedToLoadQuestionSet');
      Alert.alert(tCommon('error'), errorMessage);
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [questionSetId, isValidId, router, t, tCommon]);

  useEffect(() => {
    if (isValidId) {
      fetchQuestionSet();
    } else if (params.id && params.id !== 'index') {
      Alert.alert(tCommon('error'), t('invalidQuestionSetId'));
      router.back();
    }
  }, [isValidId, params.id, fetchQuestionSet, router]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestionSet();
  };

  const fetchAvailableQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const response = await recruitmentAPI.getQuestions({ limit: 100 });
      const currentQuestionIds = questionSet?.questionSetItems?.map(
        (item) => item.question.questionId
      ) || [];
      const filtered = response.data.filter(
        (q) => !currentQuestionIds.includes(q.questionId)
      );
      setAvailableQuestions(filtered);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert(tCommon('error'), t('failedToLoadAvailableQuestions'));
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setSearchTerm('');
    setSelectedQuestionIds([]);
    fetchAvailableQuestions();
  };

  const handleToggleQuestionSelect = (questionId: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleAddQuestions = async () => {
    if (!questionSet || selectedQuestionIds.length === 0) {
      Alert.alert(tCommon('error'), t('pleaseSelectAtLeastOneQuestion'));
      return;
    }

    try {
      for (const questionId of selectedQuestionIds) {
        await recruitmentAPI.addQuestionToSet(questionSet.setId, questionId);
      }
      Alert.alert(tCommon('success'), t('addedQuestionsToSet', { count: selectedQuestionIds.length }));
      setShowAddModal(false);
      setSelectedQuestionIds([]);
      fetchQuestionSet();
    } catch (error) {
      console.error('Error adding questions:', error);
      Alert.alert(tCommon('error'), t('failedToAddQuestionsToSet'));
    }
  };

  const handleRemoveQuestion = (item: QuestionSetItem) => {
    Alert.alert(
      t('removeQuestion'),
      t('removeQuestionConfirm'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: tCommon('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await recruitmentAPI.removeQuestionFromSet(item.setItemId);
              Alert.alert(tCommon('success'), t('questionRemovedFromSet'));
              fetchQuestionSet();
            } catch (error) {
              console.error('Error removing question:', error);
              Alert.alert(tCommon('error'), t('failedToRemoveQuestionFromSet'));
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return colors.textSecondary;
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const filteredAvailableQuestions = availableQuestions.filter((q) =>
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderQuestionItem = ({ item }: { item: QuestionSetItem }) => (
    <View className="p-4 mb-3 rounded-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold mb-1" style={{ color: colors.text }} numberOfLines={2}>
            {item.question.content}
          </Text>
          <View className="flex-row items-center mt-2">
            <View
              className="px-2 py-1 rounded border"
              style={{ backgroundColor: `${getDifficultyColor(item.question.difficulty)}20`, borderColor: getDifficultyColor(item.question.difficulty) }}
            >
              <Text className="text-xs font-medium capitalize" style={{ color: getDifficultyColor(item.question.difficulty) }}>
                {item.question.difficulty}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveQuestion(item)}
          className="p-2"
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      {item.question.sampleAnswer && (
        <View className="mt-2 pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t('sampleAnswer')}:</Text>
          <Text className="text-sm" style={{ color: colors.text }} numberOfLines={2}>
            {item.question.sampleAnswer}
          </Text>
        </View>
      )}
    </View>
  );

  if (!isValidId) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!questionSet) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center">
          <Text style={{ color: colors.textSecondary }}>{t('questionSetNotFound')}</Text>
        </View>
      </View>
    );
  }

  const questions = questionSet.questionSetItems || [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b flex-row items-center justify-between" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {questionSet.title}
              </Text>
              {questionSet.description && (
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  {questionSet.description}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/recruitment/question-sets/form?id=${questionSet.setId}`)}
            className="p-2"
          >
            <Ionicons name="pencil-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* Actions */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {questions.length} {questions.length !== 1 ? t('questions') : t('question')}
            </Text>
            <TouchableOpacity
              onPress={handleOpenAddModal}
              className="px-4 py-2 rounded-lg flex-row items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">{t('addQuestions')}</Text>
            </TouchableOpacity>
          </View>

          {/* Questions List */}
          {questions.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="help-circle-outline" size={64} color={colors.textTertiary} />
              <Text className="text-center mt-4" style={{ color: colors.textSecondary }}>
                {t('noQuestionsInSet')}
              </Text>
              <TouchableOpacity
                onPress={handleOpenAddModal}
                className="mt-4 px-6 py-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold">{t('addQuestions')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={questions}
              renderItem={renderQuestionItem}
              keyExtractor={(item) => item.setItemId.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              contentContainerStyle={{ paddingBottom: 20 }}
              style={{ backgroundColor: colors.background }}
            />
          )}
        </View>

        {/* Add Questions Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
            <View className="flex-1">
              {/* Modal Header */}
              <View className="px-4 py-3 border-b flex-row items-center justify-between" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  {t('addQuestions')}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View className="px-4 pt-4">
                <View className="relative">
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={colors.textSecondary}
                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                  />
                  <TextInput
                    placeholder={t('searchQuestions')}
                    placeholderTextColor={colors.textTertiary}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    className="pl-10 pr-4 py-3 rounded-lg border"
                    style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                  />
                </View>
              </View>

              {/* Questions List */}
              {loadingQuestions ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : filteredAvailableQuestions.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Text style={{ color: colors.textSecondary }}>{t('noAvailableQuestions')}</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredAvailableQuestions}
                  keyExtractor={(item) => item.questionId.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  style={{ backgroundColor: colors.background }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleToggleQuestionSelect(item.questionId)}
                      className="p-4 mb-3 rounded-lg border"
                      style={{
                        backgroundColor: selectedQuestionIds.includes(item.questionId) ? colors.primaryLight : colors.card,
                        borderColor: selectedQuestionIds.includes(item.questionId) ? colors.primary : colors.border,
                      }}
                    >
                      <View className="flex-row items-start">
                        <View className="mr-3 mt-1">
                          <Ionicons
                            name={
                              selectedQuestionIds.includes(item.questionId)
                                ? 'checkbox'
                                : 'square-outline'
                            }
                            size={24}
                            color={
                              selectedQuestionIds.includes(item.questionId)
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold mb-1" style={{ color: colors.text }} numberOfLines={2}>
                            {item.content}
                          </Text>
                          <View
                            className="px-2 py-1 rounded border self-start"
                            style={{ backgroundColor: `${getDifficultyColor(item.difficulty)}20`, borderColor: getDifficultyColor(item.difficulty) }}
                          >
                            <Text className="text-xs font-medium capitalize" style={{ color: getDifficultyColor(item.difficulty) }}>
                              {item.difficulty}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Modal Footer */}
              <View className="px-4 py-3 border-t flex-row justify-end" style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="px-4 py-2 mr-2"
                >
                  <Text className="font-semibold" style={{ color: colors.text }}>{tCommon('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddQuestions}
                  disabled={selectedQuestionIds.length === 0}
                  className="px-6 py-2 rounded-lg"
                  style={{
                    backgroundColor: colors.primary,
                    opacity: selectedQuestionIds.length === 0 ? 0.5 : 1,
                  }}
                >
                  <Text className="text-white font-semibold">
                    {tCommon('add')} ({selectedQuestionIds.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

