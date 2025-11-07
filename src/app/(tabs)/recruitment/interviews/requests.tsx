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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Application } from '@/services/api/recruitment';

export default function InterviewRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchRequests = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const response = await recruitmentAPI.getInterviewRequests({ 
        page,
        limit,
      });
      if (append) {
        setRequests((prev) => [...prev, ...response.data]);
      } else {
        setRequests(response.data);
      }
      setTotal(response.total || response.data.length);
    } catch (error) {
      console.error('Error fetching interview requests:', error);
      Alert.alert('Error', 'Failed to load interview requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    if (page === 0) {
      fetchRequests(false);
    } else {
      fetchRequests(true);
    }
  }, [page, fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchRequests(false);
  };

  const handleLoadMore = () => {
    if (requests.length < total && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleRequestPress = (request: Application) => {
    router.push(`/recruitment/interviews/form?applicationId=${request.applicationId}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderRequestItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      onPress={() => handleRequestPress(item)}
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
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>

      {item.screeningScore !== undefined && item.screeningScore !== null && (
        <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
          <Ionicons name="star-outline" size={14} color="#f59e0b" />
          <Text className="text-xs font-semibold text-gray-700 ml-1">
            Screening Score: {item.screeningScore.toFixed(1)}/10
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
      <Text className="text-lg font-semibold text-gray-500 mt-4">
        No interview requests
      </Text>
      <Text className="text-gray-400 mt-2">
        All interview requests have been scheduled
      </Text>
    </View>
  );

  if (loading && requests.length === 0) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading interview requests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Interview Requests</Text>
          <Text className="text-sm text-gray-600">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Requests List */}
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.applicationId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          requests.length < total && requests.length > 0 ? (
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

