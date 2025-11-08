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
import { recruitmentAPI, QuestionSet } from '@/services/api/recruitment';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function QuestionSetsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchQuestionSets = useCallback(async (append = false) => {
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

      const response = await recruitmentAPI.getQuestionSets(params);
      if (append) {
        setQuestionSets((prev) => [...prev, ...response.data]);
      } else {
        setQuestionSets(response.data);
      }
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching question sets:', error);
      Alert.alert(tCommon('error'), t('failedToLoadQuestionSets'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    if (page === 0) {
      fetchQuestionSets(false);
    } else {
      fetchQuestionSets(true);
    }
  }, [page, searchTerm, fetchQuestionSets]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchQuestionSets(false);
  };

  const handleLoadMore = () => {
    if (questionSets.length < total && !loading) {
      setPage((prev) => prev + 1);
      fetchQuestionSets(true);
    }
  };

  const handleQuestionSetPress = (questionSet: QuestionSet) => {
    router.push(`/recruitment/question-sets/${questionSet.setId}`);
  };

  const handleCreateQuestionSet = () => {
    router.push('/recruitment/question-sets/form');
  };

  const handleEditQuestionSet = (questionSet: QuestionSet) => {
    router.push(`/recruitment/question-sets/form?id=${questionSet.setId}`);
  };

  const handleDeleteQuestionSet = (questionSet: QuestionSet) => {
    Alert.alert(
      'Delete Question Set',
      `Are you sure you want to delete "${questionSet.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recruitmentAPI.deleteQuestionSet(questionSet.setId);
              Alert.alert('Success', 'Question set deleted successfully');
              fetchQuestionSets();
            } catch (error) {
              console.error('Error deleting question set:', error);
              Alert.alert('Error', 'Failed to delete question set');
            }
          },
        },
      ]
    );
  };

  const renderQuestionSetItem = ({ item }: { item: QuestionSet }) => {
    const questionCount = item.questionSetItems?.length || 0;
    return (
      <TouchableOpacity
        onPress={() => handleQuestionSetPress(item)}
        className="p-4 mb-3 rounded-lg border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-semibold mb-1" style={{ color: colors.text }}>
              {item.title}
            </Text>
            {item.description && (
              <Text className="text-sm mb-2" style={{ color: colors.textSecondary }} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View className="flex-row items-center mt-2">
              <View className="px-2 py-1 rounded border" style={{ backgroundColor: colors.primaryLight, borderColor: colors.primary }}>
                <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                  {questionCount} {questionCount !== 1 ? t('questions') : t('question')}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => handleEditQuestionSet(item)}
              className="p-2 mr-1"
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteQuestionSet(item)}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
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
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>{t('questionSets')}</Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {total} {total !== 1 ? t('sets') : t('set')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCreateQuestionSet}
            className="px-4 py-2 rounded-lg flex-row items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">{t('new')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="mb-4">
          <View className="relative">
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textSecondary}
              style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              placeholder={t('searchQuestionSets')}
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
        </View>

        {/* Question Sets List */}
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : questionSets.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="folder-outline" size={64} color={colors.textTertiary} />
            <Text className="text-center mt-4" style={{ color: colors.textSecondary }}>
              {t('noQuestionSets')}
            </Text>
            <TouchableOpacity
              onPress={handleCreateQuestionSet}
              className="mt-4 px-6 py-3 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">{tCommon('add')} {t('questionSet')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={questionSets}
            renderItem={renderQuestionSetItem}
            keyExtractor={(item) => item.setId.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            style={{ backgroundColor: colors.background }}
            ListFooterComponent={
              questionSets.length < total ? (
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

