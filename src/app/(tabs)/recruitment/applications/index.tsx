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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { recruitmentAPI, Application, JobPosting } from '@/services/api/recruitment';

export default function ApplicationListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>(params.jobId || 'all');
  const [sortBy, setSortBy] = useState<'appliedAt' | 'score'>('appliedAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 100,
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
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, statusFilter, jobFilter, sortBy, sortOrder]);

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
    fetchApplications();
  }, [fetchApplications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
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
    setTimeout(() => {
      fetchApplications();
    }, 500);
  };

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
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Applications</Text>
          <TouchableOpacity
            onPress={() => {
              setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
            }}
            className="p-2"
          >
            <Ionicons
              name={sortOrder === 'ASC' ? 'arrow-up' : 'arrow-down'}
              size={20}
              color="#2563eb"
            />
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
            placeholder="Search applications..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={handleSearch}
          />
        </View>

        {/* Filters */}
        <View className="flex-row gap-2 mb-2">
          {/* Status Filter */}
          <View className="flex-1">
            <Picker
              selectedValue={statusFilter}
              onValueChange={(itemValue) => {
                setStatusFilter(itemValue);
                fetchApplications();
              }}
              style={{ backgroundColor: '#f3f4f6', borderRadius: 8 }}
            >
              <Picker.Item label="All Status" value="all" />
              <Picker.Item label="Submitted" value="pending" />
              <Picker.Item label="Screening" value="reviewing" />
              <Picker.Item label="Interviewing" value="interview" />
              <Picker.Item label="Offer" value="accepted" />
              <Picker.Item label="Rejected" value="rejected" />
            </Picker>
          </View>

          {/* Job Filter */}
          {jobs.length > 0 && (
            <View className="flex-1">
              <Picker
                selectedValue={jobFilter}
                onValueChange={(itemValue) => {
                  setJobFilter(itemValue);
                  fetchApplications();
                }}
                style={{ backgroundColor: '#f3f4f6', borderRadius: 8 }}
              >
                <Picker.Item label="All Jobs" value="all" />
                {jobs.map((job) => (
                  <Picker.Item
                    key={job.jobPostingId}
                    label={job.title}
                    value={job.jobPostingId.toString()}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Sort By */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSortBy('appliedAt')}
            className={`flex-1 px-3 py-2 rounded-lg ${
              sortBy === 'appliedAt' ? 'bg-blue-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-xs font-semibold text-center ${
                sortBy === 'appliedAt' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Sort by Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy('score')}
            className={`flex-1 px-3 py-2 rounded-lg ${
              sortBy === 'score' ? 'bg-blue-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-xs font-semibold text-center ${
                sortBy === 'score' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Sort by Score
            </Text>
          </TouchableOpacity>
        </View>
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
      />
    </SafeAreaView>
  );
}

