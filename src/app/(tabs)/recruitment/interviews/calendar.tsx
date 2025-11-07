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
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentAPI, Interview } from '@/services/api/recruitment';

// Calendar Grid Component
interface CalendarGridProps {
  interviews: Interview[];
  onInterviewPress: (interview: Interview) => void;
  getStatusColor: (status?: string) => string;
  getStatusLabel: (status?: string) => string;
  formatDateTime: (dateString: string) => string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  interviews,
  onInterviewPress,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getInterviewsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return interviews.filter((interview) => {
      if (!interview.scheduledAt) return false;
      const interviewDate = new Date(interview.scheduledAt);
      if (isNaN(interviewDate.getTime())) return false;
      try {
        return interviewDate.toISOString().split('T')[0] === dateStr;
      } catch {
        return false;
      }
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const renderDay = (day: number, dayIndex: number) => {
    if (day === 0) {
      return <View key={`empty-${dayIndex}`} className="aspect-square" />;
    }

    const date = new Date(year, month, day);
    const dayInterviews = getInterviewsForDate(date);
    const isTodayDate = isToday(day);

    return (
      <TouchableOpacity
        key={`day-${day}`}
        className={`aspect-square border border-gray-200 p-1 ${isTodayDate ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}
        onPress={() => {
          if (dayInterviews.length > 0) {
            onInterviewPress(dayInterviews[0]);
          }
        }}
      >
        <Text
          className={`text-xs font-semibold mb-1 ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}
        >
          {day}
        </Text>
        {dayInterviews.length > 0 && (
          <View className="flex-1">
            {dayInterviews.slice(0, 2).map((interview) => (
              <View
                key={interview.interviewId}
                className="px-1 py-0.5 mb-0.5 rounded"
                style={{ backgroundColor: `${getStatusColor(interview.status)}20` }}
              >
                <Text
                  className="text-[10px] font-semibold"
                  style={{ color: getStatusColor(interview.status) }}
                  numberOfLines={1}
                >
                  #{interview.interviewId}
                </Text>
              </View>
            ))}
            {dayInterviews.length > 2 && (
              <Text className="text-[10px] text-gray-600">+{dayInterviews.length - 2}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Month Navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={goToPreviousMonth} className="p-2">
          <Ionicons name="chevron-back" size={20} color="#2563eb" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} className="p-2">
          <Ionicons name="chevron-forward" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View className="flex-row mb-2">
        {dayNames.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-xs font-semibold text-gray-600">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {Array.from({ length: 42 }, (_, i) => {
          const day = i < startingDayOfWeek ? 0 : i - startingDayOfWeek + 1;
          return day > daysInMonth ? 0 : day;
        }).map((day, index) => renderDay(day, index))}
      </View>
    </View>
  );
};

export default function InterviewCalendarScreen() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await recruitmentAPI.getInterviews({
        limit: 500,
        sortBy: 'scheduledAt',
        sortOrder: 'ASC',
      });
      setInterviews(response.data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      Alert.alert('Error', 'Failed to load interviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInterviews();
  };

  const handleInterviewPress = (interview: Interview) => {
    router.push(`/recruitment/interviews/${interview.interviewId}`);
  };

  const handleCreateInterview = () => {
    router.push('/recruitment/interviews/form');
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'scheduled':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      case 'rescheduled':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInterviewsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return interviews.filter((interview) => {
      if (!interview.scheduledAt) return false;
      const interviewDate = new Date(interview.scheduledAt);
      if (isNaN(interviewDate.getTime())) return false;
      try {
        return interviewDate.toISOString().split('T')[0] === dateStr;
      } catch {
        return false;
      }
    });
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const upcomingDates = [today, tomorrow, dayAfter];

  // Get most upcoming interview
  const now = new Date();
  const upcomingInterview = interviews
    .filter((i) => {
      if (!i.scheduledAt || i.status === 'cancelled') return false;
      const interviewDate = new Date(i.scheduledAt);
      return !isNaN(interviewDate.getTime()) && interviewDate >= now;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduledAt || 0);
      const dateB = new Date(b.scheduledAt || 0);
      return dateA.getTime() - dateB.getTime();
    })[0];

  if (loading && interviews.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading interviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Interview Calendar</Text>
          <TouchableOpacity
            onPress={handleCreateInterview}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Stats */}
        <View className="px-4 pt-4">
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Quick Stats</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {interviews.filter((i) => i.status === 'scheduled').length}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">Scheduled</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {interviews.filter((i) => i.status === 'completed').length}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">Completed</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {interviews.filter((i) => i.status === 'cancelled').length}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">Cancelled</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Most Upcoming Interview */}
        {upcomingInterview && (
          <View className="px-4 pt-2">
            <View className="bg-blue-600 rounded-lg p-4 mb-4 border border-blue-200 shadow-lg">
              <View className="flex-row items-center mb-2">
                <Ionicons name="calendar" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Next Interview</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleInterviewPress(upcomingInterview)}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base mb-1">
                  Interview #{upcomingInterview.interviewId}
                </Text>
                <Text className="text-blue-100 text-sm mb-2">
                  {formatDateTime(upcomingInterview.scheduledAt)}
                </Text>
                {upcomingInterview.location && (
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="location-outline" size={14} color="white" />
                    <Text className="text-blue-100 text-xs ml-1">
                      {upcomingInterview.location}
                    </Text>
                  </View>
                )}
                {upcomingInterview.meetingUrl && (
                  <View className="flex-row items-center">
                    <Ionicons name="videocam-outline" size={14} color="white" />
                    <Text className="text-blue-100 text-xs ml-1">Online</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Calendar Month View */}
        <View className="px-4 pt-2">
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Calendar View</Text>
            <CalendarGrid
              interviews={interviews}
              onInterviewPress={handleInterviewPress}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              formatDateTime={formatDateTime}
            />
          </View>
        </View>

        {/* Upcoming Interviews by Date */}
        <View className="px-4 pb-6">
          {upcomingDates.map((date, index) => {
            const dayInterviews = getInterviewsForDate(date);
            if (dayInterviews.length === 0 && index === 0) {
              return <View key={`date-empty-${index}`} />;
            }

            return (
              <View key={`date-${date.getTime()}-${index}`} className="mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  {formatDateHeader(date)}
                  {index === 0 && ' (Today)'}
                  {index === 1 && ' (Tomorrow)'}
                </Text>

                {dayInterviews.length > 0 ? (
                  dayInterviews.map((interview) => (
                    <TouchableOpacity
                      key={interview.interviewId}
                      onPress={() => handleInterviewPress(interview)}
                      className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 mb-1">
                            Interview #{interview.interviewId}
                          </Text>
                          <Text className="text-sm text-gray-600 mb-1">
                            {formatDateTime(interview.scheduledAt)}
                          </Text>
                          {interview.location && (
                            <View className="flex-row items-center mt-1">
                              <Ionicons name="location-outline" size={14} color="#6b7280" />
                              <Text className="text-xs text-gray-600 ml-1">
                                {interview.location}
                              </Text>
                            </View>
                          )}
                          {interview.meetingUrl && (
                            <View className="flex-row items-center mt-1">
                              <Ionicons name="videocam-outline" size={14} color="#6b7280" />
                              <Text className="text-xs text-blue-600 ml-1">Online</Text>
                            </View>
                          )}
                        </View>
                        <View
                          className={`px-3 py-1 rounded-full ml-2`}
                          style={{ backgroundColor: `${getStatusColor(interview.status)}20` }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: getStatusColor(interview.status) }}
                          >
                            {getStatusLabel(interview.status)}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
                        <Ionicons name="time-outline" size={14} color="#6b7280" />
                        <Text className="text-xs text-gray-600 ml-1">
                          Duration: {interview.duration} minutes
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="bg-white rounded-lg p-4 border border-gray-200">
                    <Text className="text-sm text-gray-500 text-center">
                      No interviews scheduled
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {interviews.length === 0 && (
          <View className="items-center justify-center py-12 px-4">
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text className="text-lg font-semibold text-gray-500 mt-4">
              No interviews scheduled
            </Text>
            <TouchableOpacity
              onPress={handleCreateInterview}
              className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Schedule Interview</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
