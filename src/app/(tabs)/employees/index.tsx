import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useProtectedRoute } from '@/hooks';
import { SafeAreaScrollView, EmployeeCard, EmptyState } from '@/components/ui';
import { EmployeeResponseDto } from '@/types/employee';
import { employeeAPI } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

export default function EmployeesScreen() {
  useProtectedRoute();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('employees');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
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
      setError(tCommon('failedToLoad'));
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
        <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>Employees</Text>
        <TouchableOpacity className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.primary }}>
          <Text className="text-white font-semibold">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="relative">
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.textSecondary}
          className="absolute left-3 top-3 z-10"
          style={{ position: 'absolute', left: 12, top: 12 }}
        />
        <TextInput
          className="rounded-lg pl-10 pr-4 py-3"
          placeholder="Search employees..."
          placeholderTextColor={colors.textTertiary}
          value={searchTerm}
          onChangeText={handleSearch}
          style={{ backgroundColor: colors.card, color: colors.text }}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="people-outline"
      title={t('noEmployees')}
      description={t('addEmployees')}
    />
  );

  if (loading && employees.length === 0) {
    return (
      <SafeAreaScrollView>
        {renderHeader()}
        <View className="flex-1 items-center justify-center min-h-[400px]">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{tCommon('loadingData')}</Text>
        </View>
      </SafeAreaScrollView>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-2 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>{t('title')}</Text>
          <TouchableOpacity className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.primary }}>
            <Text className="text-white font-semibold">{tCommon('add')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative">
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
            style={{ position: 'absolute', left: 12, top: 12 }}
          />
          <TextInput
            className="rounded-lg pl-10 pr-4 py-3"
            placeholder={t('search')}
            placeholderTextColor={colors.textTertiary}
            value={searchTerm}
            onChangeText={handleSearch}
            style={{ backgroundColor: colors.card, color: colors.text }}
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
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}

