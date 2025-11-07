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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, JobPosting } from '@/services/api/recruitment';

interface Application {
  applicationId: number;
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  score: number | null;
}

export default function JobApplicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchJob = useCallback(async (jobId: number) => {
    try {
      const jobData = await recruitmentAPI.getJobPostingById(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('Error fetching job:', error);
      Alert.alert('Error', 'Failed to load job details');
    }
  }, []);

  const fetchApplications = useCallback(async (jobId: number) => {
    try {
      setRefreshing(true);
      const response = await recruitmentAPI.getApplicationsByJobId(jobId);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      const jobId = Number(params.id);
      fetchJob(jobId);
      fetchApplications(jobId);
    }
  }, [params.id, fetchJob, fetchApplications]);

  const onRefresh = () => {
    if (params.id) {
      fetchApplications(Number(params.id));
    }
  };

  const handleApplicationPress = (application: Application) => {
    router.push(`/recruitment/candidates/${application.candidateId}`);
  };

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      onPress={() => handleApplicationPress(item)}
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            {item.firstName} {item.lastName}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">{item.email}</Text>
        </View>
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
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text className="text-xs text-gray-600 ml-1">
            Applied {formatDate(item.createdAt)}
          </Text>
        </View>
        {item.score !== null && (
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
        {statusFilter === 'all'
          ? 'This job posting has no applications yet'
          : `No applications with status: ${statusFilter}`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading applications...</Text>
        </View>
      </View>
    );
  }

  const uniqueStatuses = Array.from(new Set(applications.map(app => app.status.toLowerCase())));

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              {job?.title || 'Applications'}
            </Text>
            <Text className="text-sm text-gray-600">
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Status Filter */}
        {uniqueStatuses.length > 0 && (
          <View className="flex-row gap-2 flex-wrap">
            <TouchableOpacity
              onPress={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-lg ${
                statusFilter === 'all' ? 'bg-blue-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  statusFilter === 'all' ? 'text-white' : 'text-gray-600'
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
            {uniqueStatuses.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg ${
                  statusFilter === status ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    statusFilter === status ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.applicationId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

