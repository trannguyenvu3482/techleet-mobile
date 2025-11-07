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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentAPI, Candidate, GetCandidatesParams , JobPosting } from '@/services/api/recruitment';

interface CandidateListItem {
  candidateId: number;
  fullname: string;
  email: string;
  phoneNumber?: string;
  status?: string;
  createdAt: string;
  score?: number | null;
  applicationId?: number;
  jobTitle?: string;
}

export default function CandidateListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>(params.jobId || 'all');

  const fetchCandidates = useCallback(async (keyword?: string, jobId?: string) => {
    try {
      setLoading(true);
      
      if (jobId && jobId !== 'all') {
        // Fetch candidates by job posting
        const response = await recruitmentAPI.getApplicationsByJobId(Number(jobId));
        const candidateList: CandidateListItem[] = response.data.map((app) => ({
          candidateId: app.candidateId,
          fullname: `${app.firstName} ${app.lastName}`,
          email: app.email,
          status: app.status,
          createdAt: app.createdAt,
          score: app.score,
          applicationId: app.applicationId,
        }));
        
        // Filter by search term if provided
        let filtered = candidateList;
        if (keyword && keyword.trim()) {
          const lowerKeyword = keyword.toLowerCase();
          filtered = candidateList.filter(
            (c) =>
              c.fullname.toLowerCase().includes(lowerKeyword) ||
              c.email.toLowerCase().includes(lowerKeyword)
          );
        }
        
        setCandidates(filtered);
      } else {
        // Fetch all candidates
        const params: GetCandidatesParams = {
          limit: 100,
          keyword: keyword,
        };
        const response = await recruitmentAPI.getCandidates(params);
        
        const candidateList: CandidateListItem[] = response.data.map((candidate: Candidate) => ({
          candidateId: candidate.candidateId,
          fullname: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
          phoneNumber: candidate.phoneNumber,
          createdAt: candidate.createdAt,
        }));
        
        setCandidates(candidateList);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      Alert.alert('Error', 'Failed to load candidates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    const keyword = searchTerm.trim() || undefined;
    const jobId = jobFilter !== 'all' ? jobFilter : undefined;
    fetchCandidates(keyword, jobId);
  }, [jobFilter, fetchCandidates]);

  const onRefresh = () => {
    setRefreshing(true);
    const keyword = searchTerm.trim() || undefined;
    const jobId = jobFilter !== 'all' ? jobFilter : undefined;
    fetchCandidates(keyword, jobId);
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    // Debounce search
    setTimeout(() => {
      const keyword = text.trim() || undefined;
      const jobId = jobFilter !== 'all' ? jobFilter : undefined;
      fetchCandidates(keyword, jobId);
    }, 500);
  };

  const handleCandidatePress = (candidate: CandidateListItem) => {
    router.push(`/recruitment/candidates/${candidate.candidateId}`);
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
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCandidateItem = ({ item }: { item: CandidateListItem }) => (
    <TouchableOpacity
      onPress={() => handleCandidatePress(item)}
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            {item.fullname}
          </Text>
          <Text className="text-sm text-gray-600 mb-1">{item.email}</Text>
          {item.phoneNumber && (
            <Text className="text-sm text-gray-500 mb-1">{item.phoneNumber}</Text>
          )}
          {item.jobTitle && (
            <Text className="text-xs text-blue-600 mt-1">Applied for: {item.jobTitle}</Text>
          )}
        </View>
        {item.status && (
          <View
            className={`px-3 py-1 rounded-full ml-2`}
            style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: getStatusColor(item.status) }}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text className="text-xs text-gray-600 ml-1">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {item.score !== null && item.score !== undefined && (
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
      <Ionicons name="people-outline" size={64} color="#d1d5db" />
      <Text className="text-lg font-semibold text-gray-500 mt-4">
        No candidates found
      </Text>
      <Text className="text-gray-400 mt-2">
        {searchTerm ? 'Try adjusting your search' : 'No candidates available'}
      </Text>
    </View>
  );

  if (loading && candidates.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading candidates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Candidates</Text>
          <TouchableOpacity
            onPress={() => router.push('/recruitment/candidates/form')}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Add</Text>
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
            placeholder="Search candidates..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={handleSearch}
          />
        </View>

        {/* Job Filter */}
        {jobs.length > 0 && (
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity
              onPress={() => setJobFilter('all')}
              className={`px-3 py-2 rounded-lg ${
                jobFilter === 'all' ? 'bg-blue-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  jobFilter === 'all' ? 'text-white' : 'text-gray-600'
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
            {jobs.map((job) => (
              <TouchableOpacity
                key={job.jobPostingId}
                onPress={() => setJobFilter(job.jobPostingId.toString())}
                className={`px-3 py-2 rounded-lg ${
                  jobFilter === job.jobPostingId.toString()
                    ? 'bg-blue-600'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    jobFilter === job.jobPostingId.toString()
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                  numberOfLines={1}
                  style={{ maxWidth: 100 }}
                >
                  {job.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Candidates List */}
      <FlatList
        data={candidates}
        renderItem={renderCandidateItem}
        keyExtractor={(item) => item.candidateId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

