import { Examination, recruitmentAPI } from "@/services/api/recruitment";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "@/store/theme-store";
import { getColors } from "@/theme/colors";

export default function CandidateExamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; applicationId?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("recruitment");
  const { t: tCommon } = useTranslation("common");
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = useCallback(async (applicationId: number) => {
    try {
      setLoading(true);
      const examsData = await recruitmentAPI.getExaminationsToDo(applicationId);
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (error) {
      console.error("Error fetching exams:", error);
      Alert.alert(tCommon("error"), t("failedToLoadExaminations"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    if (params.applicationId) {
      fetchExams(Number(params.applicationId));
    } else {
      setLoading(false);
      Alert.alert(tCommon("error"), t("applicationIdRequired"));
      router.back();
    }
  }, [params.applicationId, fetchExams, router, t, tCommon]);

  const onRefresh = () => {
    if (params.applicationId) {
      setRefreshing(true);
      fetchExams(Number(params.applicationId));
    }
  };

  const handleExamPress = (exam: Examination) => {
    router.push(
      `/recruitment/candidates/${params.id}/exams/${exam.examinationId}`
    );
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
      month: "short",
      day: "numeric",
    });
  };

  const renderExamItem = ({ item }: { item: Examination }) => (
    <TouchableOpacity
      onPress={() => handleExamPress(item)}
      className="rounded-lg p-4 mb-3 border shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            {t("examination")} #{item.examinationId}
          </Text>
          {item.submittedAt && (
            <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
              {t("submitted")}: {formatDate(item.submittedAt)}
            </Text>
          )}
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {t("created")}: {formatDate(item.createdAt)}
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full ml-2"
          style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: getStatusColor(item.status) }}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center">
          <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
          <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
            {item.examQuestions?.length || 0} {t("questions")}
          </Text>
        </View>
        {item.totalScore !== null && item.totalScore !== undefined && (
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text className="text-xs font-semibold ml-1" style={{ color: colors.text }}>
              {t("score")}: {item.totalScore.toFixed(1)}/10
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
      <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
        {t("noExaminationsFound")}
      </Text>
      <Text className="mt-2" style={{ color: colors.textTertiary }}>
        {t("noExaminationsForApplication")}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t("loadingExaminations")}</Text>
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
              {t("examinations")}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {exams.length} {t("examination")}{exams.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Exams List */}
      <FlatList
        data={exams}
        renderItem={renderExamItem}
        keyExtractor={(item) => item.examinationId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
