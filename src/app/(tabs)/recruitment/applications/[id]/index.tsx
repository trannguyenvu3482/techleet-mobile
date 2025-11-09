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
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Application, Candidate } from '@/services/api/recruitment';
import { ApproveOfferModal } from '@/components/recruitment/ApproveOfferModal';
import { RejectApplicationModal } from '@/components/recruitment/RejectApplicationModal';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
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
      Alert.alert(tCommon('error'), t('failedToLoadApplicationDetails'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router, t, tCommon]);

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
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
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
        Alert.alert(tCommon('info'), t('noInterviewScheduled'));
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      Alert.alert(tCommon('error'), t('failedToLoadInterview'));
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return colors.textSecondary;
    switch (status.toLowerCase()) {
      case 'hired':
        return colors.success;
      case 'offer':
      case 'offered':
        return colors.primary;
      case 'interviewing':
        return colors.purple;
      case 'screening':
      case 'screening_passed':
        return colors.warning;
      case 'rejected':
      case 'screening_failed':
        return colors.error;
      case 'submitted':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return tCommon('nA');
    return t(`status.${status.toLowerCase()}`);
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
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingApplicationDetails')}</Text>
        </View>
      </View>
    );
  }

  if (!application) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
            {t('applicationNotFound')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">{tCommon('back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {t('application')} #{application.applicationId}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className="px-2 py-1 rounded-full"
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

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
        {/* Candidate Information */}
        {candidate && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('candidate')}</Text>
            
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{tCommon('name')}</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {candidate.firstName} {candidate.lastName}
              </Text>
            </View>

            <View className="flex-row items-center mb-2">
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{tCommon('email')}</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{candidate.email}</Text>
            </View>

            {candidate.phoneNumber && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{t('phone')}</Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {candidate.phoneNumber}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleViewCandidate}
              className="flex-row items-center mt-3 pt-3 border-t"
              style={{ borderTopColor: colors.border }}
            >
              <Text className="text-sm flex-1" style={{ color: colors.primary }}>{t('viewCandidateProfile')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Job Information */}
        {application.jobPosting && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('jobPosition')}</Text>
            
            <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
              {application.jobPosting.title}
            </Text>

            <TouchableOpacity
              onPress={handleViewJob}
              className="flex-row items-center mt-2"
            >
              <Text className="text-sm" style={{ color: colors.primary }}>{t('viewJobDetails')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Application Details */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('applicationDetails')}</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('appliedDate')}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {formatDate(application.appliedAt)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('lastUpdated')}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {formatDate(application.updatedAt)}
            </Text>
          </View>

          {application.score !== undefined && application.score !== null && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('score')}</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text className="text-sm font-semibold ml-1" style={{ color: colors.text }}>
                  {application.score.toFixed(1)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Cover Letter */}
        {application.coverLetter && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('coverLetter')}</Text>
            <Text className="text-sm leading-6" style={{ color: colors.text }}>{application.coverLetter}</Text>
          </View>
        )}

        {/* Actions */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            onPress={handleViewInterview}
            className="px-6 py-4 rounded-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">{t('viewInterview')}</Text>
            </View>
          </TouchableOpacity>

          {canApproveReject && (
            <>
              <TouchableOpacity
                onPress={handleApprove}
                className="px-6 py-4 rounded-lg"
                style={{ backgroundColor: colors.success }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">{t('approveMakeOffer')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReject}
                className="px-6 py-4 rounded-lg"
                style={{ backgroundColor: colors.error }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="close-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">{t('rejectApplication')}</Text>
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

