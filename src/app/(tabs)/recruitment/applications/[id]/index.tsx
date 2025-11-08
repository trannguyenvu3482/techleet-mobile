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
import { recruitmentAPI, Application, Candidate } from '@/services/api/recruitment';
import { ApproveOfferModal } from '@/components/recruitment/ApproveOfferModal';
import { RejectApplicationModal } from '@/components/recruitment/RejectApplicationModal';

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [application, setApplication] = useState<Application | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Validate params first - if id is 'index' or missing, we shouldn't be on this screen
  // This screen should only render for valid numeric IDs
  const applicationId = params.id && params.id !== 'index' && params.id.trim() !== ''
    ? Number(params.id)
    : null;

  const isValidId = applicationId !== null && !isNaN(applicationId) && applicationId > 0;

  // If we're on this route but id is 'index', we're being incorrectly matched
  // Don't redirect here - let the layout handle routing
  const shouldNotBeHere = !params.id || params.id === 'index' || params.id.trim() === '';

  const fetchApplication = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const response = await recruitmentAPI.getApplicationById(id);
      setApplication(response.application);
      setCandidate(response.candidate);
    } catch (error) {
      console.error('Error fetching application:', error);
      Alert.alert('Error', 'Failed to load application details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // If we're on this route but shouldn't be (e.g., id is 'index'), don't do anything
    // The layout should handle routing correctly, but if we end up here, just return early
    if (shouldNotBeHere) {
      // Don't navigate - just return. The component won't render anything.
      // If navigation is needed, it should be handled at a higher level.
      return;
    }
    
    // Only fetch if we have a valid ID
    if (isValidId && applicationId) {
      fetchApplication(applicationId);
    }
  }, [isValidId, applicationId, fetchApplication, router, shouldNotBeHere]);

  // Don't render anything if we shouldn't be here or ID is invalid
  if (shouldNotBeHere || !isValidId) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </View>
    );
  }

  const handleApprove = () => {
    // Show approve dialog with salary and start date inputs
    setShowApproveDialog(true);
  };

  const handleReject = () => {
    // Show reject dialog with optional reason
    setShowRejectDialog(true);
  };

  const handleViewCandidate = () => {
    if (application?.candidateId) {
      router.push(`/recruitment/candidates/${application.candidateId}`);
    }
  };

  const handleViewJob = () => {
    if (application?.jobPostingId) {
      router.push(`/recruitment/jobs/detail?id=${application.jobPostingId}`);
    }
  };

  const handleViewInterview = async () => {
    if (!application) return;
    
    try {
      // Try to find interview for this application
      const interviews = await recruitmentAPI.getInterviews({
        applicationId: application.applicationId,
        limit: 1,
      });
      
      if (interviews.data.length > 0) {
        router.push(`/recruitment/interviews/${interviews.data[0].interviewId}`);
      } else {
        Alert.alert('Info', 'No interview scheduled for this application');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      Alert.alert('Error', 'Failed to load interview');
    }
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
      month: 'long',
      day: 'numeric',
    });
  };

  const canApproveReject =
    application?.applicationStatus === 'interview';

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading application details...</Text>
        </View>
      </View>
    );
  }

  if (!application) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-semibold text-gray-500 mt-4">
            Application not found
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
              Application #{application.applicationId}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-1 rounded-full`}
                style={{ backgroundColor: `${getStatusColor(application.applicationStatus)}20` }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: getStatusColor(application.applicationStatus) }}
                >
                  {getStatusLabel(application.applicationStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Candidate Information */}
        {candidate && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Candidate</Text>
            
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Name</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </Text>
            </View>

            <View className="flex-row items-center mb-2">
              <Ionicons name="mail-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Email</Text>
              <Text className="text-sm font-semibold text-gray-900">{candidate.email}</Text>
            </View>

            {candidate.phoneNumber && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="call-outline" size={18} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2 flex-1">Phone</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {candidate.phoneNumber}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleViewCandidate}
              className="flex-row items-center mt-3 pt-3 border-t border-gray-200"
            >
              <Text className="text-sm text-blue-600 flex-1">View Candidate Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        )}

        {/* Job Information */}
        {application.jobPosting && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Job Position</Text>
            
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {application.jobPosting.title}
            </Text>

            <TouchableOpacity
              onPress={handleViewJob}
              className="flex-row items-center mt-2"
            >
              <Text className="text-sm text-blue-600">View Job Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        )}

        {/* Application Details */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Application Details</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Applied Date</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDate(application.appliedAt)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Last Updated</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDate(application.updatedAt)}
            </Text>
          </View>

          {application.score !== undefined && application.score !== null && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Score</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text className="text-sm font-semibold text-gray-900 ml-1">
                  {application.score.toFixed(1)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Cover Letter */}
        {application.coverLetter && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Cover Letter</Text>
            <Text className="text-sm text-gray-700 leading-6">{application.coverLetter}</Text>
          </View>
        )}

        {/* Actions */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            onPress={handleViewInterview}
            className="bg-blue-600 px-6 py-4 rounded-lg"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">View Interview</Text>
            </View>
          </TouchableOpacity>

          {canApproveReject && (
            <>
              <TouchableOpacity
                onPress={handleApprove}
                className="bg-green-600 px-6 py-4 rounded-lg"
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
      <ApproveOfferModal
        visible={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        applicationId={application.applicationId}
        onSuccess={() => {
          setShowApproveDialog(false);
          fetchApplication(application.applicationId);
        }}
      />

      {/* Reject Dialog */}
      <RejectApplicationModal
        visible={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        applicationId={application.applicationId}
        onSuccess={() => {
          setShowRejectDialog(false);
          fetchApplication(application.applicationId);
        }}
      />
    </View>
  );
}

