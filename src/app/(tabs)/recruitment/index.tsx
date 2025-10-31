import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProtectedRoute } from '@/hooks';
import { JobCard } from '@/components/ui';
import { JobPostingDto } from '@/types/recruitment';
import { recruitmentAPI } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecruitmentScreen() {
  useProtectedRoute();
  const [jobs, setJobs] = useState<JobPostingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (keyword?: string, status?: string) => {
    try {
      setError(null);
      const response = await recruitmentAPI.getJobPostings({
        keyword,
        status: status === 'all' ? undefined : (status as 'draft' | 'published' | 'closed'),
        page: 0,
        limit: 50,
      });
      setJobs(response.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(searchTerm || undefined, statusFilter);
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    if (text.trim()) {
      setTimeout(() => {
        fetchJobs(text, statusFilter);
      }, 500);
    } else {
      fetchJobs(undefined, statusFilter);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    fetchJobs(searchTerm || undefined, newFilter);
  };

  const handleJobPress = (job: JobPostingDto) => {
    // TODO: Navigate to job detail
    console.log('Press job:', job.jobPostingId);
  };

  const handleEdit = (job: JobPostingDto) => {
    // TODO: Navigate to edit screen
    console.log('Edit job:', job.jobPostingId);
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
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Recruitment</Text>
          <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-semibold">Add Job</Text>
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

        {/* Status Filter */}
        <View className="flex-row gap-2">
          {['all', 'draft', 'published', 'closed'].map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => handleFilterChange(filter)}
              className={`px-3 py-2 rounded-lg ${
                statusFilter === filter ? 'bg-blue-600' : 'bg-gray-100'
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
      />
    </SafeAreaView>
  );
}

