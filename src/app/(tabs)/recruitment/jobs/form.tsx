import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentAPI, CreateJobPostingRequest, UpdateJobPostingRequest, JobPosting } from '@/services/api/recruitment';
import { companyAPI, Department, Position } from '@/services/api/company';
import { employeeAPI } from '@/services/api/employees';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
const EXPERIENCE_LEVELS = ['Entry-level', 'Mid-level', 'Senior', 'Executive', 'Director'];
const EDUCATION_LEVELS = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD'];

export default function JobFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    salaryMin: '',
    salaryMax: '',
    vacancies: '1',
    employmentType: '',
    experienceLevel: '',
    skills: '',
    minExperience: '',
    maxExperience: '',
    educationLevel: '',
    applicationDeadline: '',
    location: '',
    departmentId: '',
    positionId: '',
    hiringManagerId: '',
    status: 'draft',
  });

  const [showDropdown, setShowDropdown] = useState<{
    type: 'employmentType' | 'experienceLevel' | 'educationLevel' | 'department' | 'position' | 'hiringManager' | null;
  }>({ type: null });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments, positions, employees
      const [deptsRes, posRes, empRes] = await Promise.all([
        companyAPI.getDepartments({ limit: 100 }),
        companyAPI.getPositions({ limit: 100 }),
        employeeAPI.getEmployees({ limit: 100 }),
      ]);
      
      setDepartments(deptsRes.data);
      setPositions(posRes.data);
      setEmployees(empRes.data);

      // If editing, load job data
      if (params.id) {
        const jobData = await recruitmentAPI.getJobPostingById(Number(params.id));
        setJob(jobData);
        setFormData({
          title: jobData.title || '',
          description: jobData.description || '',
          requirements: jobData.requirements || '',
          benefits: jobData.benefits || '',
          salaryMin: jobData.salaryMin || '',
          salaryMax: jobData.salaryMax || '',
          vacancies: jobData.vacancies?.toString() || '1',
          employmentType: jobData.employmentType || '',
          experienceLevel: jobData.experienceLevel || '',
          skills: jobData.skills || '',
          minExperience: jobData.minExperience?.toString() || '',
          maxExperience: jobData.maxExperience?.toString() || '',
          educationLevel: jobData.educationLevel || '',
          applicationDeadline: jobData.applicationDeadline
            ? new Date(jobData.applicationDeadline).toISOString().split('T')[0]
            : '',
          location: jobData.location || '',
          departmentId: jobData.departmentId?.toString() || '',
          positionId: jobData.positionId?.toString() || '',
          hiringManagerId: jobData.hiringManagerId?.toString() || '',
          status: jobData.status || 'draft',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelect = (type: string, value: string) => {
    handleInputChange(type, value);
    setShowDropdown({ type: null });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return false;
    }
    if (!formData.departmentId) {
      Alert.alert('Validation Error', 'Department is required');
      return false;
    }
    if (!formData.positionId) {
      Alert.alert('Validation Error', 'Position is required');
      return false;
    }
    if (!formData.applicationDeadline) {
      Alert.alert('Validation Error', 'Application deadline is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const baseData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        benefits: formData.benefits.trim(),
        salaryMin: Number(formData.salaryMin) || 0,
        salaryMax: Number(formData.salaryMax) || 0,
        vacancies: Number(formData.vacancies) || 1,
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills.trim(),
        minExperience: Number(formData.minExperience) || 0,
        maxExperience: Number(formData.maxExperience) || 0,
        educationLevel: formData.educationLevel,
        applicationDeadline: formData.applicationDeadline,
        location: formData.location.trim(),
        departmentId: Number(formData.departmentId),
        positionId: Number(formData.positionId),
        hiringManagerId: Number(formData.hiringManagerId) || 0,
      };

      if (isEdit && params.id) {
        const updateData: UpdateJobPostingRequest = {
          ...baseData,
          status: formData.status,
        };
        await recruitmentAPI.updateJobPosting(Number(params.id), updateData);
        Alert.alert('Success', 'Job posting updated successfully');
      } else {
        const createData: CreateJobPostingRequest = baseData as CreateJobPostingRequest;
        const newJob = await recruitmentAPI.createJobPosting(createData);
        Alert.alert('Success', 'Job posting created successfully');
        router.replace(`/recruitment/jobs/detail?id=${newJob.jobPostingId}`);
        return;
      }

      router.back();
    } catch (error: any) {
      console.error('Error saving job:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save job posting';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderDropdown = (type: string, options: any[], currentValue: string, displayKey?: string) => {
    if (showDropdown.type !== type) return null;

    return (
      <View className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 w-full mt-1">
        <ScrollView className="max-h-60">
          {options.map((option) => {
            const value = option[displayKey || 'id'] || option;
            const label = option[displayKey ? displayKey.replace('Id', 'Name') : 'name'] || option;
            const isSelected = currentValue === value?.toString();
            
            return (
              <TouchableOpacity
                key={value}
                onPress={() => handleSelect(type, value?.toString() || option)}
                className={`px-4 py-3 border-b border-gray-100 ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <Text className={`text-base ${isSelected ? 'font-semibold text-blue-600' : 'text-gray-900'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
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
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
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
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading...</Text>
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
            {isEdit ? 'Edit Job' : 'Create Job'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Basic Information */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">Basic Information</Text>
          
          {renderFormField('Title *', 'title', formData.title, 'Enter job title')}
          {renderFormField('Description *', 'description', formData.description, 'Enter job description', true)}
          {renderFormField('Requirements', 'requirements', formData.requirements, 'Enter requirements', true)}
          {renderFormField('Benefits', 'benefits', formData.benefits, 'Enter benefits', true)}
        </View>

        {/* Salary & Details */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">Salary & Details</Text>
          
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              {renderFormField('Min Salary', 'salaryMin', formData.salaryMin, '0', false, 'numeric')}
            </View>
            <View className="flex-1">
              {renderFormField('Max Salary', 'salaryMax', formData.salaryMax, '0', false, 'numeric')}
            </View>
          </View>

          {renderFormField('Vacancies', 'vacancies', formData.vacancies, '1', false, 'numeric')}
          {renderFormField('Location', 'location', formData.location, 'Enter location')}

          {/* Employment Type */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Employment Type</Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: 'employmentType' })}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={formData.employmentType ? 'text-gray-900' : 'text-gray-400'}>
                {formData.employmentType || 'Select employment type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {renderDropdown('employmentType', EMPLOYMENT_TYPES, formData.employmentType)}
          </View>

          {/* Experience Level */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Experience Level</Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: 'experienceLevel' })}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={formData.experienceLevel ? 'text-gray-900' : 'text-gray-400'}>
                {formData.experienceLevel || 'Select experience level'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {renderDropdown('experienceLevel', EXPERIENCE_LEVELS, formData.experienceLevel)}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              {renderFormField('Min Experience', 'minExperience', formData.minExperience, '0', false, 'numeric')}
            </View>
            <View className="flex-1">
              {renderFormField('Max Experience', 'maxExperience', formData.maxExperience, '0', false, 'numeric')}
            </View>
          </View>

          {/* Education Level */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Education Level</Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: 'educationLevel' })}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={formData.educationLevel ? 'text-gray-900' : 'text-gray-400'}>
                {formData.educationLevel || 'Select education level'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {renderDropdown('educationLevel', EDUCATION_LEVELS, formData.educationLevel)}
          </View>

          {renderFormField('Skills', 'skills', formData.skills, 'Enter required skills', true)}
        </View>

        {/* Organization */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">Organization</Text>
          
          {/* Department */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Department *</Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: 'department' })}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={formData.departmentId ? 'text-gray-900' : 'text-gray-400'}>
                {formData.departmentId
                  ? departments.find(d => d.departmentId.toString() === formData.departmentId)?.departmentName
                  : 'Select department'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {renderDropdown('department', departments, formData.departmentId, 'departmentId')}
          </View>

          {/* Position */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Position *</Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: 'position' })}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={formData.positionId ? 'text-gray-900' : 'text-gray-400'}>
                {formData.positionId
                  ? positions.find(p => p.positionId.toString() === formData.positionId)?.positionName
                  : 'Select position'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {renderDropdown('position', positions, formData.positionId, 'positionId')}
          </View>

          {/* Hiring Manager */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Hiring Manager</Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: 'hiringManager' })}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={formData.hiringManagerId ? 'text-gray-900' : 'text-gray-400'}>
                {formData.hiringManagerId
                  ? `${employees.find(e => e.employeeId.toString() === formData.hiringManagerId)?.firstName || ''} ${employees.find(e => e.employeeId.toString() === formData.hiringManagerId)?.lastName || ''}`.trim() || 'Unknown'
                  : 'Select hiring manager'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {renderDropdown('hiringManager', employees, formData.hiringManagerId, 'employeeId')}
          </View>
        </View>

        {/* Deadline & Status */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">Deadline & Status</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Application Deadline *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={formData.applicationDeadline}
              onChangeText={(text) => handleInputChange('applicationDeadline', text)}
            />
          </View>

          {isEdit && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Status</Text>
              <View className="flex-row gap-2">
                {['draft', 'published', 'closed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleInputChange('status', status)}
                    className={`flex-1 px-4 py-3 rounded-lg ${
                      formData.status === status
                        ? 'bg-blue-600'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        formData.status === status
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
              {isEdit ? 'Update Job' : 'Create Job'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Backdrop for dropdown */}
      {showDropdown.type && (
        <TouchableOpacity
          className="absolute inset-0 bg-black opacity-20"
          onPress={() => setShowDropdown({ type: null })}
        />
      )}
    </SafeAreaView>
  );
}

