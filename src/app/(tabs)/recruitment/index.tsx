import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '@/hooks';
import { JobCard, SelectionToolbar, ProgressModal, DateRangePicker, FilterPresetsModal } from '@/components/ui';
import { BulkOperations, BulkOperationProgress } from '@/utils/bulk-operations';
import { JobPostingDto } from '@/types/recruitment';
import { recruitmentAPI } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportService } from '@/utils/export';
import { filterPresetsService, FilterPreset } from '@/services/filter-presets';
import { shareService } from '@/utils/share';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function RecruitmentScreen() {
  useProtectedRoute();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [jobs, setJobs] = useState<JobPostingDto[]>([]);
  const [loading, setLoading] = useState(true);
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
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, sortBy, sortOrder, employmentTypeFilter, experienceLevelFilter]);

  React.useEffect(() => {
    if (page === 0) {
      fetchJobs(searchTerm || undefined, statusFilter, false);
    } else {
      fetchJobs(searchTerm || undefined, statusFilter, true);
    }
  }, [page, searchTerm, statusFilter, sortBy, sortOrder, employmentTypeFilter, experienceLevelFilter, fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchJobs(searchTerm || undefined, statusFilter, false);
  };

  const handleLoadMore = () => {
    if (jobs.length < total && !loading) {
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
        fetchJobs(searchTerm || undefined, statusFilter, false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setPage(0);
    fetchJobs(searchTerm || undefined, newFilter, false);
  };

  const handleEmploymentTypeFilterChange = (newFilter: string) => {
    setEmploymentTypeFilter(newFilter);
    setPage(0);
  };

  const handleExperienceLevelFilterChange = (newFilter: string) => {
    setExperienceLevelFilter(newFilter);
    setPage(0);
  };

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
              fetchJobs(searchTerm || undefined, statusFilter, false);
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
              fetchJobs(searchTerm || undefined, statusFilter, false);
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
              fetchJobs(searchTerm || undefined, statusFilter, false);
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
    fetchJobs(searchTerm || undefined, filters.status || 'all', false);
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

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="briefcase-outline" size={64} color={colors.textTertiary} />
      <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>No jobs found</Text>
      <Text className="mt-2" style={{ color: colors.textTertiary }}>Create a new job posting</Text>
    </View>
  );

  if (loading && jobs.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>Loading jobs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>Recruitment</Text>
          <View className="flex-row gap-2">
            {!selectionMode ? (
              <>
                <TouchableOpacity 
                  onPress={() => setSelectionMode(true)}
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: colors.purple }}
                >
                  <Ionicons name="checkbox-outline" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleExport}
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: colors.secondary }}
                >
                  <Ionicons name="download-outline" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push('/recruitment/jobs/form')}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white font-semibold">Add Job</Text>
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
              <Text className="text-sm font-semibold text-orange-600 ml-2">Applications</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/recruitment/interviews/calendar')}
            className="flex-1 min-w-[30%] bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="calendar-outline" size={18} color="#2563eb" />
              <Text className="text-sm font-semibold text-blue-600 ml-2">Interviews</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/recruitment/interviews/requests')}
            className="flex-1 min-w-[30%] bg-purple-50 px-3 py-2 rounded-lg border border-purple-200"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="person-add-outline" size={18} color="#8b5cf6" />
              <Text className="text-sm font-semibold text-purple-600 ml-2">Requests</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/recruitment/candidates/index')}
            className="flex-1 min-w-[30%] bg-green-50 px-3 py-2 rounded-lg border border-green-200"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="people-outline" size={18} color="#10b981" />
              <Text className="text-sm font-semibold text-green-600 ml-2">Candidates</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/recruitment/questions/index')}
            className="flex-1 min-w-[30%] bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="help-circle-outline" size={18} color="#6366f1" />
              <Text className="text-sm font-semibold text-indigo-600 ml-2">Questions</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/recruitment/question-sets')}
            className="flex-1 min-w-[30%] bg-pink-50 px-3 py-2 rounded-lg border border-pink-200"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="folder-outline" size={18} color="#ec4899" />
              <Text className="text-sm font-semibold text-pink-600 ml-2">Question Sets</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/recruitment/reports')}
            className="flex-1 min-w-[30%] bg-amber-50 px-3 py-2 rounded-lg border border-amber-200"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="analytics-outline" size={18} color="#f59e0b" />
              <Text className="text-sm font-semibold text-amber-600 ml-2">Reports</Text>
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
            placeholder="Search jobs..."
            placeholderTextColor={colors.textTertiary}
            value={searchTerm}
            onChangeText={handleSearch}
            style={{ backgroundColor: colors.card, color: colors.text }}
          />
        </View>

        {/* Filters Toggle */}
        <View className="flex-row gap-2 mb-2">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-1 flex-row items-center justify-between px-4 py-3 rounded-lg"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center">
              <Ionicons name="filter-outline" size={18} color={colors.textSecondary} />
              <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>Filters & Sort</Text>
              {(statusFilter !== 'all' || employmentTypeFilter !== 'all' || experienceLevelFilter !== 'all' || sortBy !== 'createdAt' || dateRange.startDate || dateRange.endDate) && (
                <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-xs text-white font-semibold">Active</Text>
                </View>
              )}
            </View>
            <Ionicons
              name={showFilters ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPresetsModal(true)}
            className="px-4 py-3 rounded-lg"
            style={{ backgroundColor: colors.purple }}
          >
            <Ionicons name="bookmark-outline" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportFilters}
            className="px-4 py-3 rounded-lg"
            style={{ backgroundColor: colors.secondary }}
          >
            <Ionicons name="download-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Filters & Sort Options (Collapsible) */}
        {showFilters && (
          <View className="rounded-lg p-3 mb-2 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {/* Date Range Picker */}
            <View className="mb-3">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                label="Date Range"
                placeholder="Filter by date range"
              />
            </View>

            {/* Status Filter */}
            <View className="mb-3">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>Status:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {['all', 'draft', 'published', 'closed'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => handleFilterChange(filter)}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: statusFilter === filter ? colors.primary : colors.card,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: statusFilter === filter ? 'white' : colors.textSecondary,
                      }}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Employment Type Filter */}
            <View className="mb-3">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>Employment Type:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {['all', 'full-time', 'part-time', 'contract', 'internship'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => handleEmploymentTypeFilterChange(filter)}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: employmentTypeFilter === filter ? colors.secondary : colors.card,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: employmentTypeFilter === filter ? 'white' : colors.textSecondary,
                      }}
                    >
                      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Level Filter */}
            <View className="mb-3">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>Experience Level:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {['all', 'entry', 'mid', 'senior', 'executive'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => handleExperienceLevelFilterChange(filter)}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: experienceLevelFilter === filter ? colors.purple : colors.card,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: experienceLevelFilter === filter ? 'white' : colors.textSecondary,
                      }}
                    >
                      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View>
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>Sort By:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {[
                  { value: 'createdAt', label: 'Date' },
                  { value: 'title', label: 'Title' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleSortChange(option.value as 'createdAt' | 'title')}
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

      {/* Selection Toolbar */}
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

      {/* Jobs List */}
      <FlatList
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
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={
          jobs.length < total && jobs.length > 0 ? (
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
                  <Text className="text-white font-semibold">Load More</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

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

