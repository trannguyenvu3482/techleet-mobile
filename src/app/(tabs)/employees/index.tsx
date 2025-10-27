import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProtectedRoute } from '@/hooks';
import { SafeAreaScrollView, EmployeeCard } from '@/components/ui';
import { EmployeeResponseDto } from '@/types/employee';
import { employeeAPI } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmployeesScreen() {
  useProtectedRoute();
  const [employees, setEmployees] = useState<EmployeeResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async (keyword?: string) => {
    try {
      setError(null);
      const response = await employeeAPI.getEmployees({ keyword, page: 0, limit: 50 });
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees(searchTerm || undefined);
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    // Debounce search - fetch after user stops typing
    if (text.trim()) {
      setTimeout(() => {
        fetchEmployees(text);
      }, 500);
    } else {
      fetchEmployees();
    }
  };

  const handleEmployeePress = (employee: EmployeeResponseDto) => {
    // TODO: Navigate to employee detail
    console.log('Press employee:', employee.employeeId);
  };

  const handleEdit = (employee: EmployeeResponseDto) => {
    // TODO: Navigate to edit screen
    console.log('Edit employee:', employee.employeeId);
  };

  const renderHeader = () => (
    <View className="mb-4">
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl font-bold text-gray-900 flex-1">Employees</Text>
        <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg">
          <Text className="text-white font-semibold">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="relative">
        <Ionicons
          name="search-outline"
          size={20}
          color="#9ca3af"
          className="absolute left-3 top-3 z-10"
          style={{ position: 'absolute', left: 12, top: 12 }}
        />
        <TextInput
          className="bg-gray-100 rounded-lg pl-10 pr-4 py-3 text-gray-900"
          placeholder="Search employees..."
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={handleSearch}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="people-outline" size={64} color="#d1d5db" />
      <Text className="text-lg font-semibold text-gray-500 mt-4">No employees found</Text>
      <Text className="text-gray-400 mt-2">Add employees to get started</Text>
    </View>
  );

  if (loading && employees.length === 0) {
    return (
      <SafeAreaScrollView>
        {renderHeader()}
        <View className="flex-1 items-center justify-center min-h-[400px]">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading employees...</Text>
        </View>
      </SafeAreaScrollView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Employees</Text>
          <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-semibold">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative">
          <Ionicons
            name="search-outline"
            size={20}
            color="#9ca3af"
            style={{ position: 'absolute', left: 12, top: 12 }}
          />
          <TextInput
            className="bg-gray-100 rounded-lg pl-10 pr-4 py-3 text-gray-900"
            placeholder="Search employees..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <FlatList
        data={employees}
        renderItem={({ item }) => (
          <EmployeeCard
            employee={item}
            onPress={() => handleEmployeePress(item)}
            onEdit={() => handleEdit(item)}
          />
        )}
        keyExtractor={(item) => item.employeeId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

