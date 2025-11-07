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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { recruitmentAPI, Application, JobPosting } from '@/services/api/recruitment';

export default function ApplicationListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const insets = useSafeAreaInsets();
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
      Alert.alert('Error', 'Failed to load applications');
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
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            {item.candidate
              ? `${item.candidate.firstName} ${item.candidate.lastName}`
              : 'Unknown Candidate'}
          </Text>
          <Text className="text-sm text-gray-600 mb-1">
            {item.jobPosting?.title || 'Unknown Position'}
          </Text>
          <Text className="text-xs text-gray-500">
            Application #{item.applicationId} • {formatDate(item.appliedAt)}
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ml-2`}
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

      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="mail-outline" size={14} color="#6b7280" />
          <Text className="text-xs text-gray-600 ml-1">
            {item.candidate?.email || 'N/A'}
          </Text>
        </View>
        {item.score !== undefined && item.score !== null && (
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={14} color="#f59e0b" />
            <Text className="text-xs font-semibold text-gray-700 ml-1">
              Score: {item.score.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
      <Text className="text-lg font-semibold text-gray-500 mt-4">
        No applications found
      </Text>
      <Text className="text-gray-400 mt-2">
        {searchTerm ? 'Try adjusting your filters' : 'No applications available'}
      </Text>
    </View>
  );

  if (loading && applications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading applications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Applications</Text>
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
            placeholder="Search applications..."
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
            {(statusFilter !== 'all' || jobFilter !== 'all' || sortBy !== 'appliedAt') && (
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
                {[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Submitted' },
                  { value: 'reviewing', label: 'Screening' },
                  { value: 'interview', label: 'Interviewing' },
                  { value: 'accepted', label: 'Offer' },
                  { value: 'rejected', label: 'Rejected' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => {
                      setStatusFilter(filter.value);
                      setPage(0);
                    }}
                    className={`px-3 py-2 rounded-lg ${
                      statusFilter === filter.value ? 'bg-blue-600' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        statusFilter === filter.value ? 'text-white' : 'text-gray-600'
                      }`}
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
                <Text className="text-xs font-semibold text-gray-700 mb-2">Job:</Text>
                <View className="flex-row gap-2 flex-wrap">
                  <TouchableOpacity
                    onPress={() => {
                      setJobFilter('all');
                      setPage(0);
                    }}
                    className={`px-3 py-2 rounded-lg ${
                      jobFilter === 'all' ? 'bg-green-600' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        jobFilter === 'all' ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      All Jobs
                    </Text>
                  </TouchableOpacity>
                  {jobs.map((job) => (
                    <TouchableOpacity
                      key={job.jobPostingId}
                      onPress={() => {
                        setJobFilter(job.jobPostingId.toString());
                        setPage(0);
                      }}
                      className={`px-3 py-2 rounded-lg ${
                        jobFilter === job.jobPostingId.toString() ? 'bg-green-600' : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          jobFilter === job.jobPostingId.toString() ? 'text-white' : 'text-gray-600'
                        }`}
                        numberOfLines={1}
                        style={{ maxWidth: 120 }}
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
              <Text className="text-xs font-semibold text-gray-700 mb-2">Sort By:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {[
                  { value: 'appliedAt', label: 'Date' },
                  { value: 'score', label: 'Score' },
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

