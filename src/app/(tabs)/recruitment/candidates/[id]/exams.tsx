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
import { recruitmentAPI, Examination } from '@/services/api/recruitment';

export default function CandidateExamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; applicationId?: string }>();
  const insets = useSafeAreaInsets();
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = useCallback(async (applicationId: number) => {
    try {
      setLoading(true);
      const examsData = await recruitmentAPI.getExaminationsToDo(applicationId);
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      Alert.alert('Error', 'Failed to load examinations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (params.applicationId) {
      fetchExams(Number(params.applicationId));
    } else {
      // Try to get applicationId from applications
      // For now, show error
      setLoading(false);
      Alert.alert('Error', 'Application ID is required to view exams');
      router.back();
    }
  }, [params.applicationId, fetchExams, router]);

  const onRefresh = () => {
    if (params.applicationId) {
      setRefreshing(true);
      fetchExams(Number(params.applicationId));
    }
  };

  const handleExamPress = (exam: Examination) => {
    router.push(`/recruitment/candidates/${params.id}/exams/${exam.examinationId}`);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderExamItem = ({ item }: { item: Examination }) => (
    <TouchableOpacity
      onPress={() => handleExamPress(item)}
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            Examination #{item.examinationId}
          </Text>
          {item.submittedAt && (
            <Text className="text-sm text-gray-600 mb-1">
              Submitted: {formatDate(item.submittedAt)}
            </Text>
          )}
          <Text className="text-xs text-gray-500">
            Created: {formatDate(item.createdAt)}
          </Text>
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

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center">
          <Ionicons name="document-text-outline" size={14} color="#6b7280" />
          <Text className="text-xs text-gray-600 ml-1">
            {item.examQuestions?.length || 0} questions
          </Text>
        </View>
        {item.totalScore !== null && item.totalScore !== undefined && (
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="text-xs font-semibold text-gray-700 ml-1">
              Score: {item.totalScore.toFixed(1)}/10
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
        No examinations found
      </Text>
      <Text className="text-gray-400 mt-2">
        This application has no examinations yet
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading examinations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Examinations
            </Text>
            <Text className="text-sm text-gray-600">
              {exams.length} examination{exams.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Exams List */}
      <FlatList
        data={exams}
        renderItem={renderExamItem}
        keyExtractor={(item) => item.examinationId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

