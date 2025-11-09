import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  recruitmentAPI,
  CreateJobPostingRequest,
  UpdateJobPostingRequest,
  JobPosting,
} from "@/services/api/recruitment";
import { companyAPI, Department, Position } from "@/services/api/company";
import { employeeAPI } from "@/services/api/employees";
import { useThemeStore } from "@/store/theme-store";
import { getColors } from "@/theme/colors";

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
];
const EXPERIENCE_LEVELS = [
  "Entry-level",
  "Mid-level",
  "Senior",
  "Executive",
  "Director",
];
const EDUCATION_LEVELS = [
  "High School",
  "Associate",
  "Bachelor",
  "Master",
  "PhD",
];

export default function JobFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("recruitment");
  const { t: tCommon } = useTranslation("common");
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    salaryMin: "",
    salaryMax: "",
    vacancies: "1",
    employmentType: "",
    experienceLevel: "",
    skills: "",
    minExperience: "",
    maxExperience: "",
    educationLevel: "",
    applicationDeadline: "",
    location: "",
    departmentId: "",
    positionId: "",
    hiringManagerId: "",
    status: "draft",
  });

  const [showDropdown, setShowDropdown] = useState<{
    type:
      | "employmentType"
      | "experienceLevel"
      | "educationLevel"
      | "department"
      | "position"
      | "hiringManager"
      | null;
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
        const jobData = await recruitmentAPI.getJobPostingById(
          Number(params.id)
        );
        setJob(jobData);
        setFormData({
          title: jobData.title || "",
          description: jobData.description || "",
          requirements: jobData.requirements || "",
          benefits: jobData.benefits || "",
          salaryMin: jobData.salaryMin || "",
          salaryMax: jobData.salaryMax || "",
          vacancies: jobData.vacancies?.toString() || "1",
          employmentType: jobData.employmentType || "",
          experienceLevel: jobData.experienceLevel || "",
          skills: jobData.skills || "",
          minExperience: jobData.minExperience?.toString() || "",
          maxExperience: jobData.maxExperience?.toString() || "",
          educationLevel: jobData.educationLevel || "",
          applicationDeadline: jobData.applicationDeadline
            ? new Date(jobData.applicationDeadline).toISOString().split("T")[0]
            : "",
          location: jobData.location || "",
          departmentId: jobData.departmentId?.toString() || "",
          positionId: jobData.positionId?.toString() || "",
          hiringManagerId: jobData.hiringManagerId?.toString() || "",
          status: jobData.status || "draft",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert(tCommon("error"), t("failedToLoadData"));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelect = (type: string, value: string) => {
    handleInputChange(type, value);
    setShowDropdown({ type: null });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert(t("validationError"), t("titleRequired"));
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert(t("validationError"), t("descriptionRequired"));
      return false;
    }
    if (!formData.departmentId) {
      Alert.alert(t("validationError"), t("departmentRequired"));
      return false;
    }
    if (!formData.positionId) {
      Alert.alert(t("validationError"), t("positionRequired"));
      return false;
    }
    if (!formData.applicationDeadline) {
      Alert.alert(t("validationError"), t("applicationDeadlineRequired"));
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
        Alert.alert(tCommon("success"), t("jobUpdatedSuccessfully"));
      } else {
        const createData: CreateJobPostingRequest =
          baseData as CreateJobPostingRequest;
        const newJob = await recruitmentAPI.createJobPosting(createData);
        Alert.alert(tCommon("success"), t("jobCreatedSuccessfully"));
        router.replace(`/recruitment/jobs/detail?id=${newJob.jobPostingId}`);
        return;
      }

      router.back();
    } catch (error: any) {
      console.error("Error saving job:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("failedToSaveJob");
      Alert.alert(tCommon("error"), errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderDropdown = (
    type: string,
    options: any[],
    currentValue: string,
    displayKey?: string
  ) => {
    if (showDropdown.type !== type) return null;

    return (
      <View
        className="absolute z-50 rounded-lg shadow-lg max-h-60 w-full mt-1 border"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <ScrollView className="max-h-60">
          {options.map((option) => {
            const value = option[displayKey || "id"] || option;
            const label =
              option[displayKey ? displayKey.replace("Id", "Name") : "name"] ||
              option;
            const isSelected = currentValue === value?.toString();

            return (
              <TouchableOpacity
                key={value}
                onPress={() => handleSelect(type, value?.toString() || option)}
                className="px-4 py-3 border-b"
                style={{
                  borderBottomColor: colors.border,
                  backgroundColor: isSelected
                    ? colors.primaryLight
                    : "transparent",
                }}
              >
                <Text
                  className="text-base"
                  style={{
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
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
    keyboardType: "default" | "numeric" | "email-address" = "default"
  ) => (
    <View className="mb-4">
      <Text
        className="text-sm font-semibold mb-2"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
      <TextInput
        className="rounded-lg px-4 py-3"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          color: colors.text,
          textAlignVertical: multiline ? "top" : "center",
        }}
        placeholder={
          placeholder || t("enterField", { field: label.toLowerCase() })
        }
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={(text) => handleInputChange(field, text)}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  if (loading) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background, paddingTop: insets.top }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            {tCommon("loading")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        className="px-4 py-3 border-b"
        style={{
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {isEdit ? t("editJob") : t("createJob")}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        style={{ backgroundColor: colors.background }}
      >
        {/* Basic Information */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t("basicInformation")}
          </Text>

          {renderFormField(
            t("title") + " *",
            "title",
            formData.title,
            t("enterJobTitle")
          )}
          {renderFormField(
            t("description") + " *",
            "description",
            formData.description,
            t("enterJobDescription"),
            true
          )}
          {renderFormField(
            t("requirements"),
            "requirements",
            formData.requirements,
            t("enterRequirements"),
            true
          )}
          {renderFormField(
            t("benefits"),
            "benefits",
            formData.benefits,
            t("enterBenefits"),
            true
          )}
        </View>

        {/* Salary & Details */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t("salaryDetails")}
          </Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              {renderFormField(
                t("minSalary"),
                "salaryMin",
                formData.salaryMin,
                "0",
                false,
                "numeric"
              )}
            </View>
            <View className="flex-1">
              {renderFormField(
                t("maxSalary"),
                "salaryMax",
                formData.salaryMax,
                "0",
                false,
                "numeric"
              )}
            </View>
          </View>

          {renderFormField(
            t("vacancies"),
            "vacancies",
            formData.vacancies,
            "1",
            false,
            "numeric"
          )}
          {renderFormField(
            t("location"),
            "location",
            formData.location,
            t("enterLocation")
          )}

          {/* Employment Type */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              {t("employmentType")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: "employmentType" })}
              className="rounded-lg px-4 py-3 flex-row items-center justify-between border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: formData.employmentType
                    ? colors.text
                    : colors.textTertiary,
                }}
              >
                {formData.employmentType || t("selectEmploymentType")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {renderDropdown(
              "employmentType",
              EMPLOYMENT_TYPES,
              formData.employmentType
            )}
          </View>

          {/* Experience Level */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              {t("experienceLevel")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: "experienceLevel" })}
              className="rounded-lg px-4 py-3 flex-row items-center justify-between border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: formData.experienceLevel
                    ? colors.text
                    : colors.textTertiary,
                }}
              >
                {formData.experienceLevel || t("selectExperienceLevel")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {renderDropdown(
              "experienceLevel",
              EXPERIENCE_LEVELS,
              formData.experienceLevel
            )}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              {renderFormField(
                t("minExperience"),
                "minExperience",
                formData.minExperience,
                "0",
                false,
                "numeric"
              )}
            </View>
            <View className="flex-1">
              {renderFormField(
                t("maxExperience"),
                "maxExperience",
                formData.maxExperience,
                "0",
                false,
                "numeric"
              )}
            </View>
          </View>

          {/* Education Level */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              {t("educationLevel")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: "educationLevel" })}
              className="rounded-lg px-4 py-3 flex-row items-center justify-between border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: formData.educationLevel
                    ? colors.text
                    : colors.textTertiary,
                }}
              >
                {formData.educationLevel || t("selectEducationLevel")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {renderDropdown(
              "educationLevel",
              EDUCATION_LEVELS,
              formData.educationLevel
            )}
          </View>

          {renderFormField(
            t("skills"),
            "skills",
            formData.skills,
            t("enterRequiredSkills"),
            true
          )}
        </View>

        {/* Organization */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t("organization")}
          </Text>

          {/* Department */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              {t("department")} *
            </Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: "department" })}
              className="rounded-lg px-4 py-3 flex-row items-center justify-between border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: formData.departmentId
                    ? colors.text
                    : colors.textTertiary,
                }}
              >
                {formData.departmentId
                  ? departments.find(
                      (d) => d.departmentId.toString() === formData.departmentId
                    )?.departmentName
                  : t("selectDepartment")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {renderDropdown(
              "department",
              departments,
              formData.departmentId,
              "departmentId"
            )}
          </View>

          {/* Position */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              {t("position")} *
            </Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: "position" })}
              className="rounded-lg px-4 py-3 flex-row items-center justify-between border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: formData.positionId
                    ? colors.text
                    : colors.textTertiary,
                }}
              >
                {formData.positionId
                  ? positions.find(
                      (p) => p.positionId.toString() === formData.positionId
                    )?.positionName
                  : t("selectPosition")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {renderDropdown(
              "position",
              positions,
              formData.positionId,
              "positionId"
            )}
          </View>

          {/* Hiring Manager */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              {t("hiringManager")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowDropdown({ type: "hiringManager" })}
              className="rounded-lg px-4 py-3 flex-row items-center justify-between border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: formData.hiringManagerId
                    ? colors.text
                    : colors.textTertiary,
                }}
              >
                {formData.hiringManagerId
                  ? `${employees.find((e) => e.employeeId.toString() === formData.hiringManagerId)?.firstName || ""} ${employees.find((e) => e.employeeId.toString() === formData.hiringManagerId)?.lastName || ""}`.trim() ||
                    t("unknown")
                  : t("selectHiringManager")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {renderDropdown(
              "hiringManager",
              employees,
              formData.hiringManagerId,
              "employeeId"
            )}
          </View>
        </View>

        {/* Deadline & Status */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t("deadlineStatus")}
          </Text>

          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              {t("applicationDeadline")} *
            </Text>
            <TextInput
              className="rounded-lg px-4 py-3 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                color: colors.text,
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              value={formData.applicationDeadline}
              onChangeText={(text) =>
                handleInputChange("applicationDeadline", text)
              }
            />
          </View>

          {isEdit && (
            <View className="mb-4">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                {t("status")}
              </Text>
              <View className="flex-row gap-2">
                {["draft", "published", "closed"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleInputChange("status", status)}
                    className="flex-1 px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor:
                        formData.status === status
                          ? colors.primary
                          : colors.surface,
                    }}
                  >
                    <Text
                      className="text-center font-semibold"
                      style={{
                        color:
                          formData.status === status ? "white" : colors.text,
                      }}
                    >
                      {t(status)}
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
          className="px-6 py-4 rounded-lg mb-6"
          style={{
            backgroundColor: saving ? colors.textTertiary : colors.primary,
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white font-semibold ml-2">
                {tCommon("saving")}
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center">
              {isEdit ? t("updateJob") : t("createJob")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Backdrop for dropdown */}
      {showDropdown.type && (
        <TouchableOpacity
          className="absolute inset-0"
          style={{ backgroundColor: "black", opacity: 0.2 }}
          onPress={() => setShowDropdown({ type: null })}
        />
      )}
    </View>
  );
}
