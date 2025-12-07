import {
  Application,
  Candidate,
  CandidateFile,
  recruitmentAPI,
} from "@/services/api/recruitment";
import { useThemeStore } from "@/store/theme-store";
import { getColors } from "@/theme/colors";
import { shareService } from "@/utils/share";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CandidateDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("recruitment");
  const { t: tCommon } = useTranslation("common");
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [files, setFiles] = useState<CandidateFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [screeningScore, setScreeningScore] = useState<number | null>(null);

  const fetchCandidate = useCallback(
    async (candidateId: number) => {
      try {
        setLoading(true);
        console.log("Fetching candidate with ID:", candidateId);
        const candidateData =
          await recruitmentAPI.getCandidateById(candidateId);
        console.log(
          "Candidate data received:",
          JSON.stringify(candidateData, null, 2)
        );

        if (
          !candidateData ||
          (typeof candidateData === "object" &&
            Object.keys(candidateData).length === 0)
        ) {
          console.error("Candidate data is null, undefined, or empty");
          throw new Error("Candidate not found");
        }

        // Check if candidateData has required fields
        if (!candidateData.candidateId && !candidateData.email) {
          console.error(
            "Candidate data missing required fields:",
            candidateData
          );
          throw new Error("Invalid candidate data received");
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
          console.error("Error fetching applications:", error);
        }

        // Fetch candidate files
        try {
          const filesData = await recruitmentAPI.getCandidateFiles(candidateId);
          setFiles(filesData);
        } catch (error) {
          console.error("Error fetching files:", error);
        }
      } catch (error) {
        console.error("Error fetching candidate:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : t("failedToLoadCandidateDetails");
        setLoading(false);
        setCandidate(null);
        Alert.alert(tCommon("error"), errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [t, tCommon]
  );

  useEffect(() => {
    // Check if params.id is valid
    if (!params.id) {
      setLoading(false);
      setCandidate(null);
      return;
    }

    // Check if params.id is 'index' - this means we're on the wrong route
    if (params.id === "index") {
      setLoading(false);
      setCandidate(null);
      // Navigate back to candidates list
      setTimeout(() => {
        router.replace("/recruitment/candidates");
      }, 100);
      return;
    }

    const candidateId = Number(params.id);
    if (isNaN(candidateId) || candidateId <= 0) {
      setLoading(false);
      setCandidate(null);
      Alert.alert(
        tCommon("error"),
        t("invalidCandidateId", { id: params.id }),
        [{ text: tCommon("ok"), onPress: () => router.back() }]
      );
      return;
    }

    fetchCandidate(candidateId);
  }, [params.id, fetchCandidate, router, t, tCommon]);

  const handleViewExams = () => {
    if (applications.length > 0) {
      router.push(
        `/recruitment/candidates/${params.id}/exams?applicationId=${applications[0].applicationId}`
      );
    } else {
      Alert.alert(tCommon("info"), t("noApplicationsFound"));
    }
  };

  const handleScheduleInterview = (application?: Application) => {
    if (application && application.applicationId) {
      router.push(
        `/recruitment/interviews/form?applicationId=${application.applicationId}`
      );
    } else if (applications.length > 0) {
      router.push(
        `/recruitment/interviews/form?applicationId=${applications[0].applicationId}`
      );
    } else {
      Alert.alert(tCommon("info"), t("noApplicationsFound"));
    }
  };

  const handleShare = async () => {
    if (!candidate) return;
    await shareService.shareCandidate(candidate);
  };

  const handleOpenUrl = (url: string) => {
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      Linking.openURL(url).catch((err) => {
        console.error("Error opening URL:", err);
        Alert.alert(tCommon("error"), t("failedToOpenUrl"));
      });
    }
  };

  const handleDownloadFile = (file: CandidateFile) => {
    if (file.fileUrl) {
      handleOpenUrl(file.fileUrl);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return tCommon("nA");
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return colors.textSecondary;
    switch (status.toLowerCase()) {
      case "hired":
        return colors.success;
      case "offer":
      case "offered":
        return colors.primary;
      case "interviewing":
        return colors.purple;
      case "screening":
      case "screening_passed":
        return colors.warning;
      case "rejected":
      case "screening_failed":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return tCommon("nA");
    return t(`status.${status.toLowerCase()}`);
  };

  if (loading) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background, paddingTop: insets.top }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            {t("loadingCandidateDetails")}
          </Text>
        </View>
      </View>
    );
  }

  if (!candidate) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background, paddingTop: insets.top }}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text
            className="text-lg font-semibold mt-4"
            style={{ color: colors.textSecondary }}
          >
            {t("candidateNotFound")}
          </Text>
          <Text
            className="text-sm mt-2 text-center"
            style={{ color: colors.textTertiary }}
          >
            {params.id
              ? `${t("id")}: ${params.id}`
              : t("noCandidateIdProvided")}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">{tCommon("back")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`;

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
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-xl font-bold"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {fullName}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {candidate.email}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={handleShare} className="p-2">
              <Ionicons name="share-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/recruitment/candidates/form?id=${candidate.candidateId}`
                )
              }
              className="p-2"
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleViewExams}
            className="flex-1 px-4 py-2 rounded-lg flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="document-text-outline" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">
              {t("viewExams")}
            </Text>
          </TouchableOpacity>
          {applications.length > 0 && (
            <TouchableOpacity
              onPress={() => handleScheduleInterview()}
              className="flex-1 px-4 py-2 rounded-lg flex-row items-center justify-center"
              style={{ backgroundColor: colors.success }}
            >
              <Ionicons name="calendar-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">
                {t("schedule")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        style={{ backgroundColor: colors.background }}
      >
        {/* Contact Information */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-3"
            style={{ color: colors.text }}
          >
            {t("contactInformation")}
          </Text>

          <View className="flex-row items-center mb-2">
            <Ionicons
              name="mail-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text
              className="text-sm ml-2 flex-1"
              style={{ color: colors.textSecondary }}
            >
              {tCommon("email")}
            </Text>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              {candidate.email}
            </Text>
          </View>

          {candidate.phoneNumber && (
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="call-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                className="text-sm ml-2 flex-1"
                style={{ color: colors.textSecondary }}
              >
                {t("phone")}
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.text }}
              >
                {candidate.phoneNumber}
              </Text>
            </View>
          )}

          {candidate.address && (
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                className="text-sm ml-2 flex-1"
                style={{ color: colors.textSecondary }}
              >
                {t("address")}
              </Text>
              <Text
                className="text-sm font-semibold flex-1 text-right"
                style={{ color: colors.text }}
              >
                {candidate.address}
              </Text>
            </View>
          )}

          {candidate.city && (
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="business-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                className="text-sm ml-2 flex-1"
                style={{ color: colors.textSecondary }}
              >
                {t("city")}
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.text }}
              >
                {candidate.city}
              </Text>
            </View>
          )}

          {candidate.linkedinUrl && (
            <TouchableOpacity
              onPress={() => handleOpenUrl(candidate.linkedinUrl!)}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="logo-linkedin" size={18} color="#0077b5" />
              <Text
                className="text-sm ml-2 flex-1"
                style={{ color: colors.primary }}
              >
                {t("linkedin")}
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          {candidate.portfolioUrl && (
            <TouchableOpacity
              onPress={() => handleOpenUrl(candidate.portfolioUrl!)}
              className="flex-row items-center mb-2"
            >
              <Ionicons
                name="globe-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                className="text-sm ml-2 flex-1"
                style={{ color: colors.primary }}
              >
                {t("portfolio")}
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Skills & Experience */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-3"
            style={{ color: colors.text }}
          >
            {t("skillsExperience")}
          </Text>

          {candidate.skills && (
            <View className="mb-3">
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: colors.text }}
              >
                {t("skills")}
              </Text>
              <Text className="text-sm" style={{ color: colors.text }}>
                {candidate.skills}
              </Text>
            </View>
          )}

          {candidate.workExperience && (
            <View className="mb-3">
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: colors.text }}
              >
                {t("workExperience")}
              </Text>
              <Text className="text-sm" style={{ color: colors.text }}>
                {candidate.workExperience}
              </Text>
            </View>
          )}

          {candidate.education && (
            <View className="mb-3">
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: colors.text }}
              >
                {t("education")}
              </Text>
              <Text className="text-sm" style={{ color: colors.text }}>
                {candidate.education}
              </Text>
            </View>
          )}

          {candidate.certifications && (
            <View>
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: colors.text }}
              >
                {t("certifications")}
              </Text>
              <Text className="text-sm" style={{ color: colors.text }}>
                {candidate.certifications}
              </Text>
            </View>
          )}

          {screeningScore !== null && screeningScore !== undefined && (
            <View
              className="mt-3 pt-3 border-t"
              style={{ borderTopColor: colors.border }}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.text }}
                >
                  {t("screeningScore")}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text
                    className="text-sm font-bold ml-1"
                    style={{ color: colors.text }}
                  >
                    {typeof screeningScore === "number"
                      ? screeningScore.toFixed(1)
                      : tCommon("nA")}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Resume */}
        {candidate.resumeUrl && (
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: colors.text }}
            >
              {t("resume")}
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenUrl(candidate.resumeUrl!)}
              className="flex-row items-center justify-between px-4 py-3 rounded-lg"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={colors.primary}
                />
                <Text
                  className="text-sm font-semibold ml-3"
                  style={{ color: colors.primary }}
                >
                  {t("viewResume")}
                </Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Files */}
        {files.length > 0 && (
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: colors.text }}
            >
              {t("files")}
            </Text>
            {files.map((file) => (
              <View
                key={file.fileId}
                className="flex-row items-center justify-between px-4 py-3 rounded-lg mb-2"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View className="flex-1 ml-3">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {file.fileName || file.originalName}
                    </Text>
                    {file.fileSize && (
                      <Text
                        className="text-xs mt-1"
                        style={{ color: colors.textTertiary }}
                      >
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
                        <Ionicons
                          name="eye-outline"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDownloadFile(file)}
                        className="p-2"
                      >
                        <Ionicons
                          name="download-outline"
                          size={18}
                          color={colors.success}
                        />
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
          <View
            className="rounded-lg p-4 mb-4 border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: colors.text }}
            >
              {t("applications")} ({applications.length})
            </Text>
            {applications.map((app) => (
              <TouchableOpacity
                key={app.applicationId}
                onPress={() =>
                  router.push(`/recruitment/jobs/detail?id=${app.jobPostingId}`)
                }
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: colors.border }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold mb-1"
                      style={{ color: colors.text }}
                    >
                      {t("application")} #{app.applicationId}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      {formatDate(app.appliedAt)}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${getStatusColor(app.applicationStatus)}20`,
                    }}
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
                    <Ionicons
                      name="star-outline"
                      size={14}
                      color={colors.warning}
                    />
                    <Text
                      className="text-xs font-semibold ml-1"
                      style={{ color: colors.text }}
                    >
                      {t("score")}:{" "}
                      {typeof app.score === "number"
                        ? app.score.toFixed(1)
                        : tCommon("nA")}
                    </Text>
                  </View>
                )}

                {/* AI Screening Insights */}
                {(app.aiSummary || (app.keyHighlights && app.keyHighlights.length > 0) || (app.concerns && app.concerns.length > 0)) && (
                   <View className="mt-3 pt-3 border-t" style={{ borderTopColor: colors.border }}>
                      <Text className="text-sm font-bold mb-2" style={{ color: colors.text }}>
                         {t("screeningInsights")}
                      </Text>
                      
                      {app.aiSummary && (
                         <View className="mb-2">
                            <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                               {t("aiSummary")}
                            </Text>
                            <Text className="text-xs italic" style={{ color: colors.text }}>
                               {app.aiSummary}
                            </Text>
                         </View>
                      )}

                      {app.keyHighlights && app.keyHighlights.length > 0 && (
                         <View className="mb-2">
                            <Text className="text-xs font-semibold mb-1" style={{ color: colors.success }}>
                               {t("keyHighlights")}
                            </Text>
                            {app.keyHighlights.map((highlight, index) => (
                               <View key={`highlight-${index}`} className="flex-row items-start mb-1">
                                  <Ionicons name="checkmark-circle-outline" size={12} color={colors.success} style={{ marginTop: 2, marginRight: 4 }} />
                                  <Text className="text-xs flex-1" style={{ color: colors.text }}>{highlight}</Text>
                               </View>
                            ))}
                         </View>
                      )}

                      {app.concerns && app.concerns.length > 0 && (
                         <View>
                            <Text className="text-xs font-semibold mb-1" style={{ color: colors.error }}>
                               {t("concerns")}
                            </Text>
                            {app.concerns.map((concern, index) => (
                               <View key={`concern-${index}`} className="flex-row items-start mb-1">
                                  <Ionicons name="alert-circle-outline" size={12} color={colors.error} style={{ marginTop: 2, marginRight: 4 }} />
                                  <Text className="text-xs flex-1" style={{ color: colors.text }}>{concern}</Text>
                               </View>
                            ))}
                         </View>
                      )}
                   </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Metadata */}
        <View
          className="rounded-lg p-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-lg font-bold mb-3"
            style={{ color: colors.text }}
          >
            {t("additionalInfo")}
          </Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {t("created")}
            </Text>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              {formatDate(candidate.createdAt)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {t("lastUpdated")}
            </Text>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              {formatDate(candidate.updatedAt)}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {t("active")}
            </Text>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              {candidate.isActive ? t("yes") : t("no")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
