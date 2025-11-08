import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Candidate, GetCandidatesParams , JobPosting } from '@/services/api/recruitment';
import { exportService } from '@/utils/export';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface CandidateListItem {
  candidateId: number;
  fullname: string;
  email: string;
  phoneNumber?: string;
  status?: string;
  createdAt: string;
  score?: number | null;
  applicationId?: number;
  jobTitle?: string;
}

export default function CandidateListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>(params.jobId || 'all');
  const [sortBy, setSortBy] = useState<'candidateId' | 'firstName' | 'lastName' | 'appliedDate' | 'yearsOfExperience' | 'expectedSalary'>('candidateId');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchCandidates = useCallback(async (keyword?: string, jobId?: string, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      
      if (jobId && jobId !== 'all') {
        // Fetch candidates by job posting - this doesn't support pagination yet
        // So we'll fetch all and paginate client-side
        const response = await recruitmentAPI.getApplicationsByJobId(Number(jobId));
        const candidateList: CandidateListItem[] = response.data.map((app) => ({
          candidateId: app.candidateId,
          fullname: `${app.firstName} ${app.lastName}`,
          email: app.email,
          status: app.status,
          createdAt: app.createdAt,
          score: app.score,
          applicationId: app.applicationId,
        }));
        
        // Filter by search term if provided
        let filtered = candidateList;
        if (keyword && keyword.trim()) {
          const lowerKeyword = keyword.toLowerCase();
          filtered = candidateList.filter(
            (c) =>
              c.fullname.toLowerCase().includes(lowerKeyword) ||
              c.email.toLowerCase().includes(lowerKeyword)
          );
        }
        
        // Client-side pagination
        const start = page * limit;
        const end = start + limit;
        const paginated = filtered.slice(start, end);
        
        if (append) {
          setCandidates((prev) => [...prev, ...paginated]);
        } else {
          setCandidates(paginated);
        }
        setTotal(filtered.length);
      } else {
        // Fetch all candidates with pagination
        const params: GetCandidatesParams = {
          page,
          limit,
          keyword: keyword,
          sortBy,
          sortOrder,
        };
        const response = await recruitmentAPI.getCandidates(params);
        
        const candidateList: CandidateListItem[] = response.data.map((candidate: Candidate) => ({
          candidateId: candidate.candidateId,
          fullname: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
          phoneNumber: candidate.phoneNumber,
          createdAt: candidate.createdAt,
        }));
        
        if (append) {
          setCandidates((prev) => [...prev, ...candidateList]);
        } else {
          setCandidates(candidateList);
        }
        setTotal(response.total || response.data.length);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      Alert.alert('Error', 'Failed to load candidates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, sortBy, sortOrder]);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await recruitmentAPI.getJobPostings({ limit: 100 });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const keyword = searchTerm.trim() || undefined;
    const jobId = jobFilter !== 'all' ? jobFilter : undefined;
    if (page === 0) {
      fetchCandidates(keyword, jobId, false);
    } else {
      fetchCandidates(keyword, jobId, true);
    }
  }, [page, jobFilter, sortBy, sortOrder, fetchCandidates]);

  // Debounce search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 0) {
        const keyword = searchTerm.trim() || undefined;
        const jobId = jobFilter !== 'all' ? jobFilter : undefined;
        fetchCandidates(keyword, jobId, false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    const keyword = searchTerm.trim() || undefined;
    const jobId = jobFilter !== 'all' ? jobFilter : undefined;
    fetchCandidates(keyword, jobId, false);
  };

  const handleLoadMore = () => {
    if (candidates.length < total && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setPage(0);
  };

  const handleCandidatePress = (candidate: CandidateListItem) => {
    router.push(`/recruitment/candidates/${candidate.candidateId}`);
  };

  const handleExport = async () => {
    try {
      if (candidates.length === 0) {
        Alert.alert('No Data', 'There are no candidates to export');
        return;
      }
      const candidatesData = candidates.map((c) => ({
        candidateId: c.candidateId,
        firstName: c.fullname.split(' ')[0] || '',
        lastName: c.fullname.split(' ').slice(1).join(' ') || '',
        email: c.email,
        phone: c.phoneNumber || '',
        status: c.status || '',
        yearsOfExperience: 0,
        expectedSalary: 0,
        skills: '',
        createdAt: c.createdAt,
      }));
      await exportService.exportCandidatesToCSV(candidatesData);
    } catch (error) {
      console.error('Error exporting candidates:', error);
      Alert.alert('Error', 'Failed to export candidates');
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'hired':
        return '#10b981';
      case 'offer':
        return '#3b82f6';
      case 'interviewing':
        return '#8b5cf6';
      case 'screening':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCandidateItem = ({ item }: { item: CandidateListItem }) => (
    <TouchableOpacity
      onPress={() => handleCandidatePress(item)}
      className="rounded-lg p-4 mb-3 border shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
            {item.fullname}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>{item.email}</Text>
          {item.phoneNumber && (
            <Text className="text-sm mb-1" style={{ color: colors.textTertiary }}>{item.phoneNumber}</Text>
          )}
          {item.jobTitle && (
            <Text className="text-xs mt-1" style={{ color: colors.primary }}>Applied for: {item.jobTitle}</Text>
          )}
        </View>
        {item.status && (
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
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {item.score !== null && item.score !== undefined && (
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={14} color={colors.warning} />
            <Text className="text-xs font-semibold ml-1" style={{ color: colors.text }}>
              Score: {item.score.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
      <Text className="text-lg font-semibold mt-4" style={{ color: colors.textSecondary }}>
        No candidates found
      </Text>
      <Text className="mt-2" style={{ color: colors.textTertiary }}>
        {searchTerm ? 'Try adjusting your search' : 'No candidates available'}
      </Text>
    </View>
  );

  if (loading && candidates.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>Loading candidates...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 border-b" style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.text }}>Candidates</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={handleExport} className="p-2">
              <Ionicons name="download-outline" size={24} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/recruitment/candidates/form')}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative mb-3">
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
            style={{ position: 'absolute', left: 12, top: 12 }}
          />
          <TextInput
            className="rounded-lg pl-10 pr-4 py-3"
            placeholder="Search candidates..."
            placeholderTextColor={colors.textTertiary}
            value={searchTerm}
            onChangeText={handleSearch}
            style={{ backgroundColor: colors.card, color: colors.text }}
          />
        </View>

        {/* Job Filter */}
        {jobs.length > 0 && (
          <View className="flex-row gap-2 mb-2 flex-wrap">
            <TouchableOpacity
            onPress={() => {
              setJobFilter('all');
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg"
            style={{
              backgroundColor: jobFilter === 'all' ? colors.primary : colors.card,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: jobFilter === 'all' ? 'white' : colors.textSecondary,
              }}
            >
              All
            </Text>
          </TouchableOpacity>
          {jobs.map((job) => (
            <TouchableOpacity
              key={job.jobPostingId}
              onPress={() => {
                setJobFilter(job.jobPostingId.toString());
                setPage(0);
              }}
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor: jobFilter === job.jobPostingId.toString() ? colors.primary : colors.card,
              }}
            >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: jobFilter === job.jobPostingId.toString() ? 'white' : colors.textSecondary,
                    maxWidth: 100,
                  }}
                  numberOfLines={1}
                >
                  {job.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filters Toggle */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center justify-between px-4 py-3 rounded-lg mb-2"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row items-center">
            <Ionicons name="filter-outline" size={18} color={colors.textSecondary} />
            <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>Filters & Sort</Text>
          </View>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Filters & Sort Options (Collapsible) */}
        {showFilters && (
          <View className="rounded-lg p-3 mb-2 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {/* Sort Options */}
            <View className="mb-3">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>Sort By:</Text>
              <View className="flex-row gap-2 flex-wrap">
                {[
                  { value: 'candidateId', label: 'ID' },
                  { value: 'firstName', label: 'First Name' },
                  { value: 'lastName', label: 'Last Name' },
                  { value: 'appliedDate', label: 'Applied Date' },
                  { value: 'yearsOfExperience', label: 'Experience' },
                  { value: 'expectedSalary', label: 'Salary' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      if (sortBy === option.value) {
                        setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                      } else {
                        setSortBy(option.value as any);
                        setSortOrder('DESC');
                      }
                      setPage(0);
                    }}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: sortBy === option.value ? colors.warning : colors.card,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: sortBy === option.value ? 'white' : colors.textSecondary,
                        }}
                      >
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <Ionicons
                          name={sortOrder === 'ASC' ? 'arrow-up' : 'arrow-down'}
                          size={14}
                          color="white"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Candidates List */}
      <FlatList
        data={candidates}
        renderItem={renderCandidateItem}
        keyExtractor={(item) => item.candidateId.toString()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          candidates.length < total && candidates.length > 0 ? (
            <View className="py-4">
              <TouchableOpacity
                onPress={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold">Load More</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

