import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useProtectedRoute } from '@/hooks';
import { SafeAreaScrollView, StatCard } from '@/components/ui';
import { LineChart, PieChart, BarChart, FunnelChart } from '@/components/ui/charts';
import { Ionicons } from '@expo/vector-icons';
import { analyticsAPI, DashboardStats, StatusBreakdown, TrendData, HiringFunnelData, DepartmentStats } from '@/services/api/analytics';
import { employeeAPI } from '@/services/api/employees';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function Dashboard() {
  useProtectedRoute();
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
        <View className="flex-1 items-center justify-center min-h-[400px]">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>Loading dashboard...</Text>
        </View>
      </SafeAreaScrollView>
    );
  }

  return (
    <SafeAreaScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>Dashboard</Text>

        {/* Key Metrics - 2x2 Grid */}
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2">
            <StatCard
              title="Total Employees"
              value={totalEmployees.toLocaleString()}
              subtitle={`${stats.totalJobs} active jobs`}
              icon="people-outline"
              iconColor="#3b82f6"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title="Active Jobs"
              value={stats.activeJobs.toLocaleString()}
              subtitle={`${stats.totalJobs} total jobs`}
              icon="briefcase-outline"
              iconColor="#10b981"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title="Pending Apps"
              value={stats.pendingApplications.toLocaleString()}
              subtitle={`${stats.totalApplications} total applications`}
              icon="document-text-outline"
              iconColor="#f59e0b"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title="Interviews"
              value={stats.interviewsThisWeek.toLocaleString()}
              subtitle={`${stats.totalInterviews} total interviews`}
              icon="calendar-outline"
              iconColor="#8b5cf6"
            />
          </View>
        </View>

        {/* Charts Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Analytics</Text>
          
          {/* Application Trends */}
          {applicationTrends.length > 0 && (
            <View className="mb-4">
              <LineChart
                title="Application Trends (Last 30 Days)"
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
                title="Application Status Distribution"
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
                title="Hiring Funnel"
                data={hiringFunnel}
              />
            </View>
          )}

          {/* Department Stats */}
          {departmentStats.length > 0 && (
            <View className="mb-4">
              <BarChart
                title="Top Departments by Job Count"
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
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Recent Activity</Text>
          <View className="rounded-lg shadow-sm" style={{ backgroundColor: colors.card }}>
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>New application received</Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Frontend Developer position - 2 minutes ago</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>Interview scheduled</Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>John Doe - Backend Developer - Tomorrow 2:00 PM</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-yellow-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>Job posting published</Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Senior React Developer - 1 hour ago</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">New employee onboarded</Text>
                  <Text className="text-xs text-gray-500 mt-1">Jane Smith - Marketing Team - 3 hours ago</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-white rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center">
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="person-add-outline" size={24} color="#2563eb" />
              </View>
              <Text className="text-sm font-semibold text-gray-800">Add Employee</Text>
            </View>
            
            <View className="bg-white rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center">
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="add-circle-outline" size={24} color="#10b981" />
              </View>
              <Text className="text-sm font-semibold text-gray-800">Post Job</Text>
            </View>
            
            <View className="bg-white rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center">
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="document-text-outline" size={24} color="#8b5cf6" />
              </View>
              <Text className="text-sm font-semibold text-gray-800">View Documents</Text>
            </View>
            
            <View className="bg-white rounded-lg shadow-sm p-4 flex-1 min-w-[48%] items-center">
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="analytics-outline" size={24} color="#f59e0b" />
              </View>
              <Text className="text-sm font-semibold text-gray-800">View Reports</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaScrollView>
  );
}
