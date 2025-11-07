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
import { recruitmentAPI, Interview } from '@/services/api/recruitment';

export default function InterviewCalendarScreen() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const response = await recruitmentAPI.getInterviews({
        limit: 100,
        sortBy: 'scheduledAt',
        sortOrder: 'ASC',
      });
      // Filter only upcoming interviews (from today onwards, not cancelled)
      const upcoming = response.data.filter((interview) => {
        if (!interview.scheduledAt || interview.status === 'cancelled') return false;
        const interviewDate = new Date(interview.scheduledAt);
        if (isNaN(interviewDate.getTime())) return false;
        // Set time to start of day for comparison
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const interviewStart = new Date(interviewDate.getFullYear(), interviewDate.getMonth(), interviewDate.getDate());
        return interviewStart >= todayStart;
      });
      setInterviews(upcoming);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      Alert.alert('Error', 'Failed to load interviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInterviews();
  };

  const handleInterviewPress = (interview: Interview) => {
    router.push(`/recruitment/interviews/${interview.interviewId}`);
  };

  const handleCreateInterview = () => {
    router.push('/recruitment/interviews/form');
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'scheduled':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      case 'rescheduled':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get most upcoming interview
  const upcomingInterview = interviews.length > 0 ? interviews[0] : null;

  if (loading && interviews.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading interviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Interview Calendar</Text>
          <TouchableOpacity
            onPress={handleCreateInterview}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Quick Stats</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">
                {interviews.filter((i) => i.status === 'scheduled').length}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Scheduled</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                {interviews.filter((i) => i.status === 'completed').length}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-600">
                {interviews.length}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Upcoming</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Most Upcoming Interview */}
      {upcomingInterview && (
        <View className="px-4 pb-2">
          <View className="bg-blue-600 rounded-lg p-4 mb-4 border border-blue-200 shadow-lg">
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Next Interview</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleInterviewPress(upcomingInterview)}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base mb-1">
                Interview #{upcomingInterview.interviewId}
              </Text>
              <Text className="text-blue-100 text-sm mb-2">
                {formatDateTime(upcomingInterview.scheduledAt)}
              </Text>
              {upcomingInterview.location && (
                <View className="flex-row items-center mb-1">
                  <Ionicons name="location-outline" size={14} color="white" />
                  <Text className="text-blue-100 text-xs ml-1">
                    {upcomingInterview.location}
                  </Text>
                </View>
              )}
              {upcomingInterview.meetingUrl && (
                <View className="flex-row items-center">
                  <Ionicons name="videocam-outline" size={14} color="white" />
                  <Text className="text-blue-100 text-xs ml-1">Online</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Upcoming Interviews List */}
      {interviews.length === 0 ? (
        <View className="flex-1 items-center justify-center py-12 px-4">
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text className="text-lg font-semibold text-gray-500 mt-4">
            No upcoming interviews
          </Text>
          <TouchableOpacity
            onPress={handleCreateInterview}
            className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Schedule Interview</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={interviews}
          renderItem={({ item: interview }) => (
            <TouchableOpacity
              onPress={() => handleInterviewPress(interview)}
              className="bg-white rounded-lg p-4 mx-4 mb-3 border border-gray-200 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    Interview #{interview.interviewId}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-1">
                    {formatDateTime(interview.scheduledAt)}
                  </Text>
                  {interview.location && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="location-outline" size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-600 ml-1">
                        {interview.location}
                      </Text>
                    </View>
                  )}
                  {interview.meetingUrl && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="videocam-outline" size={14} color="#6b7280" />
                      <Text className="text-xs text-blue-600 ml-1">Online</Text>
                    </View>
                  )}
                </View>
                <View
                  className={`px-3 py-1 rounded-full ml-2`}
                  style={{ backgroundColor: `${getStatusColor(interview.status)}20` }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getStatusColor(interview.status) }}
                  >
                    {getStatusLabel(interview.status)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
                <Ionicons name="time-outline" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-1">
                  Duration: {interview.duration} minutes
                </Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.interviewId.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        />
      )}
    </SafeAreaView>
  );
}
