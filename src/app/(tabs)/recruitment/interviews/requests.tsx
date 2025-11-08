import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Application } from '@/services/api/recruitment';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function InterviewRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [requests, setRequests] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchRequests = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const response = await recruitmentAPI.getInterviewRequests({ 
        page,
        limit,
      });
      if (append) {
        setRequests((prev) => [...prev, ...response.data]);
      } else {
        setRequests(response.data);
      }
      setTotal(response.total || response.data.length);
    } catch (error) {
      console.error('Error fetching interview requests:', error);
      Alert.alert(tCommon('error'), t('failedToLoadInterviewRequests'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, t, tCommon]);

  useEffect(() => {
    if (page === 0) {
      fetchRequests(false);
    } else {
      fetchRequests(true);
    }
  }, [page, fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchRequests(false);
  };

  const handleLoadMore = () => {
    if (requests.length < total && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleRequestPress = (request: Application) => {
    router.push(`/recruitment/interviews/form?applicationId=${request.applicationId}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderRequestItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      onPress={() => handleRequestPress(item)}
      className="rounded-lg p-4 mb-3 border shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            {item.candidate
              ? `${item.candidate.firstName} ${item.candidate.lastName}`
              : t('unknownCandidate')}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {item.jobPosting?.title || t('unknownPosition')}
          </Text>
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {t('application')} #{item.applicationId} • {formatDate(item.appliedAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      {item.score !== undefined && item.score !== null && (
        <View className="flex-row items-center mt-2 pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
          <Ionicons name="star-outline" size={14} color={colors.warning} />
          <Text className="text-xs font-semibold ml-1" style={{ color: colors.text }}>
            {t('score')}: {item.score.toFixed(1)}/10
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
      <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
        {t('noInterviewRequests')}
      </Text>
      <Text className="mt-2" style={{ color: colors.textTertiary }}>
        {t('allInterviewRequestsScheduled')}
      </Text>
    </View>
  );

  if (loading && requests.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingInterviewRequests')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>{t('interviewRequests')}</Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {requests.length} {requests.length !== 1 ? t('requests') : t('request')}
          </Text>
        </View>
      </View>

      {/* Requests List */}
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.applicationId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          requests.length < total && requests.length > 0 ? (
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
    </View>
  );
}

