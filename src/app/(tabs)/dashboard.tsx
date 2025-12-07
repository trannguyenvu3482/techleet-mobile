import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProtectedRoute } from '@/hooks';
import { SafeAreaScrollView, StatCard, Skeleton } from '@/components/ui';
import { LineChart, PieChart, BarChart, FunnelChart } from '@/components/ui/charts';
import { Ionicons } from '@expo/vector-icons';
import { analyticsAPI, DashboardStats, StatusBreakdown, TrendData, HiringFunnelData, DepartmentStats } from '@/services/api/analytics';
import { employeeAPI } from '@/services/api/employees';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function Dashboard() {
  useProtectedRoute();
  const { t } = useTranslation('dashboard');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalCandidates: 0,
    totalInterviews: 0,
    interviewsThisWeek: 0,
    recentApplications: 0,
    recentCandidates: 0,
  });
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [applicationTrends, setApplicationTrends] = useState<TrendData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [hiringFunnel, setHiringFunnel] = useState<HiringFunnelData[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardStats, employeesRes, summary, trends, funnel] = await Promise.all([
        analyticsAPI.getDashboardStats({ period: '30d' }),
        employeeAPI.getEmployees({ limit: 1 }),
        analyticsAPI.getSummary({ period: '30d' }),
        analyticsAPI.getApplicationTrends({ period: '30d' }),
        analyticsAPI.getHiringFunnel(),
      ]);

      setStats(dashboardStats);
      setTotalEmployees(employeesRes.total || 0);
      
      setApplicationTrends(trends);
      setStatusBreakdown(summary.applicationStatusBreakdown);
      setHiringFunnel(funnel);
      setDepartmentStats(summary.topDepartments);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <SafeAreaScrollView>
        <View className="p-4">
          <Skeleton width="60%" height={32} className="mb-6" />
          <View className="flex-row flex-wrap -mx-2 mb-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} className="w-1/2 px-2 mb-4">
                <Skeleton width="100%" height={100} borderRadius={12} />
              </View>
            ))}
          </View>
          <Skeleton width="40%" height={24} className="mb-4" />
          <Skeleton width="100%" height={200} borderRadius={12} className="mb-4" />
        </View>
      </SafeAreaScrollView>
    );
  }

  return (
    <SafeAreaScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>{t('title')}</Text>

        {/* Key Metrics - 2x2 Grid */}
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2">
            <StatCard
              title={t('totalEmployees')}
              value={totalEmployees.toLocaleString()}
              subtitle={`${stats.totalJobs} ${t('activeJobs').toLowerCase()}`}
              icon="people-outline"
              iconColor="#3b82f6"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title={t('activeJobs')}
              value={stats.activeJobs.toLocaleString()}
              subtitle={`${stats.totalJobs} ${t('totalJobs')}`}
              icon="briefcase-outline"
              iconColor="#10b981"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title={t('pendingApps')}
              value={stats.pendingApplications.toLocaleString()}
              subtitle={`${stats.totalApplications} ${t('totalApplications')}`}
              icon="document-text-outline"
              iconColor="#f59e0b"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title={t('interviews')}
              value={stats.interviewsThisWeek.toLocaleString()}
              subtitle={`${stats.totalInterviews} ${t('totalInterviews')}`}
              icon="calendar-outline"
              iconColor="#8b5cf6"
            />
          </View>
        </View>

        {/* Charts Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{t('analytics')}</Text>
          
          {/* Application Trends */}
          {applicationTrends.length > 0 && (
            <View className="mb-4">
              <LineChart
                title={t('applicationTrends')}
                data={applicationTrends.map((item) => ({
                  x: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  y: item.value,
                }))}
                color="#2563eb"
              />
            </View>
          )}

          {/* Status Distribution */}
          {statusBreakdown.length > 0 && (
            <View className="mb-4">
              <PieChart
                title={t('statusDistribution')}
                data={statusBreakdown.map((item) => ({
                  x: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                  y: item.count,
                }))}
              />
            </View>
          )}

          {/* Hiring Funnel */}
          {hiringFunnel.length > 0 && (
            <View className="mb-4">
              <FunnelChart
                title={t('hiringFunnel')}
                data={hiringFunnel}
              />
            </View>
          )}

          {/* Department Stats */}
          {departmentStats.length > 0 && (
            <View className="mb-4">
              <BarChart
                title={t('topDepartments')}
                data={departmentStats.map((item) => ({
                  x: item.departmentName,
                  y: item.jobCount,
                }))}
                color="#10b981"
              />
            </View>
          )}
        </View>

        {/* Recent Activity Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{t('recentActivity')}</Text>
          <View className="rounded-lg shadow-sm" style={{ backgroundColor: colors.card }}>
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('newApplicationReceived')}</Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Frontend Developer position - 2 {t('minutesAgo')}</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('interviewScheduled')}</Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>John Doe - Backend Developer - Tomorrow 2:00 PM</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-yellow-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('jobPostingPublished')}</Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Senior React Developer - 1 {t('hoursAgo')}</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('newEmployeeOnboarded')}</Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Jane Smith - Marketing Team - 3 {t('hoursAgo')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{t('quickActions')}</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center" style={{ backgroundColor: colors.card }}>
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="person-add-outline" size={24} color="#2563eb" />
              </View>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('addEmployee')}</Text>
            </View>
            
            <View className="rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center" style={{ backgroundColor: colors.card }}>
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="add-circle-outline" size={24} color="#10b981" />
              </View>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('postJob')}</Text>
            </View>
            
            <View className="rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center" style={{ backgroundColor: colors.card }}>
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="document-text-outline" size={24} color="#8b5cf6" />
              </View>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('viewDocuments')}</Text>
            </View>
            
            <View className="rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center" style={{ backgroundColor: colors.card }}>
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="analytics-outline" size={24} color="#f59e0b" />
              </View>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{t('viewReports')}</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaScrollView>
  );
}
