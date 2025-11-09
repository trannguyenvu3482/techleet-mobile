import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, JobPosting } from '@/services/api/recruitment';
import { shareService } from '@/utils/share';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function JobDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJob = useCallback(async (jobId: number) => {
    try {
      setLoading(true);
      const jobData = await recruitmentAPI.getJobPostingById(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('Error fetching job:', error);
      Alert.alert(tCommon('error'), t('failedToLoadJobDetails'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router, t, tCommon]);

  useEffect(() => {
    if (params.id) {
      fetchJob(Number(params.id));
    }
  }, [params.id, fetchJob]);

  const handleDelete = () => {
    if (!job) return;

    Alert.alert(
      t('deleteJob'),
      t('deleteJobConfirm'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: tCommon('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await recruitmentAPI.deleteJobPosting(job.jobPostingId);
              Alert.alert(tCommon('success'), t('jobDeletedSuccessfully'));
              router.back();
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert(tCommon('error'), t('failedToDeleteJob'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePublish = async () => {
    if (!job) return;

    try {
      setActionLoading(true);
      await recruitmentAPI.publishJobPosting(job.jobPostingId);
      await fetchJob(job.jobPostingId);
      Alert.alert(tCommon('success'), t('jobPublishedSuccessfully'));
    } catch (error) {
      console.error('Error publishing job:', error);
      Alert.alert(tCommon('error'), t('failedToPublishJob'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!job) return;

    Alert.alert(
      t('closeJob'),
      t('closeJobConfirm'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: t('close'),
          onPress: async () => {
            try {
              setActionLoading(true);
              await recruitmentAPI.closeJobPosting(job.jobPostingId);
              await fetchJob(job.jobPostingId);
              Alert.alert(tCommon('success'), t('jobClosedSuccessfully'));
            } catch (error) {
              console.error('Error closing job:', error);
              Alert.alert(tCommon('error'), t('failedToCloseJob'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewApplications = () => {
    if (!job) return;
    router.push(`/recruitment/jobs/${job.jobPostingId}/applications`);
  };

  const handleShare = async () => {
    if (!job) return;
    await shareService.shareJob(job);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return colors.success;
      case 'closed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return t('published');
      case 'closed':
        return t('closed');
      default:
        return t('draft');
    }
  };

  const formatSalary = (min: string, max: string) => {
    const minNum = parseFloat(min || '0');
    const maxNum = parseFloat(max || '0');
    if (!minNum && !maxNum) return t('negotiable');
    if (!minNum) return t('salaryUpTo', { amount: maxNum.toLocaleString() });
    if (!maxNum) return t('salaryFrom', { amount: minNum.toLocaleString() });
    return t('salaryRange', { min: minNum.toLocaleString(), max: maxNum.toLocaleString() });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingJobDetails')}</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
            {t('jobNotFound')}
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
      <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: colors.text }} numberOfLines={1}>
              {job.title}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full ml-2"
            style={{ backgroundColor: `${getStatusColor(job.status)}20` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: getStatusColor(job.status) }}
            >
              {getStatusLabel(job.status)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleShare} className="ml-3 p-2">
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push(`/recruitment/jobs/form?id=${job.jobPostingId}`)}
            className="flex-1 px-4 py-2 rounded-lg flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">{tCommon('edit')}</Text>
          </TouchableOpacity>
          {job.status === 'draft' && (
            <TouchableOpacity
              onPress={handlePublish}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 rounded-lg flex-row items-center justify-center"
              style={{ backgroundColor: colors.secondary }}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">{t('publish')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {job.status === 'published' && (
            <TouchableOpacity
              onPress={handleClose}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 rounded-lg flex-row items-center justify-center"
              style={{ backgroundColor: colors.warning }}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">{t('close')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg flex-row items-center justify-center"
            style={{ backgroundColor: colors.error }}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
        {/* Quick Info */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <View className="flex-row items-center mb-3">
            <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>{t('salary')}</Text>
          </View>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            {formatSalary(job.salaryMin, job.salaryMax)}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>{t('location')}</Text>
          </View>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            {job.location || t('notSpecified')}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>{t('employmentType')}</Text>
          </View>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            {job.employmentType}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>{t('experienceLevel')}</Text>
          </View>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            {job.experienceLevel}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>{t('deadline')}</Text>
          </View>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            {formatDate(job.applicationDeadline)}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
            <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>{t('vacancies')}</Text>
          </View>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            {job.vacancies}
          </Text>

          <TouchableOpacity
            onPress={handleViewApplications}
            className="mt-3 px-4 py-3 rounded-lg"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                <Text className="text-base font-semibold ml-2" style={{ color: colors.primary }}>
                  {t('viewApplications')} {job.applicationCount ? `(${job.applicationCount})` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('description')}</Text>
          <Text className="text-sm leading-6" style={{ color: colors.text }}>{job.description}</Text>
        </View>

        {/* Requirements */}
        {job.requirements && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('requirements')}</Text>
            <Text className="text-sm leading-6" style={{ color: colors.text }}>{job.requirements}</Text>
          </View>
        )}

        {/* Benefits */}
        {job.benefits && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('benefits')}</Text>
            <Text className="text-sm leading-6" style={{ color: colors.text }}>{job.benefits}</Text>
          </View>
        )}


        {/* Metadata */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('additionalInfo')}</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('created')}</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {formatDate(job.createdAt)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('lastUpdated')}</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {formatDate(job.updatedAt)}
              </Text>
            </View>
            {job.educationLevel && (
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('educationLevel')}</Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {job.educationLevel}
                </Text>
              </View>
            )}
            {job.minExperience !== undefined && job.maxExperience !== undefined && (
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('experienceRange')}</Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {job.minExperience} - {job.maxExperience} {t('years')}
                </Text>
              </View>
            )}
            {job.skills && (
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('skills')}</Text>
                <Text className="text-sm font-semibold flex-1 text-right" style={{ color: colors.text }}>
                  {job.skills}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

