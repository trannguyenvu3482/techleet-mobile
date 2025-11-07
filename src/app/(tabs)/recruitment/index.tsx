import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '@/hooks';
import { JobCard } from '@/components/ui';
import { JobPostingDto } from '@/types/recruitment';
import { recruitmentAPI } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecruitmentScreen() {
  useProtectedRoute();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="briefcase-outline" size={64} color="#d1d5db" />
      <Text className="text-lg font-semibold text-gray-500 mt-4">No jobs found</Text>
      <Text className="text-gray-400 mt-2">Create a new job posting</Text>
    </View>
  );

  if (loading && jobs.length === 0) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading jobs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Recruitment</Text>
          <TouchableOpacity 
            onPress={() => router.push('/recruitment/jobs/form')}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Add Job</Text>
          </TouchableOpacity>
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
        </View>

        {/* Search Bar */}
        <View className="relative mb-3">
          <Ionicons
            name="search-outline"
            size={20}
            color="#9ca3af"
            style={{ position: 'absolute', left: 12, top: 12 }}
          />
          <TextInput
            className="bg-gray-100 rounded-lg pl-10 pr-4 py-3 text-gray-900"
            placeholder="Search jobs..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={handleSearch}
          />
        </View>

        {/* Filters Toggle */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center justify-between bg-gray-100 px-4 py-3 rounded-lg mb-2"
        >
          <View className="flex-row items-center">
            <Ionicons name="filter-outline" size={18} color="#6b7280" />
            <Text className="text-sm font-semibold text-gray-700 ml-2">Filters & Sort</Text>
            {(statusFilter !== 'all' || employmentTypeFilter !== 'all' || experienceLevelFilter !== 'all' || sortBy !== 'createdAt') && (
              <View className="ml-2 bg-blue-600 rounded-full px-2 py-0.5">
                <Text className="text-xs text-white font-semibold">Active</Text>
              </View>
            )}
          </View>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6b7280"
          />
        </TouchableOpacity>

        {/* Filters & Sort Options (Collapsible) */}
        {showFilters && (
          <View className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200">
            {/* Status Filter */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-700 mb-2">Status:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {['all', 'draft', 'published', 'closed'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => handleFilterChange(filter)}
                    className={`px-3 py-2 rounded-lg ${
                      statusFilter === filter ? 'bg-blue-600' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        statusFilter === filter ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Employment Type Filter */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-700 mb-2">Employment Type:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {['all', 'full-time', 'part-time', 'contract', 'internship'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => handleEmploymentTypeFilterChange(filter)}
                    className={`px-3 py-2 rounded-lg ${
                      employmentTypeFilter === filter ? 'bg-green-600' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        employmentTypeFilter === filter ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Level Filter */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-700 mb-2">Experience Level:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {['all', 'entry', 'mid', 'senior', 'executive'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => handleExperienceLevelFilterChange(filter)}
                    className={`px-3 py-2 rounded-lg ${
                      experienceLevelFilter === filter ? 'bg-purple-600' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        experienceLevelFilter === filter ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View>
              <Text className="text-xs font-semibold text-gray-700 mb-2">Sort By:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {[
                  { value: 'createdAt', label: 'Date' },
                  { value: 'title', label: 'Title' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleSortChange(option.value as 'createdAt' | 'title')}
                    className={`px-3 py-2 rounded-lg ${
                      sortBy === option.value ? 'bg-orange-600' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className={`text-xs font-semibold ${
                          sortBy === option.value ? 'text-white' : 'text-gray-600'
                        }`}
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

      {/* Jobs List */}
      <FlatList
        data={jobs}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => handleJobPress(item)}
            onEdit={() => handleEdit(item)}
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
                className={`bg-blue-600 px-4 py-2 rounded-lg items-center ${
                  loading ? 'opacity-50' : ''
                }`}
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
    </View>
  );
}

