import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Application, JobPosting } from '@/services/api/recruitment';
import { exportService } from '@/utils/export';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';
import { useToast } from '@/hooks/useToast';
import { EmptyState, ApplicationCardSkeleton } from '@/components/ui';
import { FilterBottomSheet, FilterSection } from '@/components/common/FilterBottomSheet';
import { getStatusColor, getStatusLabel } from '@/utils/status';

export default function ApplicationListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const toast = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
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
      } else {
        setLoadingMore(true);
      }
      
      const queryParams: any = {
        page,
        limit,
        sortBy: sortBy === 'appliedAt' ? 'appliedDate' : 'score',
        sortOrder,
      };

      if (searchTerm.trim()) {
        queryParams.keyword = searchTerm.trim();
      }

      if (statusFilter !== 'all') {
        queryParams.applicationStatus = statusFilter;
      }

      if (jobFilter && jobFilter !== 'all') {
        queryParams.jobPostingId = Number(jobFilter);
      }

      const response = await recruitmentAPI.getApplications(queryParams);
      
      if (append) {
        setApplications((prev) => [...prev, ...response.data]);
      } else {
        setApplications(response.data);
      }
      setTotal(response.total || response.data.length);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error(t('failedToLoadApplications'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
    // fetchApplications will be triggered by page change to 0 or via simple call if already 0
    if (page === 0) fetchApplications(false);
  };

  const handleLoadMore = () => {
    if (applications.length < total && !loading && !loadingMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleApplicationPress = (application: Application) => {
    router.push(`/recruitment/applications/${application.applicationId}` as any);
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
        toast.warning(t('noApplications'));
        return;
      }
      await exportService.exportApplicationsToCSV(applications);
      toast.success(tCommon('exportedSuccessfully') || 'Exported successfully');
    } catch (error) {
      console.error('Error exporting applications:', error);
      toast.error(t('failedToLoadApplications'));
    }
  };

  // Debounce search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 0 && searchTerm) {
        fetchApplications(false);
      } else if (page > 0 && searchTerm) {
        setPage(0);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (jobFilter !== 'all') count++;
    return count;
  }, [statusFilter, jobFilter]);

  const resetFilters = () => {
    setStatusFilter('all');
    setJobFilter('all');
    setPage(0);
  };

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
            {getStatusLabel(item.applicationStatus, t)}
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

  const renderEmpty = () => {
    if (loading) return null; // Skeleton handles initial loading
    return (
      <EmptyState
        icon="document-text-outline"
        title={t('noApplications')}
        description={searchTerm ? t('tryAdjustingFilters') : t('noApplicationsDescription') || t('noApplications')}
      />
    );
  };

  const LoadingView = () => (
    <View className="flex-1 px-4 mt-2">
       {Array.from({ length: 6 }).map((_, index) => (
          <ApplicationCardSkeleton key={index} />
        ))}
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>{t('applications')}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity 
                onPress={() => setShowFilters(true)}
                className="p-2 relative"
            >
                <Ionicons name="filter-outline" size={24} color={activeFiltersCount > 0 ? colors.primary : colors.text} />
                {activeFiltersCount > 0 && (
                  <View className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
                )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExport} className="p-2">
                <Ionicons name="download-outline" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative">
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
            style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
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
      </View>
      
      {/* List */}
      <View className="flex-1">
        {loading && page === 0 ? <LoadingView /> : (
            <FlatList
                data={applications}
                renderItem={renderApplicationItem}
                keyExtractor={(item) => item.applicationId.toString()}
                contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : (
                        <View className="h-8" /> 
                    )
                }
            />
        )}
      </View>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onReset={resetFilters}
        onApply={() => {
            setShowFilters(false);
            setPage(0); // Trigger fetch
        }}
      >
        <FilterSection
            title={tCommon('status')}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            options={[
              { value: 'all', label: t('filters.all') },
              { value: 'pending', label: t('status.pending') },
              { value: 'reviewing', label: t('status.reviewing') },
              { value: 'interview', label: t('status.interview') },
              { value: 'accepted', label: t('status.accepted') },
              { value: 'rejected', label: t('status.rejected') },
            ]}
        />
        
        {jobs.length > 0 && (
             <FilterSection
                title={t('jobs')}
                selectedValue={jobFilter}
                onSelect={setJobFilter}
                options={[
                    { value: 'all', label: t('allJobs') },
                    ...jobs.map(job => ({ value: job.jobPostingId.toString(), label: job.title }))
                ]}
            />
        )}
         
         <FilterSection
            title={t('sortBy')}
            selectedValue={sortBy}
            onSelect={(val) => setSortBy(val as any)}
            options={[
                  { value: 'appliedAt', label: t('sortByOptions.appliedDate') },
                  { value: 'score', label: t('sortByOptions.score') },
            ]}
         />

        <View className="mt-2">
            <Text className="text-sm font-bold mb-3" style={{ color: colors.text }}>{t('sortOrder')}</Text>
            <View className="flex-row gap-3">
                <TouchableOpacity 
                    onPress={() => setSortOrder('ASC')}
                    className={`flex-1 py-3 rounded-lg border items-center ${sortOrder === 'ASC' ? 'bg-primary border-primary' : 'bg-transparent border-gray-200'}`}
                    style={{ 
                        backgroundColor: sortOrder === 'ASC' ? colors.primary : 'transparent',
                        borderColor: sortOrder === 'ASC' ? colors.primary : colors.border 
                    }}
                >
                    <Text style={{ color: sortOrder === 'ASC' ? 'white' : colors.text }}>Ascending</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setSortOrder('DESC')}
                    className={`flex-1 py-3 rounded-lg border items-center ${sortOrder === 'DESC' ? 'bg-primary border-primary' : 'bg-transparent border-gray-200'}`}
                     style={{ 
                        backgroundColor: sortOrder === 'DESC' ? colors.primary : 'transparent',
                        borderColor: sortOrder === 'DESC' ? colors.primary : colors.border 
                    }}
                >
                    <Text style={{ color: sortOrder === 'DESC' ? 'white' : colors.text }}>Descending</Text>
                </TouchableOpacity>
            </View>
        </View>

      </FilterBottomSheet>
    </View>
  );
}
