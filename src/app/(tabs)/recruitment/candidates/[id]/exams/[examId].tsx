import {
  Examination,
  recruitmentAPI
} from "@/services/api/recruitment";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useState } from "react";
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
import { useThemeStore } from "@/store/theme-store";
import { getColors } from "@/theme/colors";

export default function CandidateExamDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; examId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("recruitment");
  const { t: tCommon } = useTranslation("common");
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [exam, setExam] = useState<Examination | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingScores, setEditingScores] = useState<Record<number, number>>(
    {}
  );
  const [showEditMode, setShowEditMode] = useState(false);

  const fetchExam = useCallback(
    async (examId: number) => {
      try {
        setLoading(true);
        const examData = await recruitmentAPI.getExaminationDetail(examId);
        setExam(examData);

        // Initialize editing scores with current scores
        const scores: Record<number, number> = {};
        if (examData.examQuestions) {
          examData.examQuestions.forEach((eq) => {
            if (
              eq.examinationQuestionId &&
              eq.score !== null &&
              eq.score !== undefined
            ) {
              scores[eq.examinationQuestionId] = eq.score;
            }
          });
        }
        setEditingScores(scores);
      } catch (error) {
        console.error("Error fetching exam:", error);
        Alert.alert(tCommon("error"), t("failedToLoadExaminationDetails"));
        router.back();
      } finally {
        setLoading(false);
      }
    },
    [router, t, tCommon]
  );

  useEffect(() => {
    if (params.examId) {
      fetchExam(Number(params.examId));
    }
  }, [params.examId, fetchExam]);

  const handleScoreChange = (examQuestionId: number, score: string) => {
    const numScore = parseFloat(score) || 0;
    if (numScore < 0 || numScore > 10) {
      Alert.alert(t("invalidScore"), t("scoreMustBeBetween0And10"));
      return;
    }
    setEditingScores((prev) => ({
      ...prev,
      [examQuestionId]: numScore,
    }));
  };

  const handleSaveScores = async () => {
    if (!exam || !exam.examQuestions) return;

    try {
      setSaving(true);
      const updates: { examQuestionId: number; score: number }[] = [];

      exam.examQuestions.forEach((eq) => {
        const newScore = editingScores[eq.examinationQuestionId];
        if (
          newScore !== undefined &&
          eq.score !== null &&
          newScore !== eq.score
        ) {
          updates.push({
            examQuestionId: eq.examinationQuestionId,
            score: newScore,
          });
        }
      });

      if (updates.length > 0) {
        // Update each question's score individually
        await Promise.all(
          updates.map((update) =>
            recruitmentAPI.updateExamScore(update.examQuestionId, update.score)
          )
        );

        // Revaluate examination after updating all scores
        if (exam.examinationId) {
          await recruitmentAPI.revaluateExamination(exam.examinationId);
        }

        // Reload exam data
        if (params.examId) {
          await fetchExam(Number(params.examId));
        }
        setShowEditMode(false);
        Alert.alert(tCommon("success"), t("scoresUpdatedSuccessfully"));
      } else {
        Alert.alert(tCommon("info"), t("noScoresToUpdate"));
      }
    } catch (error) {
      console.error("Error saving scores:", error);
      Alert.alert(tCommon("error"), t("failedToUpdateScores"));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return colors.textSecondary;
    switch (status.toLowerCase()) {
      case "completed":
        return colors.success;
      case "pending":
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return tCommon("nA");
    return t(`status.${status.toLowerCase()}`);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return tCommon("nA");
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return colors.textSecondary;
    switch (difficulty.toLowerCase()) {
      case "easy":
        return colors.success;
      case "medium":
        return colors.warning;
      case "hard":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            {t("loadingExaminationDetails")}
          </Text>
        </View>
      </View>
    );
  }

  if (!exam) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
            {t("examinationNotFound")}
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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {t("examination")} #{exam.examinationId}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${getStatusColor(exam.status)}20` }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: getStatusColor(exam.status) }}
                >
                  {getStatusLabel(exam.status)}
                </Text>
              </View>
              {exam.totalScore !== null && exam.totalScore !== undefined && (
                <View className="flex-row items-center ml-3">
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text className="text-sm font-bold ml-1" style={{ color: colors.text }}>
                    {exam.totalScore.toFixed(1)}/10
                  </Text>
                </View>
              )}
            </View>
          </View>
          {exam.status === "completed" && (
            <TouchableOpacity
              onPress={() => setShowEditMode(!showEditMode)}
              className="ml-2"
            >
              <Ionicons
                name={showEditMode ? "checkmark-outline" : "create-outline"}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Metadata */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>{t("submitted")}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {formatDate(exam.submittedAt)}
            </Text>
          </View>
          <View>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>{t("questions")}</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {exam.examQuestions?.length || 0}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
        {/* Questions */}
        {exam.examQuestions && exam.examQuestions.length > 0 ? (
          <View className="space-y-4">
            {exam.examQuestions.map((question, index) => (
              <View
                key={question.examinationQuestionId}
                className="rounded-lg p-4 border"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <Text className="text-sm font-bold flex-1" style={{ color: colors.text }}>
                    {t("question")} {index + 1}
                  </Text>
                  {question.question?.difficulty && (
                    <View
                      className="px-2 py-1 rounded-full ml-2"
                      style={{
                        backgroundColor: `${getDifficultyColor(question.question.difficulty)}20`,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: getDifficultyColor(
                            question.question.difficulty
                          ),
                        }}
                      >
                        {t(`difficulty.${question.question.difficulty}`)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Question Content */}
                <View className="mb-3">
                  <Text className="text-sm leading-6" style={{ color: colors.text }}>
                    {question.question?.content || tCommon("nA")}
                  </Text>
                </View>

                {/* Answer */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
                    {t("answer")}
                  </Text>
                  <View className="rounded-lg p-3 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {question.answerText || t("noAnswerProvided")}
                    </Text>
                  </View>
                </View>

                {/* Score */}
                <View className="flex-row items-center justify-between border-t pt-3" style={{ borderTopColor: colors.border }}>
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="star-outline" size={16} color={colors.warning} />
                    <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
                      {t("score")}
                    </Text>
                  </View>
                  {showEditMode && exam.status === "completed" ? (
                    <View className="flex-row items-center flex-1 justify-end">
                      <TextInput
                        className="rounded-lg px-3 py-2 text-sm w-20 text-center"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, color: colors.text }}
                        value={
                          editingScores[
                            question.examinationQuestionId
                          ]?.toString() || "0"
                        }
                        onChangeText={(text) =>
                          handleScoreChange(
                            question.examinationQuestionId,
                            text
                          )
                        }
                        keyboardType="numeric"
                        placeholder="0-10"
                        placeholderTextColor={colors.textTertiary}
                        maxLength={4}
                      />
                      <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>/ 10</Text>
                    </View>
                  ) : (
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>
                      {question.score !== null && question.score !== undefined
                        ? `${question.score.toFixed(1)}/10`
                        : tCommon("nA")}
                    </Text>
                  )}
                </View>

                {/* Reason/Comment */}
                {question.reason && (
                  <View className="mt-3 pt-3 border-t" style={{ borderTopColor: colors.border }}>
                    <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
                      {t("comment")}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {question.reason}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
              {t("noQuestionsFound")}
            </Text>
          </View>
        )}

        {/* Save Button */}
        {showEditMode && exam.status === "completed" && (
          <TouchableOpacity
            onPress={handleSaveScores}
            disabled={saving}
            className="px-6 py-4 rounded-lg mt-4 mb-6"
            style={{ backgroundColor: saving ? colors.textTertiary : colors.primary, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold ml-2">{tCommon("saving")}</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-center">
                {t("saveScores")}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
