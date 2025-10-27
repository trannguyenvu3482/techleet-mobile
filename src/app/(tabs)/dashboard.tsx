import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useProtectedRoute } from '@/hooks';
import { SafeAreaScrollView, StatCard } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

interface DashboardStats {
  totalEmployees: number;
  activeJobs: number;
  pendingApplications: number;
  interviewsThisWeek: number;
}

export default function Dashboard() {
  useProtectedRoute();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeJobs: 0,
    pendingApplications: 0,
    interviewsThisWeek: 0,
  });

  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API call
      // const data = await dashboardAPI.getDashboardStats();
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      setStats({
        totalEmployees: 106,
        activeJobs: 12,
        pendingApplications: 77,
        interviewsThisWeek: 8,
      });
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
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading dashboard...</Text>
        </View>
      </SafeAreaScrollView>
    );
  }

  return (
    <SafeAreaScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Dashboard</Text>

        {/* Key Metrics - 2x2 Grid */}
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2">
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees.toLocaleString()}
              subtitle="+2 from last month"
              icon="people-outline"
              iconColor="#3b82f6"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title="Active Jobs"
              value={stats.activeJobs.toLocaleString()}
              subtitle="+3 from last week"
              icon="briefcase-outline"
              iconColor="#10b981"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title="Pending Apps"
              value={stats.pendingApplications.toLocaleString()}
              subtitle="+12 from yesterday"
              icon="document-text-outline"
              iconColor="#f59e0b"
            />
          </View>
          
          <View className="w-1/2 px-2">
            <StatCard
              title="Interviews"
              value={stats.interviewsThisWeek.toLocaleString()}
              subtitle="+2 from last week"
              icon="calendar-outline"
              iconColor="#8b5cf6"
            />
          </View>
        </View>

        {/* Recent Activity Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</Text>
          <View className="bg-white rounded-lg shadow-sm">
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">New application received</Text>
                  <Text className="text-xs text-gray-500 mt-1">Frontend Developer position - 2 minutes ago</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">Interview scheduled</Text>
                  <Text className="text-xs text-gray-500 mt-1">John Doe - Backend Developer - Tomorrow 2:00 PM</Text>
                </View>
              </View>
            </View>
            
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-yellow-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">Job posting published</Text>
                  <Text className="text-xs text-gray-500 mt-1">Senior React Developer - 1 hour ago</Text>
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
