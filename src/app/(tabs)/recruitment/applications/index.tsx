import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { recruitmentAPI, Application, JobPosting } from '@/services/api/recruitment';
import { exportService } from '@/utils/export';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function ApplicationListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>(params.jobId || 'all');
  const [sortBy, setSortBy] = useState<'appliedAt' | 'score'>('appliedAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchApplications = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const params: any = {
        page,
        limit,
        sortBy: sortBy === 'appliedAt' ? 'appliedDate' : 'score',
        sortOrder,
      };

      if (searchTerm.trim()) {
        params.keyword = searchTerm.trim();
      }

      if (statusFilter !== 'all') {
        params.applicationStatus = statusFilter;
      }

      if (jobFilter && jobFilter !== 'all') {
        params.jobPostingId = Number(jobFilter);
      }

      const response = await recruitmentAPI.getApplications(params);
      if (append) {
        setApplications((prev) => [...prev, ...response.data]);
      } else {
        setApplications(response.data);
      }
      setTotal(response.total || response.data.length);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert(tCommon('error'), t('failedToLoadApplications'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchTerm, statusFilter, jobFilter, sortBy, sortOrder]);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await recruitmentAPI.getJobPostings({ limit: 100 });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (page === 0) {
      fetchApplications(false);
    } else {
      fetchApplications(true);
    }
  }, [page, searchTerm, statusFilter, jobFilter, sortBy, sortOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchApplications(false);
  };

  const handleLoadMore = () => {
    if (applications.length < total && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleApplicationPress = (application: Application) => {
    router.push(`/recruitment/applications/${application.applicationId}` as any);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'hired':
        return '#10b981';
      case 'offer':
        return '#3b82f6';
      case 'interviewing':
        return '#8b5cf6';
      case 'screening':
      case 'screening_passed':
        return '#f59e0b';
      case 'rejected':
      case 'screening_failed':
        return '#ef4444';
      case 'submitted':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setPage(0);
  };

  const handleExport = async () => {
    try {
      if (applications.length === 0) {
        Alert.alert(tCommon('noData'), t('noApplications'));
        return;
      }
      await exportService.exportApplicationsToCSV(applications);
    } catch (error) {
      console.error('Error exporting applications:', error);
      Alert.alert(tCommon('error'), t('failedToLoadApplications'));
    }
  };

  // Debounce search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 0) {
        fetchApplications(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      onPress={() => handleApplicationPress(item)}
      className="rounded-lg p-4 mb-3 border shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            {item.candidate
              ? `${item.candidate.firstName} ${item.candidate.lastName}`
              : t('candidate')}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {item.jobPosting?.title || t('jobPosting')}
          </Text>
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {t('application')} #{item.applicationId} • {formatDate(item.appliedAt)}
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full ml-2"
          style={{ backgroundColor: `${getStatusColor(item.applicationStatus)}20` }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: getStatusColor(item.applicationStatus) }}
          >
            {getStatusLabel(item.applicationStatus)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-2 pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
        <View className="flex-row items-center">
          <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
          <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
            {item.candidate?.email || 'N/A'}
          </Text>
        </View>
        {item.score !== undefined && item.score !== null && (
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={14} color={colors.warning} />
            <Text className="text-xs font-semibold ml-1" style={{ color: colors.text }}>
              {t('score')} {item.score.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
      <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
        {t('noApplications')}
      </Text>
      <Text className="mt-2" style={{ color: colors.textTertiary }}>
        {searchTerm ? t('tryAdjustingFilters') : t('noApplications')}
      </Text>
    </View>
  );

  if (loading && applications.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingApplications')}</Text>
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
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>{t('applications')}</Text>
          <TouchableOpacity onPress={handleExport} className="p-2">
            <Ionicons name="download-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative mb-3">
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
            style={{ position: 'absolute', left: 12, top: 12 }}
          />
          <TextInput
            className="rounded-lg pl-10 pr-4 py-3"
            placeholder={t('searchApplications')}
            placeholderTextColor={colors.textTertiary}
            value={searchTerm}
            onChangeText={handleSearch}
            style={{ backgroundColor: colors.card, color: colors.text }}
          />
        </View>

        {/* Filters Toggle */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center justify-between px-4 py-3 rounded-lg mb-2"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row items-center">
            <Ionicons name="filter-outline" size={18} color={colors.textSecondary} />
            <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>{t('filters')}</Text>
            {(statusFilter !== 'all' || jobFilter !== 'all' || sortBy !== 'appliedAt') && (
              <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: colors.primary }}>
                <Text className="text-xs text-white font-semibold">{t('filters.active')}</Text>
              </View>
            )}
          </View>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Filters & Sort Options (Collapsible) */}
        {showFilters && (
          <View className="rounded-lg p-3 mb-2 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {/* Status Filter */}
            <View className="mb-3">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>{tCommon('filter')}:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {[
                  { value: 'all', label: t('filters.all') },
                  { value: 'pending', label: t('status.pending') },
                  { value: 'reviewing', label: t('status.reviewing') },
                  { value: 'interview', label: t('status.interview') },
                  { value: 'accepted', label: t('status.accepted') },
                  { value: 'rejected', label: t('status.rejected') },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => {
                      setStatusFilter(filter.value);
                      setPage(0);
                    }}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: statusFilter === filter.value ? colors.primary : colors.card,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: statusFilter === filter.value ? 'white' : colors.textSecondary,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Job Filter */}
            {jobs.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>{t('jobs')}:</Text>
                <View className="flex-row gap-2 flex-wrap">
                  <TouchableOpacity
                    onPress={() => {
                      setJobFilter('all');
                      setPage(0);
                    }}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: jobFilter === 'all' ? colors.secondary : colors.card,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: jobFilter === 'all' ? 'white' : colors.textSecondary,
                      }}
                    >
                      {t('allJobs')}
                    </Text>
                  </TouchableOpacity>
                  {jobs.map((job) => (
                    <TouchableOpacity
                      key={job.jobPostingId}
                      onPress={() => {
                        setJobFilter(job.jobPostingId.toString());
                        setPage(0);
                      }}
                      className="px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: jobFilter === job.jobPostingId.toString() ? colors.secondary : colors.card,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: jobFilter === job.jobPostingId.toString() ? 'white' : colors.textSecondary,
                          maxWidth: 120,
                        }}
                        numberOfLines={1}
                      >
                        {job.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Sort Options */}
            <View>
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>{t('sortBy')}</Text>
              <View className="flex-row gap-2 flex-wrap">
                {[
                  { value: 'appliedAt', label: t('sortByOptions.appliedDate') },
                  { value: 'score', label: t('sortByOptions.score') },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      if (sortBy === option.value) {
                        setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                      } else {
                        setSortBy(option.value as 'appliedAt' | 'score');
                        setSortOrder('DESC');
                      }
                      setPage(0);
                    }}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: sortBy === option.value ? colors.warning : colors.card,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: sortBy === option.value ? 'white' : colors.textSecondary,
                        }}
                      >
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <Ionicons
                          name={sortOrder === 'ASC' ? 'arrow-up' : 'arrow-down'}
                          size={14}
                          color="white"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Applications List */}
      <FlatList
        data={applications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.applicationId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          applications.length < total && applications.length > 0 ? (
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

