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
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentAPI, Application } from '@/services/api/recruitment';

export default function InterviewRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await recruitmentAPI.getInterviewRequests({ limit: 100 });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching interview requests:', error);
      Alert.alert('Error', 'Failed to load interview requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
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
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading interview requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
      />
    </SafeAreaView>
  );
}

