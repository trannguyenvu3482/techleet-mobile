import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Interview } from '@/services/api/recruitment';
import { shareService } from '@/utils/share';
import { calendarService } from '@/services/calendar';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function InterviewDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarEventId, setCalendarEventId] = useState<string | null>(null);

  const checkCalendarEvent = useCallback(async (interviewData: Interview) => {
    try {
      const startDate = new Date(interviewData.scheduledAt);
      const endDate = new Date(startDate.getTime() + interviewData.duration * 60 * 1000);
      const events = await calendarService.getEventsInRange(startDate, endDate);
      
      const candidateName = interviewData.application?.candidate
        ? `${interviewData.application.candidate.firstName} ${interviewData.application.candidate.lastName}`
        : t('unknownCandidate');
      const jobTitle = interviewData.application?.jobPosting?.title || t('unknownPosition');
      const expectedTitle = `${t('interview')}: ${candidateName} - ${jobTitle}`;
      
      const matchingEvent = events.find((event) => event.title === expectedTitle);
      if (matchingEvent) {
        setCalendarEventId(matchingEvent.id);
      }
    } catch (error) {
      console.error('Error checking calendar event:', error);
    }
  }, []);

  const fetchInterview = useCallback(async (interviewId: number) => {
    try {
      setLoading(true);
      const interviewData = await recruitmentAPI.getInterviewById(interviewId);
      setInterview(interviewData);
      
      if (interviewData) {
        await checkCalendarEvent(interviewData);
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      Alert.alert(tCommon('error'), t('failedToLoadInterviewDetails'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router, checkCalendarEvent, t, tCommon]);

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

  const handleShare = async () => {
    if (!interview) return;
    await shareService.shareInterview(interview);
  };

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

  const handleCancel = async () => {
    if (!interview) return;

    Alert.prompt(
      t('cancelInterview'),
      t('cancelInterviewConfirm'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: tCommon('confirm'),
          onPress: async (reason: string | undefined) => {
            try {
              await recruitmentAPI.cancelInterview(interview.interviewId, reason || undefined);
              Alert.alert(tCommon('success'), t('interviewCancelled'));
              fetchInterview(interview.interviewId);
            } catch (error) {
              console.error('Error cancelling interview:', error);
              Alert.alert(tCommon('error'), t('failedToCancelInterview'));
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleAddToCalendar = async () => {
    if (!interview) return;
    try {
      const startDate = new Date(interview.scheduledAt);
      const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);
      const candidateName = interview.application?.candidate
        ? `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`
        : t('unknownCandidate');
      const jobTitle = interview.application?.jobPosting?.title || t('unknownPosition');
      const title = `${t('interview')}: ${candidateName} - ${jobTitle}`;
      const eventId = await calendarService.createEvent({
        title,
        startDate,
        endDate,
        location: interview.location,
        notes: interview.notes,
      });
      setCalendarEventId(eventId);
      Alert.alert(tCommon('success'), t('addToCalendar'));
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(tCommon('error'), t('failedToAddToCalendar'));
    }
  };

  const handleRemoveFromCalendar = async () => {
    if (!interview || !calendarEventId) return;
    try {
      await calendarService.deleteEvent(calendarEventId);
      setCalendarEventId(null);
      Alert.alert(tCommon('success'), t('removeFromCalendar'));
    } catch (error) {
      console.error('Error removing from calendar:', error);
      Alert.alert(tCommon('error'), t('failedToRemoveFromCalendar'));
    }
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
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingInterviewDetails')}</Text>
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
              {t('interview')} #{interview.interviewId}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className="px-2 py-1 rounded-full"
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
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={handleShare} className="p-2">
              <Ionicons name="share-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEdit} className="p-2">
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
        {/* Schedule Information */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('schedule')}</Text>
          
          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{t('dateTime')}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {formatDateTime(interview.scheduledAt)}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{t('duration')}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {interview.duration} {t('minutes')}
            </Text>
          </View>

          {interview.location && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{t('location')}</Text>
              <Text className="text-sm font-semibold flex-1 text-right" style={{ color: colors.text }}>
                {interview.location}
              </Text>
            </View>
          )}

          {interview.meetingUrl && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(t('meetingLink'), interview.meetingUrl);
              }}
              className="flex-row items-center mb-3"
            >
              <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.primary }}>{t('meetingLink')}</Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Candidate Information */}
        {interview.application?.candidate && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('candidate')}</Text>
            
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{tCommon('name')}</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
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
              <Text className="text-sm ml-6 flex-1" style={{ color: colors.primary }}>{t('viewCandidateProfile')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Job Information */}
        {interview.application?.jobPosting && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('jobPosition')}</Text>
            
            <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
              {interview.application.jobPosting.title}
            </Text>

            {interview.application?.jobPosting?.jobPostingId && (
              <TouchableOpacity
                onPress={() =>
                  router.push(`/recruitment/jobs/detail?id=${interview.application?.jobPosting?.jobPostingId}`)
                }
                className="flex-row items-center mt-2"
              >
                <Text className="text-sm" style={{ color: colors.primary }}>{t('viewJobDetails')}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Interviewer Information */}
        {interview.interviewer && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('interviewers')}</Text>
            
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{tCommon('name')}</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {interview.interviewer.firstName} {interview.interviewer.lastName}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>{tCommon('email')}</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {interview.interviewer.email}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {interview.notes && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{tCommon('notes')}</Text>
            <Text className="text-sm leading-6" style={{ color: colors.text }}>{interview.notes}</Text>
          </View>
        )}

        {/* Feedback */}
        {interview.feedback && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('feedback')}</Text>
            <Text className="text-sm leading-6" style={{ color: colors.text }}>{interview.feedback}</Text>
            {interview.rating && (
              <View className="flex-row items-center mt-3">
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text className="text-sm font-semibold ml-1" style={{ color: colors.text }}>
                  {t('rating')}: {interview.rating}/10
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Calendar Actions */}
        <View className="mb-4">
          {calendarEventId ? (
            <TouchableOpacity
              onPress={handleRemoveFromCalendar}
              className="px-6 py-4 rounded-lg"
              style={{ backgroundColor: colors.orange }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">{t('removeFromCalendar')}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleAddToCalendar}
              className="px-6 py-4 rounded-lg"
              style={{ backgroundColor: colors.purple }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">{t('addToCalendar')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View className="space-y-3">
          {interview.status !== 'completed' && interview.status !== 'cancelled' && (
            <>
              <TouchableOpacity
                onPress={handleViewNotes}
                className="px-6 py-4 rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="document-text-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">{t('viewEditNotes')}</Text>
                </View>
              </TouchableOpacity>

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

              <TouchableOpacity
                onPress={handleCancel}
                className="px-6 py-4 rounded-lg"
                style={{ backgroundColor: colors.error }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="close-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">{t('cancelInterview')}</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {interview.status === 'completed' && (
            <TouchableOpacity
              onPress={handleViewNotes}
              className="px-6 py-4 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="document-text-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">{t('viewNotes')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

