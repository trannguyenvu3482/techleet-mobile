import { JobPosting, recruitmentAPI } from "@/services/api/recruitment";
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

interface Application {
  applicationId: number;
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  score: number | null;
  screeningScore: number | null;
}

export default function JobApplicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("recruitment");
  const { t: tCommon } = useTranslation("common");
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchJob = useCallback(async (jobId: number) => {
    try {
      const jobData = await recruitmentAPI.getJobPostingById(jobId);
      setJob(jobData);
    } catch (error) {
      console.error("Error fetching job:", error);
      Alert.alert(tCommon("error"), t("failedToLoadJobDetails"));
    }
  }, [t, tCommon]);

  const fetchApplications = useCallback(async (jobId: number) => {
    try {
      setRefreshing(true);
      const response = await recruitmentAPI.getApplicationsByJobId(jobId);
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      Alert.alert(tCommon("error"), t("failedToLoadApplications"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    if (params.id) {
      const jobId = Number(params.id);
      fetchJob(jobId);
      fetchApplications(jobId);
    }
  }, [params.id, fetchJob, fetchApplications]);

  const onRefresh = () => {
    if (params.id) {
      fetchApplications(Number(params.id));
    }
  };

  const handleApplicationPress = (application: Application) => {
    router.push(`/recruitment/candidates/${application.candidateId}`);
  };

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
    return t(`status.${status.toLowerCase()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      onPress={() => handleApplicationPress(item)}
      className="rounded-lg p-4 mb-3 border shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            {item.firstName} {item.lastName}
          </Text>
          <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>{item.email}</Text>
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

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
            {t("applied")} {formatDate(item.createdAt)}
          </Text>
        </View>
        {(typeof item.screeningScore === 'number' || typeof item.score === 'number') && (
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={14} color={colors.warning} />
            <Text className="text-xs font-semibold ml-1" style={{ color: colors.text }}>
              {t("score")}: {(item.screeningScore ?? item.score)?.toFixed(1)}
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
        {t("noApplicationsFound")}
      </Text>
      <Text className="mt-2" style={{ color: colors.textTertiary }}>
        {statusFilter === "all"
          ? t("noApplicationsForJob")
          : t("noApplicationsWithStatus", { status: getStatusLabel(statusFilter) })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t("loadingApplications")}</Text>
        </View>
      </View>
    );
  }

  const uniqueStatuses = Array.from(
    new Set(applications.map((app) => app.status.toLowerCase()))
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: colors.text }} numberOfLines={1}>
              {job?.title || t("applications")}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {filteredApplications.length} {t("application")}
              {filteredApplications.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Status Filter */}
        {uniqueStatuses.length > 0 && (
          <View className="flex-row gap-2 flex-wrap">
            <TouchableOpacity
              onPress={() => setStatusFilter("all")}
              className="px-3 py-2 rounded-lg"
              style={{ backgroundColor: statusFilter === "all" ? colors.primary : colors.surface }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: statusFilter === "all" ? "white" : colors.text }}
              >
                {tCommon("all")}
              </Text>
            </TouchableOpacity>
            {uniqueStatuses.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: statusFilter === status ? colors.primary : colors.surface }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: statusFilter === status ? "white" : colors.text }}
                >
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.applicationId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
