import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { recruitmentAPI, Question } from '@/services/api/recruitment';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function QuestionsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchQuestions = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const params: any = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'DESC' as const,
      };

      if (searchTerm.trim()) {
        params.text = searchTerm.trim();
      }

      if (difficultyFilter !== 'all') {
        params.difficulty = difficultyFilter;
      }

      const response = await recruitmentAPI.getQuestions(params);
      if (append) {
        setQuestions((prev) => [...prev, ...response.data]);
      } else {
        setQuestions(response.data);
      }
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert(tCommon('error'), t('failedToLoadQuestions'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchTerm, difficultyFilter]);

  useEffect(() => {
    if (page === 0) {
      fetchQuestions(false);
    } else {
      fetchQuestions(true);
    }
  }, [page, searchTerm, difficultyFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchQuestions(false);
  };

  const handleLoadMore = () => {
    if (questions.length < total && !loading) {
      setPage((prev) => prev + 1);
      fetchQuestions(true);
    }
  };

  const handleQuestionPress = (question: Question) => {
    router.push(`/recruitment/questions/form?id=${question.questionId}`);
  };

  const handleCreateQuestion = () => {
    router.push('/recruitment/questions/form');
  };

  const handleDeleteQuestion = (question: Question) => {
    Alert.alert(
      'Delete Question',
      `Are you sure you want to delete this question?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recruitmentAPI.deleteQuestion(question.questionId);
              Alert.alert('Success', 'Question deleted successfully');
              fetchQuestions();
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('Error', 'Failed to delete question');
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { bg: colors.successLight, text: colors.success, border: colors.success };
      case 'medium':
        return { bg: colors.warningLight, text: colors.warning, border: colors.warning };
      case 'hard':
        return { bg: colors.errorLight, text: colors.error, border: colors.error };
      default:
        return { bg: colors.surface, text: colors.textSecondary, border: colors.border };
    }
  };

  const renderQuestionItem = ({ item }: { item: Question }) => {
    const difficultyColors = getDifficultyColor(item.difficulty);
    return (
      <TouchableOpacity
        onPress={() => handleQuestionPress(item)}
        className="p-4 mb-3 rounded-lg border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-base font-semibold mb-1" style={{ color: colors.text }} numberOfLines={2}>
              {item.content}
            </Text>
            <View className="flex-row items-center mt-2">
              <View className="px-2 py-1 rounded border" style={{ backgroundColor: difficultyColors.bg, borderColor: difficultyColors.border }}>
                <Text className="text-xs font-medium capitalize" style={{ color: difficultyColors.text }}>{item.difficulty}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteQuestion(item)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        {item.sampleAnswer && (
          <View className="mt-2 pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
            <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Sample Answer:</Text>
            <Text className="text-sm" style={{ color: colors.text }} numberOfLines={2}>
              {item.sampleAnswer}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>{t('questions')}</Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {total} {total !== 1 ? t('questions') : t('question')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCreateQuestion}
            className="px-4 py-2 rounded-lg flex-row items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">{t('new')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View className="mb-4">
          <View className="relative mb-3">
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
              onChangeText={(text) => {
                setSearchTerm(text);
                setPage(0);
              }}
              className="pl-10 pr-4 py-3 rounded-lg border"
              style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
            />
          </View>

          <View className="rounded-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Picker
              selectedValue={difficultyFilter}
              onValueChange={(value) => {
                setDifficultyFilter(value);
                setPage(0);
              }}
              style={{ height: 50, color: colors.text }}
            >
              <Picker.Item label={`${t('difficulty')} ${t('all')}`} value="all" />
              <Picker.Item label={t('easy')} value="easy" />
              <Picker.Item label={t('medium')} value="medium" />
              <Picker.Item label={t('hard')} value="hard" />
            </Picker>
          </View>
        </View>

        {/* Questions List */}
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : questions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="help-circle-outline" size={64} color={colors.textTertiary} />
            <Text className="text-center mt-4" style={{ color: colors.textSecondary }}>
              {t('noQuestions')}
            </Text>
            <TouchableOpacity
              onPress={handleCreateQuestion}
              className="mt-4 px-6 py-3 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">{tCommon('add')} {t('question')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={questions}
            renderItem={renderQuestionItem}
            keyExtractor={(item) => item.questionId.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            style={{ backgroundColor: colors.background }}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            ListFooterComponent={
              questions.length < total ? (
                <View className="py-4">
                  <TouchableOpacity
                    onPress={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: colors.primary,
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">{t('loadMore')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

