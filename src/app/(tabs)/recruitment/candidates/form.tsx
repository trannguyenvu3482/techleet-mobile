import {
  Candidate,
  CreateCandidateRequest,
  recruitmentAPI,
  UpdateCandidateRequest,
} from "@/services/api/recruitment";
import { useThemeStore } from "@/store/theme-store";
import { getColors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CandidateFormScreen() {
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
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: "",
    city: "",
    postalCode: "",
    education: "",
    workExperience: "",
    skills: "",
    certifications: "",
    portfolioUrl: "",
    linkedinUrl: "",
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (params.id) {
        const candidateData = await recruitmentAPI.getCandidateById(
          Number(params.id)
        );
        setCandidate(candidateData);
        setFormData({
          firstName: candidateData.firstName || "",
          lastName: candidateData.lastName || "",
          email: candidateData.email || "",
          phoneNumber: candidateData.phoneNumber || "",
          dateOfBirth: candidateData.dateOfBirth
            ? new Date(candidateData.dateOfBirth).toISOString().split("T")[0]
            : "",
          address: candidateData.address || "",
          city: candidateData.city || "",
          postalCode: candidateData.postalCode || "",
          education: candidateData.education || "",
          workExperience: candidateData.workExperience || "",
          skills: candidateData.skills || "",
          certifications: candidateData.certifications || "",
          portfolioUrl: candidateData.portfolioUrl || "",
          linkedinUrl: candidateData.linkedinUrl || "",
        });
      }
    } catch (error) {
      console.error("Error loading candidate:", error);
      Alert.alert(tCommon("error"), t("failedToLoadCandidateData"));
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
      Alert.alert(t("validationError"), t("firstNameRequired"));
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert(t("validationError"), t("lastNameRequired"));
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert(t("validationError"), t("emailRequired"));
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert(t("validationError"), t("phoneNumberRequired"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert(t("validationError"), t("invalidEmail"));
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
        Alert.alert(tCommon("success"), t("candidateUpdatedSuccessfully"));
      } else {
        const createData: CreateCandidateRequest =
          baseData as CreateCandidateRequest;
        const newCandidate = await recruitmentAPI.createCandidate(createData);
        Alert.alert(tCommon("success"), t("candidateCreatedSuccessfully"));
        router.replace(`/recruitment/candidates/${newCandidate.candidateId}`);
        return;
      }

      router.back();
    } catch (error: any) {
      console.error("Error saving candidate:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("failedToSaveCandidate");
      Alert.alert(tCommon("error"), errorMessage);
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
    keyboardType: "default" | "numeric" | "email-address" = "default"
  ) => (
    <View className="mb-4">
      <Text
        className="text-sm font-semibold mb-2"
        style={{ color: colors.text }}
      >
        {label}
        {(field === "firstName" ||
          field === "lastName" ||
          field === "email" ||
          field === "phoneNumber") &&
          " *"}
      </Text>
      <TextInput
        className="rounded-lg px-4 py-3"
        style={{
          textAlignVertical: multiline ? "top" : "center",
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          color: colors.text,
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
            {isEdit ? t("editCandidate") : t("createCandidate")}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        style={{ backgroundColor: colors.background }}
      >
        {/* Personal Information */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t("personalInformation")}
          </Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              {renderFormField(
                t("firstName") + " *",
                "firstName",
                formData.firstName,
                t("enterFirstName")
              )}
            </View>
            <View className="flex-1">
              {renderFormField(
                t("lastName") + " *",
                "lastName",
                formData.lastName,
                t("enterLastName")
              )}
            </View>
          </View>

          {renderFormField(
            tCommon("email") + " *",
            "email",
            formData.email,
            t("enterEmail"),
            false,
            "email-address"
          )}

          {renderFormField(
            t("phone") + " *",
            "phoneNumber",
            formData.phoneNumber,
            t("enterPhoneNumber"),
            false,
            "numeric"
          )}

          {renderFormField(
            t("dateOfBirth"),
            "dateOfBirth",
            formData.dateOfBirth,
            "YYYY-MM-DD"
          )}

          {renderFormField(
            t("address"),
            "address",
            formData.address,
            t("enterAddress")
          )}

          <View className="flex-row gap-3">
            <View className="flex-1">
              {renderFormField(
                t("city"),
                "city",
                formData.city,
                t("enterCity")
              )}
            </View>
            <View className="flex-1">
              {renderFormField(
                t("postalCode"),
                "postalCode",
                formData.postalCode,
                t("enterPostalCode")
              )}
            </View>
          </View>
        </View>

        {/* Professional Information */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t("professionalInformation")}
          </Text>

          {renderFormField(
            t("education"),
            "education",
            formData.education,
            t("enterEducation"),
            true
          )}

          {renderFormField(
            t("workExperience"),
            "workExperience",
            formData.workExperience,
            t("enterWorkExperience"),
            true
          )}

          {renderFormField(
            t("skills"),
            "skills",
            formData.skills,
            t("enterSkills"),
            true
          )}

          {renderFormField(
            t("certifications"),
            "certifications",
            formData.certifications,
            t("enterCertifications"),
            true
          )}
        </View>

        {/* Links */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t("links")}
          </Text>

          {renderFormField(
            t("linkedinUrl"),
            "linkedinUrl",
            formData.linkedinUrl,
            t("enterLinkedInUrl"),
            false,
            "default"
          )}

          {renderFormField(
            t("portfolioUrl"),
            "portfolioUrl",
            formData.portfolioUrl,
            t("enterPortfolioUrl"),
            false,
            "default"
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
              {isEdit ? t("updateCandidate") : t("createCandidate")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
