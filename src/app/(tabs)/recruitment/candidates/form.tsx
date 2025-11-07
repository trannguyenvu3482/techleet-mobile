import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  recruitmentAPI,
  Candidate,
  CreateCandidateRequest,
  UpdateCandidateRequest,
} from '@/services/api/recruitment';

export default function CandidateFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: '',
    education: '',
    workExperience: '',
    skills: '',
    certifications: '',
    portfolioUrl: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (params.id) {
        const candidateData = await recruitmentAPI.getCandidateById(Number(params.id));
        setCandidate(candidateData);
        setFormData({
          firstName: candidateData.firstName || '',
          lastName: candidateData.lastName || '',
          email: candidateData.email || '',
          phoneNumber: candidateData.phoneNumber || '',
          dateOfBirth: candidateData.dateOfBirth
            ? new Date(candidateData.dateOfBirth).toISOString().split('T')[0]
            : '',
          address: candidateData.address || '',
          city: candidateData.city || '',
          postalCode: candidateData.postalCode || '',
          education: candidateData.education || '',
          workExperience: candidateData.workExperience || '',
          skills: candidateData.skills || '',
          certifications: candidateData.certifications || '',
          portfolioUrl: candidateData.portfolioUrl || '',
          linkedinUrl: candidateData.linkedinUrl || '',
        });
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
      Alert.alert('Error', 'Failed to load candidate data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const baseData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        education: formData.education.trim() || undefined,
        workExperience: formData.workExperience.trim() || undefined,
        skills: formData.skills.trim() || undefined,
        certifications: formData.certifications.trim() || undefined,
        portfolioUrl: formData.portfolioUrl.trim() || undefined,
        linkedinUrl: formData.linkedinUrl.trim() || undefined,
      };

      if (isEdit && params.id) {
        const updateData: UpdateCandidateRequest = baseData;
        await recruitmentAPI.updateCandidate(Number(params.id), updateData);
        Alert.alert('Success', 'Candidate updated successfully');
      } else {
        const createData: CreateCandidateRequest = baseData as CreateCandidateRequest;
        const newCandidate = await recruitmentAPI.createCandidate(createData);
        Alert.alert('Success', 'Candidate created successfully');
        router.replace(`/recruitment/candidates/${newCandidate.candidateId}`);
        return;
      }

      router.back();
    } catch (error: any) {
      console.error('Error saving candidate:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to save candidate';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderFormField = (
    label: string,
    field: string,
    value: string,
    placeholder?: string,
    multiline?: boolean,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        {label}
        {(field === 'firstName' ||
          field === 'lastName' ||
          field === 'email' ||
          field === 'phoneNumber') &&
          ' *'}
      </Text>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={(text) => handleInputChange(field, text)}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Candidate' : 'Create Candidate'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Personal Information */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Personal Information
          </Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              {renderFormField('First Name *', 'firstName', formData.firstName, 'John')}
            </View>
            <View className="flex-1">
              {renderFormField('Last Name *', 'lastName', formData.lastName, 'Doe')}
            </View>
          </View>

          {renderFormField(
            'Email *',
            'email',
            formData.email,
            'john.doe@example.com',
            false,
            'email-address'
          )}

          {renderFormField(
            'Phone Number *',
            'phoneNumber',
            formData.phoneNumber,
            '+84 123 456 789',
            false,
            'numeric'
          )}

          {renderFormField(
            'Date of Birth',
            'dateOfBirth',
            formData.dateOfBirth,
            'YYYY-MM-DD'
          )}

          {renderFormField('Address', 'address', formData.address, 'Enter address')}

          <View className="flex-row gap-3">
            <View className="flex-1">
              {renderFormField('City', 'city', formData.city, 'Enter city')}
            </View>
            <View className="flex-1">
              {renderFormField('Postal Code', 'postalCode', formData.postalCode, '000000')}
            </View>
          </View>
        </View>

        {/* Professional Information */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Professional Information
          </Text>

          {renderFormField(
            'Education',
            'education',
            formData.education,
            'Enter education background',
            true
          )}

          {renderFormField(
            'Work Experience',
            'workExperience',
            formData.workExperience,
            'Enter work experience',
            true
          )}

          {renderFormField(
            'Skills',
            'skills',
            formData.skills,
            'Enter skills (comma-separated)',
            true
          )}

          {renderFormField(
            'Certifications',
            'certifications',
            formData.certifications,
            'Enter certifications',
            true
          )}
        </View>

        {/* Links */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">Links</Text>

          {renderFormField(
            'LinkedIn URL',
            'linkedinUrl',
            formData.linkedinUrl,
            'https://linkedin.com/in/...',
            false,
            'default'
          )}

          {renderFormField(
            'Portfolio URL',
            'portfolioUrl',
            formData.portfolioUrl,
            'https://portfolio.com',
            false,
            'default'
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className={`bg-blue-600 px-6 py-4 rounded-lg mb-6 ${
            saving ? 'opacity-50' : ''
          }`}
        >
          {saving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white font-semibold ml-2">Saving...</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center">
              {isEdit ? 'Update Candidate' : 'Create Candidate'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

