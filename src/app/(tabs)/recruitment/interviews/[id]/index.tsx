import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Interview } from '@/services/api/recruitment';

export default function InterviewDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInterview = useCallback(async (interviewId: number) => {
    try {
      setLoading(true);
      const interviewData = await recruitmentAPI.getInterviewById(interviewId);
      setInterview(interviewData);
    } catch (error) {
      console.error('Error fetching interview:', error);
      Alert.alert('Error', 'Failed to load interview details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.id) {
      fetchInterview(Number(params.id));
    }
  }, [params.id, fetchInterview]);

  const handleEdit = () => {
    router.push(`/recruitment/interviews/form?id=${params.id}`);
  };

  const handleViewNotes = () => {
    router.push(`/recruitment/interviews/${params.id}/notes`);
  };

  const handleMarkAsCompleted = async () => {
    if (!interview) return;

    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this interview as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: async () => {
            try {
              await recruitmentAPI.updateInterview(interview.interviewId, {
                status: 'completed',
              });
              Alert.alert('Success', 'Interview marked as completed');
              fetchInterview(interview.interviewId);
            } catch (error) {
              console.error('Error updating interview:', error);
              Alert.alert('Error', 'Failed to update interview');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!interview) return;

    Alert.prompt(
      'Cancel Interview',
      'Please provide a reason for cancellation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async (reason: string | undefined) => {
            try {
              await recruitmentAPI.cancelInterview(interview.interviewId, reason || undefined);
              Alert.alert('Success', 'Interview cancelled');
              fetchInterview(interview.interviewId);
            } catch (error) {
              console.error('Error cancelling interview:', error);
              Alert.alert('Error', 'Failed to cancel interview');
            }
          },
        },
      ],
      'plain-text'
    );
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading interview details...</Text>
        </View>
      </View>
    );
  }

  if (!interview) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-semibold text-gray-500 mt-4">
            Interview not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
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
              Interview #{interview.interviewId}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-1 rounded-full`}
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
          </View>
          <TouchableOpacity onPress={handleEdit} className="ml-2">
            <Ionicons name="create-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Schedule Information */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Schedule</Text>
          
          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 flex-1">Date & Time</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDateTime(interview.scheduledAt)}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 flex-1">Duration</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {interview.duration} minutes
            </Text>
          </View>

          {interview.location && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={20} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Location</Text>
              <Text className="text-sm font-semibold text-gray-900 flex-1 text-right">
                {interview.location}
              </Text>
            </View>
          )}

          {interview.meetingUrl && (
            <TouchableOpacity
              onPress={() => {
                // Open meeting URL
                Alert.alert('Meeting Link', interview.meetingUrl);
              }}
              className="flex-row items-center mb-3"
            >
              <Ionicons name="videocam-outline" size={20} color="#2563eb" />
              <Text className="text-sm text-blue-600 ml-2 flex-1">Meeting Link</Text>
              <Ionicons name="open-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
          )}
        </View>

        {/* Candidate Information */}
        {interview.application?.candidate && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Candidate</Text>
            
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Name</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {interview.application.candidate.firstName}{' '}
                {interview.application.candidate.lastName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push(`/recruitment/candidates/${interview.application?.candidate?.candidateId}`)
              }
              className="flex-row items-center mt-2"
            >
              <Text className="text-sm text-blue-600 ml-6 flex-1">View Candidate Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        )}

        {/* Job Information */}
        {interview.application?.jobPosting && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Job Position</Text>
            
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {interview.application.jobPosting.title}
            </Text>

            {interview.application?.jobPosting?.jobPostingId && (
              <TouchableOpacity
                onPress={() =>
                  router.push(`/recruitment/jobs/detail?id=${interview.application?.jobPosting?.jobPostingId}`)
                }
                className="flex-row items-center mt-2"
              >
                <Text className="text-sm text-blue-600">View Job Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#2563eb" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Interviewer Information */}
        {interview.interviewer && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Interviewer</Text>
            
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Name</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {interview.interviewer.firstName} {interview.interviewer.lastName}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Email</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {interview.interviewer.email}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {interview.notes && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Notes</Text>
            <Text className="text-sm text-gray-700 leading-6">{interview.notes}</Text>
          </View>
        )}

        {/* Feedback */}
        {interview.feedback && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Feedback</Text>
            <Text className="text-sm text-gray-700 leading-6">{interview.feedback}</Text>
            {interview.rating && (
              <View className="flex-row items-center mt-3">
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text className="text-sm font-semibold text-gray-700 ml-1">
                  Rating: {interview.rating}/10
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View className="space-y-3">
          {interview.status !== 'completed' && interview.status !== 'cancelled' && (
            <>
              <TouchableOpacity
                onPress={handleViewNotes}
                className="bg-blue-600 px-6 py-4 rounded-lg"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="document-text-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">View/Edit Notes</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleMarkAsCompleted}
                className="bg-green-600 px-6 py-4 rounded-lg"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Mark as Completed</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancel}
                className="bg-red-600 px-6 py-4 rounded-lg"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="close-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Cancel Interview</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {interview.status === 'completed' && (
            <TouchableOpacity
              onPress={handleViewNotes}
              className="bg-blue-600 px-6 py-4 rounded-lg"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="document-text-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">View Notes</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

