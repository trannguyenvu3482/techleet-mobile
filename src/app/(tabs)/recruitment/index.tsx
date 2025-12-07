import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProtectedRoute } from '@/hooks';
import { JobCard, SelectionToolbar, ProgressModal, DateRangePicker, FilterPresetsModal, JobCardSkeleton, EmptyState } from '@/components/ui';
import { BulkOperations, BulkOperationProgress } from '@/utils/bulk-operations';
import { JobPostingDto } from '@/types/recruitment';
import { recruitmentAPI } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportService } from '@/utils/export';
import { filterPresetsService, FilterPreset } from '@/services/filter-presets';
import { shareService } from '@/utils/share';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';
import { FilterBottomSheet, FilterSection } from '@/components/common/FilterBottomSheet';

export default function RecruitmentScreen() {
  useProtectedRoute();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [jobs, setJobs] = useState<JobPostingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<BulkOperationProgress | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });
  const [showPresetsModal, setShowPresetsModal] = useState(false);

  const fetchJobs = useCallback(async (keyword?: string, status?: string, append = false) => {
    try {
      if (!append) {
        setError(null);
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (keyword) {
        params.keyword = keyword;
      }

      if (status !== 'all') {
        params.status = status as 'draft' | 'published' | 'closed';
      }

      if (employmentTypeFilter !== 'all') {
        params.employmentType = employmentTypeFilter;
      }

      if (experienceLevelFilter !== 'all') {
        params.experienceLevel = experienceLevelFilter;
      }

      if (dateRange.startDate) {
        params.startDate = dateRange.startDate.toISOString().split('T')[0];
      }

      if (dateRange.endDate) {
        params.endDate = dateRange.endDate.toISOString().split('T')[0];
      }

      const response = await recruitmentAPI.getJobPostings(params);
      if (append) {
        setJobs((prev) => [...prev, ...response.data]);
      } else {
        setJobs(response.data);
      }
      setTotal(response.total || response.data.length);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(t('failedToLoadJobs'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [page, sortBy, sortOrder, employmentTypeFilter, experienceLevelFilter, dateRange]);

  React.useEffect(() => {
    if (page === 0) {
      fetchJobs(searchTerm || undefined, statusFilter, false);
    } else {
      fetchJobs(searchTerm || undefined, statusFilter, true);
    }
  }, [page, searchTerm, statusFilter, sortBy, sortOrder, employmentTypeFilter, experienceLevelFilter, dateRange, fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    // fetchJobs triggered by effect
  };

  const handleLoadMore = () => {
    if (jobs.length < total && !loading && !loadingMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setPage(0);
  };

  // Debounce search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 0) {
         // This effect is redundant because query params change triggers the main effect
         // But we keep it if we want to delay the state update of searchTerm itself or its effect
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSortChange = (field: 'createdAt' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(0);
  };

  const handleJobPress = (job: JobPostingDto) => {
    router.push(`/recruitment/jobs/detail?id=${job.jobPostingId}`);
  };

  const handleEdit = (job: JobPostingDto) => {
    router.push(`/recruitment/jobs/form?id=${job.jobPostingId}`);
  };

  const handleExport = async () => {
    try {
      if (jobs.length === 0) {
        Alert.alert('No Data', 'There are no jobs to export');
        return;
      }
      await exportService.exportJobsToCSV(jobs);
    } catch (error) {
      console.error('Error exporting jobs:', error);
      Alert.alert('Error', 'Failed to export jobs');
    }
  };

  const handleToggleSelection = (jobId: number) => {
    setSelectedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedJobs(new Set(jobs.map((job) => job.jobPostingId)));
  };

  const handleDeselectAll = () => {
    setSelectedJobs(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedJobs.size === 0) {
      Alert.alert('No Selection', 'Please select at least one job');
      return;
    }

    Alert.alert(
      'Delete Jobs',
      `Are you sure you want to delete ${selectedJobs.size} job(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const jobIds = Array.from(selectedJobs);
              setShowProgressModal(true);
              setBulkProgress({ total: jobIds.length, completed: 0, failed: 0 });

              const results = await BulkOperations.executeSequentially(
                jobIds,
                async (jobId) => {
                  await recruitmentAPI.deleteJobPosting(jobId);
                  return jobId;
                },
                {
                  onProgress: (progress) => {
                    setBulkProgress(progress);
                  },
                }
              );

              setShowProgressModal(false);
              const summary = BulkOperations.getSummary(results);

              if (summary.failed === 0) {
                Alert.alert('Success', `${summary.success} job(s) deleted successfully`);
              } else {
                Alert.alert(
                  'Partial Success',
                  `${summary.success} job(s) deleted successfully, ${summary.failed} failed`
                );
              }

              setSelectedJobs(new Set());
              setSelectionMode(false);
              setPage(0);
            } catch (error) {
              console.error('Error deleting jobs:', error);
              setShowProgressModal(false);
              Alert.alert('Error', 'Failed to delete jobs');
            }
          },
        },
      ]
    );
  };

  const handleBulkExport = async () => {
    if (selectedJobs.size === 0) {
      Alert.alert('No Selection', 'Please select at least one job');
      return;
    }

    try {
      const selectedJobsData = jobs.filter((job) =>
        selectedJobs.has(job.jobPostingId)
      );
      await exportService.exportJobsToCSV(selectedJobsData);
      setSelectedJobs(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Error exporting jobs:', error);
      Alert.alert('Error', 'Failed to export jobs');
    }
  };

  const handleBulkStatusUpdate = () => {
    if (selectedJobs.size === 0) {
      Alert.alert('No Selection', 'Please select at least one job');
      return;
    }

    Alert.alert(
      'Update Status',
      'Select new status:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            try {
              const jobIds = Array.from(selectedJobs);
              setShowProgressModal(true);
              setBulkProgress({ total: jobIds.length, completed: 0, failed: 0 });

              const results = await BulkOperations.executeSequentially(
                jobIds,
                async (jobId) => {
                  await recruitmentAPI.publishJobPosting(jobId);
                  return jobId;
                },
                {
                  onProgress: (progress) => {
                    setBulkProgress(progress);
                  },
                }
              );

              setShowProgressModal(false);
              const summary = BulkOperations.getSummary(results);

              if (summary.failed === 0) {
                Alert.alert('Success', `${summary.success} job(s) published successfully`);
              } else {
                Alert.alert(
                  'Partial Success',
                  `${summary.success} job(s) published successfully, ${summary.failed} failed`
                );
              }

              setSelectedJobs(new Set());
              setSelectionMode(false);
              setPage(0);
            } catch (error) {
              console.error('Error publishing jobs:', error);
              setShowProgressModal(false);
              Alert.alert('Error', 'Failed to publish jobs');
            }
          },
        },
        {
          text: 'Close',
          onPress: async () => {
            try {
              const jobIds = Array.from(selectedJobs);
              setShowProgressModal(true);
              setBulkProgress({ total: jobIds.length, completed: 0, failed: 0 });

              const results = await BulkOperations.executeSequentially(
                jobIds,
                async (jobId) => {
                  await recruitmentAPI.closeJobPosting(jobId);
                  return jobId;
                },
                {
                  onProgress: (progress) => {
                    setBulkProgress(progress);
                  },
                }
              );

              setShowProgressModal(false);
              const summary = BulkOperations.getSummary(results);

              if (summary.failed === 0) {
                Alert.alert('Success', `${summary.success} job(s) closed successfully`);
              } else {
                Alert.alert(
                  'Partial Success',
                  `${summary.success} job(s) closed successfully, ${summary.failed} failed`
                );
              }

              setSelectedJobs(new Set());
              setSelectionMode(false);
              setPage(0);
            } catch (error) {
              console.error('Error closing jobs:', error);
              setShowProgressModal(false);
              Alert.alert('Error', 'Failed to close jobs');
            }
          },
        },
      ]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedJobs(new Set());
  };

  const getCurrentFilters = () => {
    return {
      status: statusFilter,
      employmentType: employmentTypeFilter,
      experienceLevel: experienceLevelFilter,
      sortBy,
      sortOrder,
      dateRange,
    };
  };

  const handleSelectPreset = (preset: FilterPreset) => {
    const filters = preset.filters as any;
    if (filters.status) setStatusFilter(filters.status);
    if (filters.employmentType) setEmploymentTypeFilter(filters.employmentType);
    if (filters.experienceLevel) setExperienceLevelFilter(filters.experienceLevel);
    if (filters.sortBy) setSortBy(filters.sortBy);
    if (filters.sortOrder) setSortOrder(filters.sortOrder);
    if (filters.dateRange) setDateRange(filters.dateRange);
    setPage(0);
  };

  const handleSavePreset = async (name: string) => {
    try {
      await filterPresetsService.savePreset({
        name,
        type: 'jobs',
        filters: getCurrentFilters(),
      });
      Alert.alert('Success', 'Filter preset saved');
    } catch (error) {
      console.error('Error saving preset:', error);
      Alert.alert('Error', 'Failed to save preset');
    }
  };

  const handleExportFilters = async () => {
    try {
      const filters = getCurrentFilters();
      const jsonString = JSON.stringify(filters, null, 2);
      await shareService.shareText(jsonString, 'Export Filter Configuration');
    } catch (error) {
      console.error('Error exporting filters:', error);
      Alert.alert('Error', 'Failed to export filters');
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setEmploymentTypeFilter('all');
    setExperienceLevelFilter('all');
    setDateRange({ startDate: null, endDate: null });
    setPage(0);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (employmentTypeFilter !== 'all') count++;
    if (experienceLevelFilter !== 'all') count++;
    if (dateRange.startDate || dateRange.endDate) count++;
    return count;
  }, [statusFilter, employmentTypeFilter, experienceLevelFilter, dateRange]);

  const renderHeader = () => (
    <>
    <View className="px-4 pt-4 pb-2 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>{t('title')}</Text>
        <View className="flex-row gap-2">
          {!selectionMode ? (
            <>
              <TouchableOpacity 
                onPress={() => setSelectionMode(true)}
                className="rounded-lg items-center justify-center"
                style={{ 
                  backgroundColor: colors.purple,
                  minWidth: 44,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="checkbox-outline" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                className="rounded-lg items-center justify-center relative p-3"
                style={{ backgroundColor: colors.card }}
              >
                <Ionicons name="filter-outline" size={20} color={activeFiltersCount > 0 ? colors.primary : colors.textSecondary} />
                {activeFiltersCount > 0 && (
                  <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/recruitment/jobs/form')}
                className="rounded-lg items-center justify-center"
                style={{ 
                  backgroundColor: colors.primary,
                  minHeight: 44,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text className="text-white font-semibold">{t('addJob')}</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      {/* Quick Navigation */}
      <View className="flex-row gap-2 mb-3 flex-wrap">
        <TouchableOpacity
          onPress={() => router.push('/recruitment/applications/index')}
          className="flex-1 min-w-[30%] bg-orange-50 px-3 py-2 rounded-lg border border-orange-200"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="document-text-outline" size={18} color="#f97316" />
            <Text className="text-sm font-semibold text-orange-600 ml-2">{t('applications')}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/recruitment/candidates/index')}
          className="flex-1 min-w-[30%] bg-green-50 px-3 py-2 rounded-lg border border-green-200"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="people-outline" size={18} color="#10b981" />
            <Text className="text-sm font-semibold text-green-600 ml-2">{t('candidates')}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/recruitment/interviews/calendar')}
          className="flex-1 min-w-[30%] bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
        >
           <View className="flex-row items-center justify-center">
            <Ionicons name="calendar-outline" size={18} color="#2563eb" />
            <Text className="text-sm font-semibold text-blue-600 ml-2">{t('interviews')}</Text>
          </View>
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
          placeholder={t('searchJobs')}
          placeholderTextColor={colors.textTertiary}
          value={searchTerm}
          onChangeText={handleSearch}
          style={{ backgroundColor: colors.card, color: colors.text }}
        />
      </View>
    </View>
    </>
  );

  const renderEmpty = () => {
    if (loading && jobs.length === 0) return null;
    return (
        <EmptyState
            icon="briefcase-outline"
            title={t('noJobs')}
            description={t('addJob')}
            actionLabel={t('createJob')}
            onAction={() => router.push('/recruitment/jobs/form')}
        />
    );
  };

  const LoadingView = () => (
      <View className="flex-1 px-4 mt-2">
         {renderHeader()}
         {Array.from({ length: 6 }).map((_, index) => (
            <JobCardSkeleton key={index} />
          ))}
      </View>
    );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      
      {selectionMode && (
        <SelectionToolbar
          selectedCount={selectedJobs.size}
          totalCount={jobs.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onCancel={handleCancelSelection}
        />
      )}

      {loading && page === 0 ? <LoadingView /> : (
        <FlatList
            ListHeaderComponent={renderHeader}
            data={jobs}
            renderItem={({ item }) => (
            <JobCard
                job={item}
                onPress={() => handleJobPress(item)}
                onEdit={() => handleEdit(item)}
                selected={selectedJobs.has(item.jobPostingId)}
                onSelect={() => handleToggleSelection(item.jobPostingId)}
                selectionMode={selectionMode}
            />
            )}
            keyExtractor={(item) => item.jobPostingId.toString()}
            contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
                 loadingMore ? (
                    <View className="py-4 items-center">
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : (
                    <View className="h-4" /> 
                )
            }
        />
      )}

      {/* Progress Modal */}
      <ProgressModal
        visible={showProgressModal}
        title="Processing..."
        progress={bulkProgress || { total: 0, completed: 0, failed: 0 }}
        onCancel={() => {
          setShowProgressModal(false);
          setBulkProgress(null);
        }}
      />

       <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onReset={resetFilters}
        onApply={() => {
            setShowFilters(false);
            setPage(0);
        }}
      >
        {/* Date Range Picker */}
        <View className="mb-4">
             <Text className="text-sm font-bold mb-2 ml-1" style={{ color: colors.text }}>{t('dateRange')}</Text>
             <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                label=""
                placeholder={t('selectDateRange')}
            />
        </View>

        <FilterSection
            title={tCommon('status')}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            options={[
              { value: 'all', label: t('filters.all') },
              { value: 'draft', label: t('status.draft') },
              { value: 'published', label: t('status.published') },
              { value: 'closed', label: t('status.closed') },
            ]}
        />
        
        <FilterSection
            title={t('employmentType')}
            selectedValue={employmentTypeFilter}
            onSelect={setEmploymentTypeFilter}
            options={[
              { value: 'all', label: t('filters.all') },
              { value: 'full-time', label: t('employmentTypes.fullTime') },
              { value: 'part-time', label: t('employmentTypes.partTime') },
              { value: 'contract', label: t('employmentTypes.contract') },
              { value: 'internship', label: t('employmentTypes.internship') },
            ]}
        />

         <FilterSection
            title={t('experienceLevel')}
            selectedValue={experienceLevelFilter}
            onSelect={setExperienceLevelFilter}
            options={[
              { value: 'all', label: t('filters.all') },
              { value: 'entry', label: t('experienceLevels.entry') },
              { value: 'mid', label: t('experienceLevels.mid') },
              { value: 'senior', label: t('experienceLevels.senior') },
              { value: 'executive', label: t('experienceLevels.executive') },
            ]}
        />
         
         <FilterSection
            title={t('sortBy')}
            selectedValue={sortBy}
            onSelect={(val) => setSortBy(val as any)}
            options={[
                  { value: 'createdAt', label: t('sortByOptions.createdAt') },
                  { value: 'title', label: t('sortByOptions.title') },
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

        <TouchableOpacity 
            onPress={() => {
                setShowFilters(false);
                setShowPresetsModal(true);
            }}
            className="flex-row items-center justify-center py-3 mt-4 border-t border-gray-100"
            style={{ borderTopColor: colors.borderLight }}
        >
             <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
            <Text className="ml-2 font-medium" style={{ color: colors.primary }}>{t('managePresets')}</Text>
        </TouchableOpacity>

      </FilterBottomSheet>

      {/* Filter Presets Modal */}
      <FilterPresetsModal
        visible={showPresetsModal}
        type="jobs"
        currentFilters={getCurrentFilters()}
        onSelectPreset={handleSelectPreset}
        onSavePreset={handleSavePreset}
        onClose={() => setShowPresetsModal(false)}
      />
    </View>
  );
}
