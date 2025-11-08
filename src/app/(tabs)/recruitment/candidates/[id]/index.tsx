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
import { recruitmentAPI, Candidate, Application, CandidateFile } from '@/services/api/recruitment';
import { shareService } from '@/utils/share';

export default function CandidateDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [files, setFiles] = useState<CandidateFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [screeningScore, setScreeningScore] = useState<number | null>(null);

  const fetchCandidate = useCallback(async (candidateId: number) => {
    try {
      setLoading(true);
      console.log('Fetching candidate with ID:', candidateId);
      const candidateData = await recruitmentAPI.getCandidateById(candidateId);
      console.log('Candidate data received:', JSON.stringify(candidateData, null, 2));
      
      if (!candidateData || (typeof candidateData === 'object' && Object.keys(candidateData).length === 0)) {
        console.error('Candidate data is null, undefined, or empty');
        throw new Error('Candidate not found');
      }
      
      // Check if candidateData has required fields
      if (!candidateData.candidateId && !candidateData.email) {
        console.error('Candidate data missing required fields:', candidateData);
        throw new Error('Invalid candidate data received');
      }
      
      setCandidate(candidateData);

      // Fetch applications for this candidate
      try {
        const appsResponse = await recruitmentAPI.getApplications({
          candidateId: candidateId,
          limit: 100,
        });
        setApplications(appsResponse.data);

        // Get screening score from most recent application
        if (appsResponse.data.length > 0) {
          const latestApp = appsResponse.data[0];
          if (latestApp.score !== undefined && latestApp.score !== null) {
            setScreeningScore(latestApp.score);
          }
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      }

      // Fetch candidate files
      try {
        const filesData = await recruitmentAPI.getCandidateFiles(candidateId);
        setFiles(filesData);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load candidate details';
      setLoading(false);
      setCandidate(null); // Ensure candidate is null on error
      // Don't navigate back automatically, let user see the error
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check if params.id is valid
    if (!params.id) {
      setLoading(false);
      setCandidate(null);
      return;
    }

    // Check if params.id is 'index' - this means we're on the wrong route
    if (params.id === 'index') {
      setLoading(false);
      setCandidate(null);
      // Navigate back to candidates list
      setTimeout(() => {
        router.replace('/recruitment/candidates');
      }, 100);
      return;
    }

    const candidateId = Number(params.id);
    if (isNaN(candidateId) || candidateId <= 0) {
      setLoading(false);
      setCandidate(null);
      Alert.alert('Error', `Invalid candidate ID: ${params.id}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    fetchCandidate(candidateId);
  }, [params.id, fetchCandidate, router]);

  const handleViewExams = () => {
    // Need applicationId to view exams - use first application if available
    if (applications.length > 0) {
      router.push(`/recruitment/candidates/${params.id}/exams?applicationId=${applications[0].applicationId}`);
    } else {
      Alert.alert('Info', 'No applications found for this candidate');
    }
  };

  const handleScheduleInterview = (application?: Application) => {
    if (application && application.applicationId) {
      router.push(`/recruitment/interviews/form?applicationId=${application.applicationId}`);
    } else if (applications.length > 0) {
      router.push(`/recruitment/interviews/form?applicationId=${applications[0].applicationId}`);
    } else {
      Alert.alert('Info', 'No applications found for this candidate');
    }
  };

  const handleShare = async () => {
    if (!candidate) return;
    await shareService.shareCandidate(candidate);
  };

  const handleOpenUrl = (url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      Linking.openURL(url).catch((err) => {
        console.error('Error opening URL:', err);
        Alert.alert('Error', 'Failed to open URL');
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading candidate details...</Text>
        </View>
      </View>
    );
  }

  if (!candidate && !loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-semibold text-gray-500 mt-4">
            Candidate not found
          </Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">
            {params.id ? `ID: ${params.id}` : 'No candidate ID provided'}
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

  const fullName = `${candidate.firstName} ${candidate.lastName}`;

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
              {fullName}
            </Text>
            <Text className="text-sm text-gray-600">{candidate.email}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={handleShare} className="p-2">
              <Ionicons name="share-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/recruitment/candidates/form?id=${candidate.candidateId}`)}
              className="p-2"
            >
              <Ionicons name="create-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleViewExams}
            className="flex-1 bg-blue-600 px-4 py-2 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="document-text-outline" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">View Exams</Text>
          </TouchableOpacity>
          {applications.length > 0 && (
            <TouchableOpacity
              onPress={() => handleScheduleInterview()}
              className="flex-1 bg-green-600 px-4 py-2 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="calendar-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Schedule</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Contact Information */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Contact Information</Text>
          
          <View className="flex-row items-center mb-2">
            <Ionicons name="mail-outline" size={18} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 flex-1">Email</Text>
            <Text className="text-sm font-semibold text-gray-900">{candidate.email}</Text>
          </View>

          {candidate.phoneNumber && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="call-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Phone</Text>
              <Text className="text-sm font-semibold text-gray-900">{candidate.phoneNumber}</Text>
            </View>
          )}

          {candidate.address && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="location-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">Address</Text>
              <Text className="text-sm font-semibold text-gray-900 flex-1 text-right">
                {candidate.address}
              </Text>
            </View>
          )}

          {candidate.city && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="business-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">City</Text>
              <Text className="text-sm font-semibold text-gray-900">{candidate.city}</Text>
            </View>
          )}

          {candidate.linkedinUrl && (
            <TouchableOpacity
              onPress={() => handleOpenUrl(candidate.linkedinUrl!)}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="logo-linkedin" size={18} color="#0077b5" />
              <Text className="text-sm text-blue-600 ml-2 flex-1">LinkedIn</Text>
              <Ionicons name="open-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
          )}

          {candidate.portfolioUrl && (
            <TouchableOpacity
              onPress={() => handleOpenUrl(candidate.portfolioUrl!)}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="globe-outline" size={18} color="#6b7280" />
              <Text className="text-sm text-blue-600 ml-2 flex-1">Portfolio</Text>
              <Ionicons name="open-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
          )}
        </View>

        {/* Skills & Experience */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Skills & Experience</Text>
          
          {candidate.skills && (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Skills</Text>
              <Text className="text-sm text-gray-900">{candidate.skills}</Text>
            </View>
          )}

          {candidate.workExperience && (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Work Experience</Text>
              <Text className="text-sm text-gray-900">{candidate.workExperience}</Text>
            </View>
          )}

          {candidate.education && (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Education</Text>
              <Text className="text-sm text-gray-900">{candidate.education}</Text>
            </View>
          )}

          {candidate.certifications && (
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-1">Certifications</Text>
              <Text className="text-sm text-gray-900">{candidate.certifications}</Text>
            </View>
          )}

          {screeningScore !== null && screeningScore !== undefined && (
            <View className="mt-3 pt-3 border-t border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-700">Screening Score</Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text className="text-sm font-bold text-gray-900 ml-1">
                    {typeof screeningScore === 'number' ? screeningScore.toFixed(1) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Resume */}
        {candidate.resumeUrl && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Resume</Text>
            <TouchableOpacity
              onPress={() => handleOpenUrl(candidate.resumeUrl!)}
              className="flex-row items-center justify-between bg-blue-50 px-4 py-3 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-text-outline" size={24} color="#2563eb" />
                <Text className="text-sm font-semibold text-blue-600 ml-3">
                  View Resume
                </Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        )}

        {/* Files */}
        {files.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Files</Text>
            {files.map((file) => (
              <View
                key={file.fileId}
                className="flex-row items-center justify-between bg-gray-50 px-4 py-3 rounded-lg mb-2"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="document-outline" size={20} color="#6b7280" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold text-gray-700" numberOfLines={1}>
                      {file.fileName || file.originalName}
                    </Text>
                    {file.fileSize && (
                      <Text className="text-xs text-gray-500 mt-1">
                        {file.fileSize}
                      </Text>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  {file.fileUrl && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleOpenUrl(file.fileUrl)}
                        className="p-2"
                      >
                        <Ionicons name="eye-outline" size={18} color="#2563eb" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDownloadFile(file)}
                        className="p-2"
                      >
                        <Ionicons name="download-outline" size={18} color="#10b981" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Applications */}
        {applications.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Applications ({applications.length})
            </Text>
            {applications.map((app) => (
              <TouchableOpacity
                key={app.applicationId}
                onPress={() => router.push(`/recruitment/jobs/detail?id=${app.jobPostingId}`)}
                className="border border-gray-200 rounded-lg p-3 mb-2"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 mb-1">
                      Application #{app.applicationId}
                    </Text>
                    <Text className="text-xs text-gray-600">
                      {formatDate(app.appliedAt)}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full`}
                    style={{ backgroundColor: `${getStatusColor(app.applicationStatus)}20` }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: getStatusColor(app.applicationStatus) }}
                    >
                      {getStatusLabel(app.applicationStatus)}
                    </Text>
                  </View>
                </View>
                {app.score !== undefined && app.score !== null && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="star-outline" size={14} color="#f59e0b" />
                    <Text className="text-xs font-semibold text-gray-700 ml-1">
                      Score: {typeof app.score === 'number' ? app.score.toFixed(1) : 'N/A'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Metadata */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Additional Info</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Created</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDate(candidate.createdAt)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Last Updated</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDate(candidate.updatedAt)}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Active</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {candidate.isActive ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
        </ScrollView>
      </View>
    );
  }

