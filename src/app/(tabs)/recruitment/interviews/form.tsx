import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  recruitmentAPI,
  Interview,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  Application,
} from '@/services/api/recruitment';
import { employeeAPI } from '@/services/api/employees';
import { EmployeeResponseDto } from '@/types/employee';
import { companyAPI, Headquarter } from '@/services/api/company';

export default function InterviewFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; applicationId?: string }>();
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [interviewers, setInterviewers] = useState<EmployeeResponseDto[]>([]);
  const [headquarters, setHeadquarters] = useState<Headquarter[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedInterviewers, setSelectedInterviewers] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    candidateId: 0,
    jobId: 0,
    scheduledDate: new Date(),
    scheduledTime: new Date(),
    duration: 60,
    interviewType: 'online' as 'online' | 'offline',
    location: '',
    meetingUrl: '',
    notes: '',
  });

  const generateMeetingLink = () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    return `https://meet.google.com/${randomId}`;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load employees and headquarters
      const [employeesRes, headquartersRes] = await Promise.all([
        employeeAPI.getEmployees({ limit: 100, isActive: true }),
        companyAPI.getHeadquarters({ limit: 100, isActive: true }),
      ]);

      setInterviewers(employeesRes.data);
      setHeadquarters(headquartersRes.data);

      // If editing, load interview data
      if (isEdit && params.id) {
        const interviewData = await recruitmentAPI.getInterviewById(Number(params.id));
        setInterview(interviewData);

        const scheduledDate = new Date(interviewData.scheduledAt);
        setFormData({
          candidateId: interviewData.application?.candidate?.candidateId || 0,
          jobId: interviewData.application?.jobPostingId || 0,
          scheduledDate: scheduledDate,
          scheduledTime: scheduledDate,
          duration: interviewData.duration,
          interviewType: interviewData.meetingUrl ? 'online' : 'offline',
          location: interviewData.location || '',
          meetingUrl: interviewData.meetingUrl || '',
          notes: interviewData.notes || '',
        });

        // Set selected interviewers (assuming single interviewer for now)
        if (interviewData.interviewerUserId) {
          setSelectedInterviewers([interviewData.interviewerUserId]);
        }
      }

      // If creating from application, load application data
      if (!isEdit && params.applicationId) {
        const appResponse = await recruitmentAPI.getApplicationById(Number(params.applicationId));
        setApplication(appResponse.application);
        setFormData((prev) => ({
          ...prev,
          candidateId: appResponse.application.candidateId,
          jobId: appResponse.application.jobPostingId,
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load form data');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [isEdit, params.id, params.applicationId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(formData.scheduledTime.getHours());
      newDate.setMinutes(formData.scheduledTime.getMinutes());
      handleInputChange('scheduledDate', newDate);
      handleInputChange('scheduledTime', newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(formData.scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      handleInputChange('scheduledTime', newDate);
      handleInputChange('scheduledDate', newDate);
    }
  };

  const toggleInterviewer = (employeeId: number) => {
    setSelectedInterviewers((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const validateForm = (): boolean => {
    if (formData.candidateId === 0) {
      Alert.alert('Validation Error', 'Please select a candidate');
      return false;
    }
    if (formData.jobId === 0) {
      Alert.alert('Validation Error', 'Please select a job');
      return false;
    }
    if (selectedInterviewers.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one interviewer');
      return false;
    }
    if (formData.duration < 15 || formData.duration > 480) {
      Alert.alert('Validation Error', 'Duration must be between 15 and 480 minutes');
      return false;
    }
    if (formData.interviewType === 'offline' && !formData.location.trim()) {
      Alert.alert('Validation Error', 'Please provide a location for offline interviews');
      return false;
    }
    const scheduledDateTime = formData.scheduledTime;
    if (scheduledDateTime < new Date()) {
      Alert.alert('Validation Error', 'Interview cannot be scheduled in the past');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const scheduledDateTime = formData.scheduledTime.toISOString();
      const meetingLink =
        formData.interviewType === 'online'
          ? formData.meetingUrl || generateMeetingLink()
          : '';

      // Note: The API might expect different format, adjust based on actual backend API
      if (isEdit && params.id) {
        // Update interview - need to check API format
        const updateData: UpdateInterviewRequest = {
          scheduledAt: scheduledDateTime,
          duration: formData.duration,
          location: formData.interviewType === 'offline' ? formData.location : undefined,
          meetingUrl: formData.interviewType === 'online' ? meetingLink : undefined,
          notes: formData.notes || undefined,
        };
        await recruitmentAPI.updateInterview(Number(params.id), updateData);
        Alert.alert('Success', 'Interview updated successfully');
      } else {
        // Create interview - API might expect candidate_id, job_id format
        // For now, using the CreateInterviewRequest format but might need adjustment
        const createData: any = {
          applicationId: application?.applicationId || 0,
          interviewerUserId: selectedInterviewers[0], // API might need array, adjust if needed
          scheduledAt: scheduledDateTime,
          duration: formData.duration,
          location: formData.interviewType === 'offline' ? formData.location : undefined,
          meetingUrl: formData.interviewType === 'online' ? meetingLink : undefined,
          notes: formData.notes || undefined,
        };
        // Try direct API call if format differs
        // await recruitmentAPI.createInterview(createData);
        Alert.alert('Info', 'Create interview API integration needed - check backend format');
        router.back();
        return;
      }

      router.back();
    } catch (error: any) {
      console.error('Error saving interview:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to save interview';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading form data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Interview' : 'Create Interview'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={saving} className="p-2">
            {saving ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Ionicons name="checkmark-outline" size={24} color="#2563eb" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Candidate & Job (Read-only if from application) */}
        {(application || interview) && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Application Details</Text>
            {application && (
              <>
                <View className="mb-2">
                  <Text className="text-sm text-gray-600">Candidate</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {application.candidate
                      ? `${application.candidate.firstName} ${application.candidate.lastName}`
                      : 'N/A'}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Job Position</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {application.jobPosting?.title || 'N/A'}
                  </Text>
                </View>
              </>
            )}
            {interview && (
              <>
                <View className="mb-2">
                  <Text className="text-sm text-gray-600">Candidate</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {interview.application?.candidate
                      ? `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`
                      : 'N/A'}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Job Position</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {interview.application?.jobPosting?.title || 'N/A'}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Schedule */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Schedule</Text>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className="text-gray-900">
                {formData.scheduledDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.scheduledDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Time</Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className="text-gray-900">
                {formData.scheduledTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Ionicons name="time-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={formData.scheduledTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              keyboardType="numeric"
              value={formData.duration.toString()}
              onChangeText={(text) => handleInputChange('duration', parseInt(text) || 60)}
              placeholder="60"
            />
          </View>
        </View>

        {/* Interview Type */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Interview Type</Text>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-700">Online</Text>
            <Switch
              value={formData.interviewType === 'online'}
              onValueChange={(value) =>
                handleInputChange('interviewType', value ? 'online' : 'offline')
              }
            />
          </View>

          {formData.interviewType === 'online' ? (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Meeting Link</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                value={formData.meetingUrl}
                onChangeText={(text) => handleInputChange('meetingUrl', text)}
                placeholder="https://meet.google.com/..."
                keyboardType="url"
              />
              <TouchableOpacity
                onPress={() => handleInputChange('meetingUrl', generateMeetingLink())}
                className="mt-2"
              >
                <Text className="text-sm text-blue-600">Generate Meeting Link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Location</Text>
              <Picker
                selectedValue={formData.location}
                onValueChange={(itemValue) => handleInputChange('location', itemValue)}
                className="border border-gray-300 rounded-lg"
              >
                <Picker.Item label="Select location..." value="" />
                {headquarters.map((hq) => (
                  <Picker.Item
                    key={hq.headquarterId}
                    label={hq.headquarterName}
                    value={hq.headquarterName}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Interviewers */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Interviewers *</Text>
          <Text className="text-xs text-gray-600 mb-3">
            Select one or more interviewers
          </Text>

          {interviewers.map((interviewer) => (
            <TouchableOpacity
              key={interviewer.employeeId}
              onPress={() => toggleInterviewer(interviewer.employeeId)}
              className={`flex-row items-center justify-between p-3 mb-2 rounded-lg border ${
                selectedInterviewers.includes(interviewer.employeeId)
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {interviewer.firstName} {interviewer.lastName}
                </Text>
                {interviewer.email && (
                  <Text className="text-xs text-gray-600">{interviewer.email}</Text>
                )}
              </View>
              {selectedInterviewers.includes(interviewer.employeeId) && (
                <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">Notes</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-24"
            multiline
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            placeholder="Add any notes about this interview..."
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className={`bg-blue-600 px-6 py-4 rounded-lg mb-6 ${saving ? 'opacity-50' : ''}`}
        >
          {saving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white font-semibold ml-2">Saving...</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center">
              {isEdit ? 'Update Interview' : 'Create Interview'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

