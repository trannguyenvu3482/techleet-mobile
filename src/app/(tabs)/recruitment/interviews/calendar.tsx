import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Interview } from '@/services/api/recruitment';
import { calendarService } from '@/services/calendar';
import * as Calendar from 'expo-calendar';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

type ViewMode = 'list' | 'week' | 'month';

export default function InterviewCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Calendar.Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchCalendarEvents = useCallback(async () => {
    try {
      const startDate = new Date(currentDate);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);

      const events = await calendarService.getEventsInRange(startDate, endDate);
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  }, [currentDate]);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const response = await recruitmentAPI.getInterviews({
        limit: 100,
        sortBy: 'scheduledAt',
        sortOrder: 'ASC',
      });
      // Filter only upcoming interviews (from today onwards, not cancelled)
      const upcoming = response.data.filter((interview) => {
        if (!interview.scheduledAt || interview.status === 'cancelled') return false;
        const interviewDate = new Date(interview.scheduledAt);
        if (isNaN(interviewDate.getTime())) return false;
        // Set time to start of day for comparison
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const interviewStart = new Date(interviewDate.getFullYear(), interviewDate.getMonth(), interviewDate.getDate());
        return interviewStart >= todayStart;
      });
      setInterviews(upcoming);
      await fetchCalendarEvents();
    } catch (error) {
      console.error('Error fetching interviews:', error);
      Alert.alert(tCommon('error'), t('failedToLoadInterviews'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchCalendarEvents, t, tCommon]);

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

  const handleAddToCalendar = async (interview: Interview) => {
    try {
      const candidateName = interview.application?.candidate
        ? `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`
        : t('unknownCandidate');
      const jobTitle = interview.application?.jobPosting?.title || t('unknownPosition');

      const event = calendarService.createInterviewEvent({
        interviewId: interview.interviewId,
        candidateName,
        jobTitle,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        location: interview.location,
        meetingUrl: interview.meetingUrl,
        notes: interview.notes,
      });

      const eventId = await calendarService.createEvent(event);
      if (eventId) {
        Alert.alert(tCommon('success'), t('interviewAddedToCalendar'));
        await fetchCalendarEvents();
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(tCommon('error'), t('failedToAddToCalendar'));
    }
  };

  const getInterviewsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return interviews.filter((interview) => {
      const interviewDate = new Date(interview.scheduledAt);
      return interviewDate.toDateString() === dateStr;
    });
  };

  const getCalendarEventsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === dateStr;
    });
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }

    return (
      <ScrollView className="flex-1">
        {days.map((date, index) => {
          const dayInterviews = getInterviewsForDate(date);
          const dayEvents = getCalendarEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <View key={index} className="mb-4 px-4">
              <View className="rounded-lg p-4 border" style={{ 
                backgroundColor: colors.card, 
                borderColor: isToday ? colors.primary : colors.border,
                borderWidth: isToday ? 2 : 1,
              }}>
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-sm font-semibold" style={{ color: isToday ? colors.primary : colors.textSecondary }}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text className="text-lg font-bold" style={{ color: isToday ? colors.primary : colors.text }}>
                      {date.getDate()}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {dayInterviews.length > 0 && (
                      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.primaryLight }}>
                        <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                          {dayInterviews.length} {dayInterviews.length !== 1 ? t('interviews') : t('interview')}
                        </Text>
                      </View>
                    )}
                    {dayEvents.length > 0 && (
                      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.purpleLight }}>
                        <Text className="text-xs font-semibold" style={{ color: colors.purple }}>
                          {dayEvents.length} {dayEvents.length !== 1 ? t('events') : t('event')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {dayInterviews.length > 0 && (
                  <View className="mt-2">
                    {dayInterviews.map((interview) => (
                      <TouchableOpacity
                        key={interview.interviewId}
                        onPress={() => handleInterviewPress(interview)}
                        className="mb-2 p-2 rounded-lg"
                        style={{ backgroundColor: `${getStatusColor(interview.status)}20` }}
                      >
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {formatDateTime(interview.scheduledAt)}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          {t('interview')} #{interview.interviewId}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {dayEvents.length > 0 && (
                  <View className="mt-2">
                    {dayEvents.map((event) => (
                      <View
                        key={event.id}
                        className="mb-2 p-2 rounded-lg border"
                        style={{ backgroundColor: colors.purpleLight, borderColor: colors.purple }}
                      >
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {new Date(event.startDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {dayInterviews.length === 0 && dayEvents.length === 0 && (
                  <Text className="text-xs text-center py-2" style={{ color: colors.textTertiary }}>{t('noEvents')}</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeks = [];
    let currentWeek = [];
    let dateIterator = new Date(startDate);

    while (dateIterator <= lastDay || currentWeek.length < 7) {
      currentWeek.push(new Date(dateIterator));
      dateIterator = new Date(dateIterator);
      dateIterator.setDate(dateIterator.getDate() + 1);

      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    return (
      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="px-4 py-2">
          <Text className="text-lg font-bold text-center mb-4" style={{ color: colors.text }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          <View className="flex-row mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{day}</Text>
              </View>
            ))}
          </View>

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} className="flex-row mb-1">
              {week.map((date, dayIndex) => {
                const dayInterviews = getInterviewsForDate(date);
                const dayEvents = getCalendarEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isCurrentMonth = date.getMonth() === month;

                return (
                  <TouchableOpacity
                    key={dayIndex}
                    onPress={() => {
                      setCurrentDate(new Date(date));
                      setViewMode('week');
                    }}
                    className="flex-1 aspect-square p-1 border"
                    style={{
                      borderColor: isToday ? colors.primary : colors.border,
                      borderWidth: isToday ? 2 : 1,
                      opacity: !isCurrentMonth ? 0.4 : 1,
                      backgroundColor: colors.card,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold mb-1"
                      style={{
                        color: isToday ? colors.primary : isCurrentMonth ? colors.text : colors.textTertiary,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                    {dayInterviews.length > 0 && (
                      <View className="flex-row flex-wrap gap-1">
                        {dayInterviews.slice(0, 3).map((interview) => (
                          <View
                            key={interview.interviewId}
                            className="h-1.5 flex-1 rounded"
                            style={{ backgroundColor: getStatusColor(interview.status) }}
                          />
                        ))}
                      </View>
                    )}
                    {dayEvents.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <View
                            key={event.id}
                            className="h-1.5 flex-1 rounded"
                            style={{ backgroundColor: colors.purple }}
                          />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
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

  // Get most upcoming interview
  const upcomingInterview = interviews.length > 0 ? interviews[0] : null;

  if (loading && interviews.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('loadingInterviews')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>{t('interviewCalendar')}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleCreateInterview}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">{t('schedule')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* View Mode Toggle */}
        <View className="flex-row gap-2 mb-2">
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            className="flex-1 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: viewMode === 'list' ? colors.primary : colors.card,
            }}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: viewMode === 'list' ? 'white' : colors.textSecondary,
              }}
            >
              {t('list')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('week')}
            className="flex-1 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: viewMode === 'week' ? colors.primary : colors.card,
            }}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: viewMode === 'week' ? 'white' : colors.textSecondary,
              }}
            >
              {t('week')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('month')}
            className="flex-1 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: viewMode === 'month' ? colors.primary : colors.card,
            }}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: viewMode === 'month' ? 'white' : colors.textSecondary,
              }}
            >
              {t('month')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigation (for week/month views) */}
        {(viewMode === 'week' || viewMode === 'month') && (
          <View className="flex-row items-center justify-between mt-2">
            <TouchableOpacity
              onPress={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setMonth(newDate.getMonth() - 1);
                }
                setCurrentDate(newDate);
              }}
              className="p-2"
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date())}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.card }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{tCommon('today')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setMonth(newDate.getMonth() + 1);
                }
                setCurrentDate(newDate);
              }}
              className="p-2"
            >
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View className="px-4 pt-4 pb-2">
        <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>{t('quickStats')}</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                {interviews.filter((i) => i.status === 'scheduled').length}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>{t('scheduled')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.secondary }}>
                {interviews.filter((i) => i.status === 'completed').length}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>{t('completed')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.textSecondary }}>
                {interviews.length}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>{t('upcoming')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Most Upcoming Interview */}
      {upcomingInterview && (
        <View className="px-4 pb-2">
          <View className="rounded-lg p-4 mb-4 border shadow-lg" style={{ backgroundColor: colors.primary, borderColor: colors.primaryDark }}>
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">{t('nextInterview')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleInterviewPress(upcomingInterview)}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base mb-1">
                {t('interview')} #{upcomingInterview.interviewId}
              </Text>
              <Text className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {formatDateTime(upcomingInterview.scheduledAt)}
              </Text>
              {upcomingInterview.location && (
                <View className="flex-row items-center mb-1">
                  <Ionicons name="location-outline" size={14} color="white" />
                  <Text className="text-xs ml-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {upcomingInterview.location}
                  </Text>
                </View>
              )}
              {upcomingInterview.meetingUrl && (
                <View className="flex-row items-center">
                  <Ionicons name="videocam-outline" size={14} color="white" />
                  <Text className="text-xs ml-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{t('online')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <>
          {/* Upcoming Interviews List */}
          {interviews.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12 px-4">
              <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
              <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
                {t('noUpcomingInterviews')}
              </Text>
              <TouchableOpacity
                onPress={handleCreateInterview}
                className="mt-4 px-6 py-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold">{t('scheduleInterview')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={interviews}
              renderItem={({ item: interview }) => (
                <TouchableOpacity
                  onPress={() => handleInterviewPress(interview)}
                  className="rounded-lg p-4 mx-4 mb-3 border shadow-sm"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                        {t('interview')} #{interview.interviewId}
                      </Text>
                      <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                        {formatDateTime(interview.scheduledAt)}
                      </Text>
                      {interview.location && (
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                          <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                            {interview.location}
                          </Text>
                        </View>
                      )}
                      {interview.meetingUrl && (
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="videocam-outline" size={14} color={colors.textSecondary} />
                          <Text className="text-xs ml-1" style={{ color: colors.primary }}>{t('online')}</Text>
                        </View>
                      )}
                    </View>
                    <View
                      className="px-3 py-1 rounded-full ml-2"
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

                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                        {t('duration')}: {interview.duration} {t('minutes')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAddToCalendar(interview)}
                      className="p-2"
                    >
                      <Ionicons name="calendar-outline" size={18} color={colors.purple} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.interviewId.toString()}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
              style={{ backgroundColor: colors.background }}
            />
          )}
        </>
      )}

      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </View>
  );
}
