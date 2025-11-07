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
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentAPI, Interview } from '@/services/api/recruitment';
import { ApproveOfferModal } from '@/components/recruitment/approve-offer-modal';
import { RejectApplicationModal } from '@/components/recruitment/reject-application-modal';

export default function InterviewNotesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const fetchInterview = useCallback(async (interviewId: number) => {
    try {
      setLoading(true);
      const interviewData = await recruitmentAPI.getInterviewById(interviewId);
      setInterview(interviewData);

      // Fetch application status
      if (interviewData.applicationId) {
        try {
          const application = await recruitmentAPI.getApplicationById(interviewData.applicationId);
          setApplicationStatus(application.application.applicationStatus || null);
        } catch (err) {
          console.error('Failed to fetch application status:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      Alert.alert('Error', 'Failed to load interview notes');
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

  const handleApprove = () => {
    if (!interview || !interview.applicationId) return;
    setShowApproveDialog(true);
  };

  const handleReject = () => {
    if (!interview || !interview.applicationId) return;
    setShowRejectDialog(true);
  };

  const handleApproveSuccess = () => {
    setShowApproveDialog(false);
    if (interview) {
      fetchInterview(interview.interviewId);
    }
  };

  const handleRejectSuccess = () => {
    setShowRejectDialog(false);
    if (interview) {
      fetchInterview(interview.interviewId);
    }
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading interview notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!interview) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
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
      </SafeAreaView>
    );
  }

  const canApproveReject =
    interview.status === 'completed' &&
    applicationStatus === 'interview';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Interview Notes
            </Text>
            <Text className="text-sm text-gray-600">
              Interview #{interview.interviewId}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View className="flex-row items-center mb-2">
          <View
            className={`px-3 py-1 rounded-full`}
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

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Interview Information */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Interview Details</Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={18} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 flex-1">Scheduled At</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDateTime(interview.scheduledAt)}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={18} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 flex-1">Duration</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {interview.duration} minutes
            </Text>
          </View>

          {interview.location && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Location</Text>
              <Text className="text-sm font-semibold text-gray-900 flex-1 text-right">
                {interview.location}
              </Text>
            </View>
          )}

          {interview.meetingUrl && (
            <View className="flex-row items-center">
              <Ionicons name="videocam-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-blue-600 ml-2 flex-1">Meeting Link</Text>
              <Text className="text-xs text-blue-600" numberOfLines={1}>
                {interview.meetingUrl}
              </Text>
            </View>
          )}
        </View>

        {/* Candidate Information */}
        {interview.application?.candidate && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Candidate</Text>
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {interview.application.candidate.firstName}{' '}
              {interview.application.candidate.lastName}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/recruitment/candidates/${interview.application?.candidate?.candidateId}`)
              }
              className="flex-row items-center mt-2"
            >
              <Text className="text-sm text-blue-600">View Candidate Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Interview Notes</Text>
          {interview.notes ? (
            <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Text className="text-sm text-gray-900 leading-6">{interview.notes}</Text>
            </View>
          ) : (
            <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Text className="text-sm text-gray-500 italic">No notes available</Text>
            </View>
          )}
        </View>

        {/* Feedback Section */}
        {interview.feedback && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Feedback</Text>
            <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Text className="text-sm text-gray-900 leading-6">{interview.feedback}</Text>
            </View>
            {interview.rating !== undefined && interview.rating !== null && (
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
        <View className="space-y-3 mb-6">
          {interview.status !== 'completed' && interview.status !== 'cancelled' && (
            <TouchableOpacity
              onPress={handleMarkAsCompleted}
              className="bg-green-600 px-6 py-4 rounded-lg"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Mark as Completed</Text>
              </View>
            </TouchableOpacity>
          )}

          {canApproveReject && (
            <>
              <TouchableOpacity
                onPress={handleApprove}
                className="bg-blue-600 px-6 py-4 rounded-lg"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Approve & Make Offer</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReject}
                className="bg-red-600 px-6 py-4 rounded-lg"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="close-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Reject Application</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Approve Dialog */}
      {interview.applicationId && (
        <>
          <ApproveOfferModal
            visible={showApproveDialog}
            onClose={() => setShowApproveDialog(false)}
            applicationId={interview.applicationId}
            onSuccess={handleApproveSuccess}
          />

          {/* Reject Dialog */}
          <RejectApplicationModal
            visible={showRejectDialog}
            onClose={() => setShowRejectDialog(false)}
            applicationId={interview.applicationId}
            onSuccess={handleRejectSuccess}
          />
        </>
      )}
    </SafeAreaView>
  );
}

