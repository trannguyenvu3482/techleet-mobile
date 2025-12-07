import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  recruitmentAPI,
  Interview,
  UpdateInterviewRequest,
  Application,
} from '@/services/api/recruitment';
import { employeeAPI } from '@/services/api/employees';
import { EmployeeResponseDto } from '@/types/employee';
import { companyAPI, Headquarter } from '@/services/api/company';
import { reminderService } from '@/services/reminders';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';
import { useToast } from '@/hooks/useToast';

export default function InterviewFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; applicationId?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
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
  const [reminderMinutes, setReminderMinutes] = useState<number>(60);
  const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      toast.error(t('failedToLoadFormData'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [isEdit, params.id, params.applicationId, router, t, tCommon]);

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
    const newErrors: Record<string, string> = {};
    
    if (formData.candidateId === 0) {
      newErrors.candidateId = t('pleaseSelectCandidate');
    }
    if (formData.jobId === 0) {
      newErrors.jobId = t('pleaseSelectJob');
    }
    if (selectedInterviewers.length === 0) {
      newErrors.interviewers = t('pleaseSelectInterviewer');
    }
    if (formData.duration < 15 || formData.duration > 480) {
      newErrors.duration = t('durationRangeError');
    }
    if (formData.interviewType === 'offline' && !formData.location.trim()) {
      newErrors.location = t('pleaseProvideLocation');
    }
    const scheduledDateTime = formData.scheduledTime;
    if (scheduledDateTime < new Date()) {
      newErrors.scheduledTime = t('cannotSchedulePast');
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
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
        const updatedInterview = await recruitmentAPI.updateInterview(Number(params.id), updateData);
        toast.success(t('interviewUpdatedSuccess'));
        
        if (updatedInterview && updatedInterview.scheduledAt) {
          const scheduledDate = new Date(updatedInterview.scheduledAt);
          const candidateName = interview?.application?.candidate
            ? `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`
            : undefined;
          const jobTitle = interview?.application?.jobPosting?.title;
          await reminderService.updateReminder(
            Number(params.id),
            scheduledDate,
            reminderMinutes,
            candidateName,
            jobTitle
          );
        }
      } else {
        // Create interview
        const createData: any = {
          applicationId: application?.applicationId,
          interviewerUserId: selectedInterviewers[0],
          scheduledAt: scheduledDateTime,
          duration: formData.duration,
          location: formData.interviewType === 'offline' ? formData.location : undefined,
          meetingUrl: formData.interviewType === 'online' ? meetingLink : undefined,
          notes: formData.notes || undefined,
        };
        
        const newInterview = await recruitmentAPI.createInterview(createData);
        toast.success(t('interviewCreatedSuccess'));
        
        // Schedule reminder if needed
        if (newInterview && newInterview.scheduledAt) {
          const scheduledDate = new Date(newInterview.scheduledAt);
          const candidateName = application?.candidate
            ? `${application.candidate.firstName} ${application.candidate.lastName}`
            : undefined;
          const jobTitle = application?.jobPosting?.title;
            
          await reminderService.scheduleReminder(
            newInterview.interviewId,
            scheduledDate,
            reminderMinutes,
            candidateName,
            jobTitle
          );
        }
      }

      router.back();
    } catch (error: any) {
      console.error('Error saving interview:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || t('failedToSaveInterview');
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingFormData')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {isEdit ? t('editInterview') : t('createInterview')}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={saving} className="p-2">
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="checkmark-outline" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
        {/* Candidate & Job (Read-only if from application) */}
        {(application || interview) && (
          <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('applicationDetails')}</Text>
            {application && (
              <>
                <View className="mb-2">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('candidate')}</Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {application.candidate
                      ? `${application.candidate.firstName} ${application.candidate.lastName}`
                      : tCommon('nA')}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('jobPosition')}</Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {application.jobPosting?.title || tCommon('nA')}
                  </Text>
                </View>
              </>
            )}
            {interview && (
              <>
                <View className="mb-2">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('candidate')}</Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {interview.application?.candidate
                      ? `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`
                      : tCommon('nA')}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('jobPosition')}</Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {interview.application?.jobPosting?.title || tCommon('nA')}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Schedule */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('schedule')}</Text>

          <View className="mb-3">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>{tCommon('date')}</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="border rounded-lg px-4 py-3 flex-row items-center justify-between"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text style={{ color: colors.text }}>
                {formData.scheduledDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
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
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>{tCommon('time')}</Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="border rounded-lg px-4 py-3 flex-row items-center justify-between"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text style={{ color: colors.text }}>
                {formData.scheduledTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
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
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>{t('durationMinutes')}</Text>
            <TextInput
              className="border rounded-lg px-4 py-3"
              style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }}
              keyboardType="numeric"
              value={formData.duration.toString()}
              onChangeText={(text) => handleInputChange('duration', parseInt(text) || 60)}
              placeholder="60"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Interview Type */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('interviewType')}</Text>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('online')}</Text>
            <Switch
              value={formData.interviewType === 'online'}
              onValueChange={(value) =>
                handleInputChange('interviewType', value ? 'online' : 'offline')
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {formData.interviewType === 'online' ? (
            <View className="mb-3">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>{t('meetingLink')}</Text>
              <TextInput
                className="border rounded-lg px-4 py-3"
                style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }}
                value={formData.meetingUrl}
                onChangeText={(text) => handleInputChange('meetingUrl', text)}
                placeholder={t('meetingLinkPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                keyboardType="url"
              />
              <TouchableOpacity
                onPress={() => handleInputChange('meetingUrl', generateMeetingLink())}
                className="mt-2"
              >
                <Text className="text-sm" style={{ color: colors.primary }}>{t('generateMeetingLink')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mb-3">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>{t('location')}</Text>
              <View className="border rounded-lg" style={{ borderColor: colors.border }}>
                <Picker
                  selectedValue={formData.location}
                  onValueChange={(itemValue) => handleInputChange('location', itemValue)}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label={t('selectLocation')} value="" />
                  {headquarters.map((hq) => (
                    <Picker.Item
                      key={hq.headquarterId}
                      label={hq.headquarterName}
                      value={hq.headquarterName}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}
        </View>

        {/* Interviewers */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('interviewers')} *</Text>
          <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
            {t('selectInterviewers')}
          </Text>

          {interviewers.map((interviewer) => (
            <TouchableOpacity
              key={interviewer.employeeId}
              onPress={() => toggleInterviewer(interviewer.employeeId)}
              className="flex-row items-center justify-between p-3 mb-2 rounded-lg border"
              style={{
                backgroundColor: selectedInterviewers.includes(interviewer.employeeId)
                  ? colors.primaryLight
                  : colors.surface,
                borderColor: selectedInterviewers.includes(interviewer.employeeId)
                  ? colors.primary
                  : colors.border,
              }}
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {interviewer.firstName} {interviewer.lastName}
                </Text>
                {interviewer.email && (
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>{interviewer.email}</Text>
                )}
              </View>
              {selectedInterviewers.includes(interviewer.employeeId) && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{tCommon('notes')}</Text>
          <TextInput
            className="border rounded-lg px-4 py-3 h-24"
            style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }}
            multiline
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            placeholder={t('notesPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className="px-6 py-4 rounded-lg mb-6"
          style={{
            backgroundColor: colors.primary,
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white font-semibold ml-2">{tCommon('saving')}</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center">
              {isEdit ? t('updateInterview') : t('createInterview')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

