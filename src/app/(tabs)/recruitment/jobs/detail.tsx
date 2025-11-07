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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, JobPosting } from '@/services/api/recruitment';

export default function JobDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
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
      Alert.alert('Error', 'Failed to load job details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.id) {
      fetchJob(Number(params.id));
    }
  }, [params.id, fetchJob]);

  const handleDelete = () => {
    if (!job) return;

    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await recruitmentAPI.deleteJobPosting(job.jobPostingId);
              Alert.alert('Success', 'Job posting deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'Failed to delete job posting');
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
      Alert.alert('Success', 'Job posting published successfully');
    } catch (error) {
      console.error('Error publishing job:', error);
      Alert.alert('Error', 'Failed to publish job posting');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!job) return;

    Alert.alert(
      'Close Job',
      'Are you sure you want to close this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          onPress: async () => {
            try {
              setActionLoading(true);
              await recruitmentAPI.closeJobPosting(job.jobPostingId);
              await fetchJob(job.jobPostingId);
              Alert.alert('Success', 'Job posting closed successfully');
            } catch (error) {
              console.error('Error closing job:', error);
              Alert.alert('Error', 'Failed to close job posting');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return '#10b981';
      case 'closed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'closed':
        return 'Closed';
      default:
        return 'Draft';
    }
  };

  const formatSalary = (min: string, max: string) => {
    const minNum = parseFloat(min || '0');
    const maxNum = parseFloat(max || '0');
    if (!minNum && !maxNum) return 'Negotiable';
    if (!minNum) return `Up to ${maxNum.toLocaleString()} VND`;
    if (!maxNum) return `From ${minNum.toLocaleString()} VND`;
    return `${minNum.toLocaleString()} - ${maxNum.toLocaleString()} VND`;
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
      <View className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading job details...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-semibold text-gray-500 mt-4">
            Job not found
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
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              {job.title}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ml-2`}
            style={{ backgroundColor: `${getStatusColor(job.status)}20` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: getStatusColor(job.status) }}
            >
              {getStatusLabel(job.status)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push(`/recruitment/jobs/form?id=${job.jobPostingId}`)}
            className="flex-1 bg-blue-600 px-4 py-2 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">Edit</Text>
          </TouchableOpacity>
          {job.status === 'draft' && (
            <TouchableOpacity
              onPress={handlePublish}
              disabled={actionLoading}
              className="flex-1 bg-green-600 px-4 py-2 rounded-lg flex-row items-center justify-center"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Publish</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {job.status === 'published' && (
            <TouchableOpacity
              onPress={handleClose}
              disabled={actionLoading}
              className="flex-1 bg-orange-600 px-4 py-2 rounded-lg flex-row items-center justify-center"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Close</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={actionLoading}
            className="bg-red-600 px-4 py-2 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="trash-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Quick Info */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <View className="flex-row items-center mb-3">
            <Ionicons name="cash-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2">Salary</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2">Location</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {job.location || 'Not specified'}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="briefcase-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2">Employment Type</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {job.employmentType}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="person-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2">Experience Level</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {job.experienceLevel}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2">Deadline</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {formatDate(job.applicationDeadline)}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="people-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2">Vacancies</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {job.vacancies}
          </Text>

          <TouchableOpacity
            onPress={handleViewApplications}
            className="mt-3 bg-blue-100 px-4 py-3 rounded-lg"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={20} color="#2563eb" />
                <Text className="text-base font-semibold text-blue-600 ml-2">
                  View Applications {job.applicationCount ? `(${job.applicationCount})` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#2563eb" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Description</Text>
          <Text className="text-sm text-gray-700 leading-6">{job.description}</Text>
        </View>

        {/* Requirements */}
        {job.requirements && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Requirements</Text>
            <Text className="text-sm text-gray-700 leading-6">{job.requirements}</Text>
          </View>
        )}

        {/* Benefits */}
        {job.benefits && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Benefits</Text>
            <Text className="text-sm text-gray-700 leading-6">{job.benefits}</Text>
          </View>
        )}


        {/* Metadata */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Additional Info</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Created</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {formatDate(job.createdAt)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Last Updated</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {formatDate(job.updatedAt)}
              </Text>
            </View>
            {job.educationLevel && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Education Level</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {job.educationLevel}
                </Text>
              </View>
            )}
            {job.minExperience !== undefined && job.maxExperience !== undefined && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Experience Range</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {job.minExperience} - {job.maxExperience} years
                </Text>
              </View>
            )}
            {job.skills && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Skills</Text>
                <Text className="text-sm font-semibold text-gray-900 flex-1 text-right">
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

