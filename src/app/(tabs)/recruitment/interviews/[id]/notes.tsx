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
import { recruitmentAPI, Interview } from '@/services/api/recruitment';
import { ApproveOfferModal } from '@/components/recruitment/ApproveOfferModal';
import { RejectApplicationModal } from '@/components/recruitment/RejectApplicationModal';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function InterviewNotesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
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
      Alert.alert(tCommon('error'), t('failedToLoadInterviewNotes'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router, t, tCommon]);

  useEffect(() => {
    if (params.id) {
      fetchInterview(Number(params.id));
    }
  }, [params.id, fetchInterview]);

  const handleMarkAsCompleted = async () => {
    if (!interview) return;

    Alert.alert(
      t('markAsCompleted'),
      t('markAsCompletedConfirm'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: t('markCompleted'),
          onPress: async () => {
            try {
              await recruitmentAPI.updateInterview(interview.interviewId, {
                status: 'completed',
              });
              Alert.alert(tCommon('success'), t('interviewMarkedCompleted'));
              fetchInterview(interview.interviewId);
            } catch (error) {
              console.error('Error updating interview:', error);
              Alert.alert(tCommon('error'), t('failedToUpdateInterview'));
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
    if (!status) return colors.textSecondary;
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'scheduled':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      case 'rescheduled':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return tCommon('nA');
    return t(`status.${status.toLowerCase()}`);
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingInterviewNotes')}</Text>
        </View>
      </View>
    );
  }

  if (!interview) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
            {t('interviewNotFound')}
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

  const canApproveReject =
    interview.status === 'completed' &&
    applicationStatus === 'interview';

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
              {t('interviewNotes')}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {t('interview')} #{interview.interviewId}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View className="flex-row items-center mb-2">
          <View
            className="px-3 py-1 rounded-full"
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

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
        {/* Interview Information */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('interviewDetails')}</Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{t('scheduledAt')}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {formatDateTime(interview.scheduledAt)}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{t('duration')}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {interview.duration} {t('minutes')}
            </Text>
          </View>

          {interview.location && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{t('location')}</Text>
              <Text className="text-sm font-semibold flex-1 text-right" style={{ color: colors.text }}>
                {interview.location}
              </Text>
            </View>
          )}

          {interview.meetingUrl && (
            <View className="flex-row items-center">
              <Ionicons name="videocam-outline" size={18} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.primary }}>{t('meetingLink')}</Text>
              <Text className="text-xs" style={{ color: colors.primary }} numberOfLines={1}>
                {interview.meetingUrl}
              </Text>
            </View>
          )}
        </View>

        {/* Candidate Information */}
        {interview.application?.candidate && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('candidate')}</Text>
            <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
              {interview.application.candidate.firstName}{' '}
              {interview.application.candidate.lastName}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/recruitment/candidates/${interview.application?.candidate?.candidateId}`)
              }
              className="flex-row items-center mt-2"
            >
              <Text className="text-sm" style={{ color: colors.primary }}>{t('viewCandidateProfile')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('interviewNotes')}</Text>
          {interview.notes ? (
            <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="text-sm leading-6" style={{ color: colors.text }}>{interview.notes}</Text>
            </View>
          ) : (
            <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="text-sm italic" style={{ color: colors.textSecondary }}>{t('noNotesAvailable')}</Text>
            </View>
          )}
        </View>

        {/* Feedback Section */}
        {interview.feedback && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('feedback')}</Text>
            <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="text-sm leading-6" style={{ color: colors.text }}>{interview.feedback}</Text>
            </View>
            {interview.rating !== undefined && interview.rating !== null && (
              <View className="flex-row items-center mt-3">
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text className="text-sm font-semibold ml-1" style={{ color: colors.text }}>
                  {t('rating')}: {interview.rating}/10
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
              className="px-6 py-4 rounded-lg"
              style={{ backgroundColor: colors.success }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">{t('markAsCompleted')}</Text>
              </View>
            </TouchableOpacity>
          )}

          {canApproveReject && (
            <>
              <TouchableOpacity
                onPress={handleApprove}
                className="px-6 py-4 rounded-lg"
                style={{ backgroundColor: colors.primary }}
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
    </View>
  );
}

