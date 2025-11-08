import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useProtectedRoute } from '@/hooks';
import { analyticsAPI, AnalyticsSummary, HiringFunnelData, DepartmentStats, TrendData } from '@/services/api/analytics';
import { LineChart, PieChart, BarChart, FunnelChart } from '@/components/ui/charts';
import { recruitmentAPI } from '@/services/api/recruitment';
import { exportService } from '@/utils/export';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function ReportsScreen() {
  useProtectedRoute();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(undefined);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [hiringFunnel, setHiringFunnel] = useState<HiringFunnelData[]>([]);
  const [applicationTrends, setApplicationTrends] = useState<TrendData[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const loadReportsData = useCallback(async () => {
    try {
      setLoading(true);

      const [summaryData, funnelData, trendsData, jobsRes] = await Promise.all([
        analyticsAPI.getSummary({ period, jobId: selectedJobId }),
        analyticsAPI.getHiringFunnel(selectedJobId),
        analyticsAPI.getApplicationTrends({ period }),
        recruitmentAPI.getJobPostings({ limit: 100 }),
      ]);

      setSummary(summaryData);
      setHiringFunnel(funnelData);
      setApplicationTrends(trendsData);
      setDepartmentStats(summaryData.topDepartments);
      setJobs(jobsRes.data || []);
    } catch (error) {
      console.error('Failed to load reports data:', error);
      Alert.alert(tCommon('error'), t('failedToLoadReports'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, selectedJobId]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReportsData();
  };

  const handleExport = async () => {
    try {
      await exportService.exportReportsToCSV(summary, applicationTrends, hiringFunnel);
    } catch (error) {
      console.error('Error exporting reports:', error);
      Alert.alert(tCommon('error'), t('failedToExportReports'));
    }
  };

  if (loading && !summary) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingReports')}</Text>
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
          <Text className="text-xl font-bold flex-1 ml-3" style={{ color: colors.text }}>{t('reports')}</Text>
          <TouchableOpacity onPress={handleExport} className="p-2">
            <Ionicons name="download-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View className="mt-3 space-y-3">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>{t('period')}</Text>
              <View className="border rounded-lg" style={{ borderColor: colors.border }}>
                <Picker
                  selectedValue={period}
                  onValueChange={(value) => setPeriod(value)}
                  style={{ height: 40, color: colors.text }}
                >
                  <Picker.Item label={t('last7Days')} value="7d" />
                  <Picker.Item label={t('last30Days')} value="30d" />
                  <Picker.Item label={t('last90Days')} value="90d" />
                  <Picker.Item label={t('lastYear')} value="1y" />
                  <Picker.Item label={t('allTime')} value="all" />
                </Picker>
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>{t('job')}</Text>
              <View className="border rounded-lg" style={{ borderColor: colors.border }}>
                <Picker
                  selectedValue={selectedJobId || 0}
                  onValueChange={(value) => setSelectedJobId(value === 0 ? undefined : value)}
                  style={{ height: 40, color: colors.text }}
                >
                  <Picker.Item label={t('allJobs')} value={0} />
                  {jobs.map((job) => (
                    <Picker.Item
                      key={job.jobPostingId}
                      label={job.title}
                      value={job.jobPostingId}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Summary Stats */}
          {summary && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{t('summary')}</Text>
              <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                <View className="flex-row flex-wrap -mx-2">
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t('totalJobs')}</Text>
                    <Text className="text-2xl font-bold" style={{ color: colors.text }}>{summary.totalJobs}</Text>
                    <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {summary.recentJobs} {t('inPeriod')}
                    </Text>
                  </View>
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t('totalApplications')}</Text>
                    <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                      {summary.totalApplications}
                    </Text>
                    <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {summary.recentApplications} {t('inPeriod')}
                    </Text>
                  </View>
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t('totalCandidates')}</Text>
                    <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                      {summary.totalCandidates}
                    </Text>
                    <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {summary.recentCandidates} {t('inPeriod')}
                    </Text>
                  </View>
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t('totalInterviews')}</Text>
                    <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                      {summary.totalInterviews}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Hiring Funnel */}
          {hiringFunnel.length > 0 && (
            <View className="mb-6">
              <FunnelChart title={t('hiringFunnel')} data={hiringFunnel} />
            </View>
          )}

          {/* Application Trends */}
          {applicationTrends.length > 0 && (
            <View className="mb-6">
              <LineChart
                title={`${t('applicationTrends')} (${period})`}
                data={applicationTrends.map((item) => ({
                  x: new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }),
                  y: item.value,
                }))}
                color="#2563eb"
              />
            </View>
          )}

          {/* Status Breakdown */}
          {summary && summary.applicationStatusBreakdown.length > 0 && (
            <View className="mb-6">
              <PieChart
                title={t('applicationStatusDistribution')}
                data={summary.applicationStatusBreakdown.map((item) => ({
                  x: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                  y: item.count,
                }))}
              />
            </View>
          )}

          {/* Job Status Breakdown */}
          {summary && summary.jobStatusBreakdown.length > 0 && (
            <View className="mb-6">
              <PieChart
                title={t('jobStatusDistribution')}
                data={summary.jobStatusBreakdown.map((item) => ({
                  x: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                  y: item.count,
                }))}
              />
            </View>
          )}

          {/* Department Stats */}
          {departmentStats.length > 0 && (
            <View className="mb-6">
              <BarChart
                title={t('topDepartmentsByJobCount')}
                data={departmentStats.map((item) => ({
                  x: item.departmentName,
                  y: item.jobCount,
                }))}
                color="#10b981"
              />
            </View>
          )}

          {/* Department Application Stats */}
          {departmentStats.length > 0 && (
            <View className="mb-6">
              <BarChart
                title={t('topDepartmentsByApplicationCount')}
                data={departmentStats.map((item) => ({
                  x: item.departmentName,
                  y: item.applicationCount,
                }))}
                color="#f59e0b"
              />
            </View>
          )}

          {/* Department Interview Stats */}
          {departmentStats.length > 0 && (
            <View className="mb-6">
              <BarChart
                title={t('topDepartmentsByInterviewCount')}
                data={departmentStats.map((item) => ({
                  x: item.departmentName,
                  y: item.interviewCount,
                }))}
                color="#8b5cf6"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

