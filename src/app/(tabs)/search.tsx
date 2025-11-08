import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchAPI, SearchResult } from '@/services/api/search';
import { searchHistoryService, SearchHistoryItem } from '@/services/search-history';
import { JobPosting, Candidate, Application, Interview } from '@/services/api/recruitment';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

type SearchType = 'jobs' | 'candidates' | 'applications' | 'interviews';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('search');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<SearchType[]>(['jobs', 'candidates', 'applications', 'interviews']);
  const [showHistory, setShowHistory] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions();
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const loadHistory = async () => {
    const historyData = await searchHistoryService.getHistory();
    setHistory(historyData);
  };

  const fetchSuggestions = async () => {
    try {
      const suggs = await searchAPI.getSuggestions(query);
      setSuggestions(suggs);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const searchTerm = searchQuery || query;
    if (!searchTerm || searchTerm.trim().length === 0) {
      return;
    }

    try {
      setLoading(true);
      setShowHistory(false);
      const results = await searchAPI.search({
        query: searchTerm.trim(),
        types: selectedTypes,
        limit: 20,
      });
      setSearchResults(results);
      await searchHistoryService.addToHistory(searchTerm.trim(), results.total);
      await loadHistory();
    } catch (error) {
      console.error('Error performing search:', error);
      Alert.alert(tCommon('error'), t('failedToSearch'));
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryItemPress = (item: SearchHistoryItem) => {
    setQuery(item.query);
    handleSearch(item.query);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const toggleSearchType = (type: SearchType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
    setSuggestions([]);
    setShowHistory(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderJobItem = (job: JobPosting) => (
    <TouchableOpacity
      key={job.jobPostingId}
      onPress={() => router.push(`/recruitment/jobs/${job.jobPostingId}`)}
      className="rounded-lg p-4 mb-3 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>{job.title}</Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }} numberOfLines={2}>
            {job.description}
          </Text>
          <Text className="text-xs" style={{ color: colors.textTertiary }}>{formatDate(job.createdAt)}</Text>
        </View>
        <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderCandidateItem = (candidate: Candidate) => (
    <TouchableOpacity
      key={candidate.candidateId}
      onPress={() => router.push(`/recruitment/candidates/${candidate.candidateId}`)}
      className="rounded-lg p-4 mb-3 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            {candidate.firstName} {candidate.lastName}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>{candidate.email}</Text>
          {candidate.skills && (
            <Text className="text-xs" style={{ color: colors.textTertiary }} numberOfLines={1}>
              {t('skills')}: {candidate.skills}
            </Text>
          )}
        </View>
        <Ionicons name="person-outline" size={24} color={colors.secondary} />
      </View>
    </TouchableOpacity>
  );

  const renderApplicationItem = (application: Application) => (
    <TouchableOpacity
      key={application.applicationId}
      onPress={() => router.push(`/recruitment/applications/${application.applicationId}`)}
      className="rounded-lg p-4 mb-3 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            {application.candidate
              ? `${application.candidate.firstName} ${application.candidate.lastName}`
              : t('unknownCandidate')}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {application.jobPosting?.title || t('unknownPosition')}
          </Text>
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {t('applied')}: {formatDate(application.appliedAt)}
          </Text>
        </View>
        <Ionicons name="document-text-outline" size={24} color={colors.warning} />
      </View>
    </TouchableOpacity>
  );

  const renderInterviewItem = (interview: Interview) => (
    <TouchableOpacity
      key={interview.interviewId}
      onPress={() => router.push(`/recruitment/interviews/${interview.interviewId}`)}
      className="rounded-lg p-4 mb-3 border"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            Interview #{interview.interviewId}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {formatDate(interview.scheduledAt)}
          </Text>
          {interview.location && (
            <Text className="text-xs" style={{ color: colors.textTertiary }}>{interview.location}</Text>
          )}
        </View>
        <Ionicons name="calendar-outline" size={24} color={colors.purple} />
      </View>
    </TouchableOpacity>
  );

  const renderResults = () => {
    if (!searchResults) return null;

    const hasResults =
      searchResults.jobs.length > 0 ||
      searchResults.candidates.length > 0 ||
      searchResults.applications.length > 0 ||
      searchResults.interviews.length > 0;

    if (!hasResults) {
      return (
        <View className="flex-1 items-center justify-center py-12 px-4">
          <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
          <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
            {t('noResults')}
          </Text>
          <Text className="text-sm mt-2 text-center" style={{ color: colors.textTertiary }}>
            {t('adjustFilters')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.background }}>
        {searchResults.jobs.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
              <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                {t('jobs')} ({searchResults.jobs.length})
              </Text>
            </View>
            {searchResults.jobs.map(renderJobItem)}
          </View>
        )}

        {searchResults.candidates.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="person-outline" size={20} color={colors.secondary} />
              <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                {t('candidates')} ({searchResults.candidates.length})
              </Text>
            </View>
            {searchResults.candidates.map(renderCandidateItem)}
          </View>
        )}

        {searchResults.applications.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="document-text-outline" size={20} color={colors.warning} />
              <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                {t('applications')} ({searchResults.applications.length})
              </Text>
            </View>
            {searchResults.applications.map(renderApplicationItem)}
          </View>
        )}

        {searchResults.interviews.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar-outline" size={20} color={colors.purple} />
              <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                {t('interviews')} ({searchResults.interviews.length})
              </Text>
            </View>
            {searchResults.interviews.map(renderInterviewItem)}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <Text className="text-2xl font-bold mb-3" style={{ color: colors.text }}>{t('title')}</Text>

        {/* Search Bar */}
        <View className="flex-row items-center rounded-lg px-4 py-3 mb-3" style={{ backgroundColor: colors.card }}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            className="flex-1 ml-3"
            placeholder={t('placeholder')}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCapitalize="none"
            style={{ color: colors.text }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="ml-2">
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Type Filters */}
        <View className="flex-row gap-2 mb-2">
          {(['jobs', 'candidates', 'applications', 'interviews'] as SearchType[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => toggleSearchType(type)}
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor: selectedTypes.includes(type) ? colors.primary : colors.card,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color: selectedTypes.includes(type) ? 'white' : colors.textSecondary,
                }}
              >
                {t(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          onPress={() => handleSearch()}
          disabled={loading || query.trim().length === 0}
          className="px-4 py-3 rounded-lg items-center"
          style={{
            backgroundColor: colors.primary,
            opacity: (loading || query.trim().length === 0) ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold">{tCommon('search')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && query.length >= 2 && !searchResults && (
        <View className="border-b px-4 py-2" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>{t('suggestions')}</Text>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSuggestionPress(suggestion)}
              className="py-2 border-b"
              style={{ borderBottomColor: colors.borderLight }}
            >
              <Text style={{ color: colors.text }}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* History */}
      {showHistory && history.length > 0 && !searchResults && query.length === 0 && (
        <View className="flex-1" style={{ backgroundColor: colors.surface }}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t('recentSearches')}</Text>
            <TouchableOpacity
              onPress={async () => {
                await searchHistoryService.clearHistory();
                await loadHistory();
              }}
            >
              <Text className="text-sm" style={{ color: colors.primary }}>{t('clear')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={history}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleHistoryItemPress(item)}
                className="px-4 py-3 border-b flex-row items-center justify-between"
                style={{ borderBottomColor: colors.borderLight }}
              >
                <View className="flex-1">
                  <Text style={{ color: colors.text }}>{item.query}</Text>
                  {item.resultCount !== undefined && (
                    <Text className="text-xs" style={{ color: colors.textTertiary }}>
                      {item.resultCount} {item.resultCount !== 1 ? t('resultsPlural') : t('results')}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    await searchHistoryService.removeFromHistory(item.id);
                    await loadHistory();
                  }}
                >
                  <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={{ backgroundColor: colors.surface }}
          />
        </View>
      )}

      {/* Results */}
      {searchResults && renderResults()}
    </View>
  );
}

