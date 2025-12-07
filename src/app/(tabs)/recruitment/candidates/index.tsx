import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, GetCandidatesParams, JobPosting, Candidate } from '@/services/api/recruitment';
import { exportService } from '@/utils/export';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';
import { EmptyState, CandidateCardSkeleton } from '@/components/ui';
import { FilterBottomSheet, FilterSection } from '@/components/common/FilterBottomSheet';
import { getStatusColor, getStatusLabel, getStatusBackground } from '@/utils/status';

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
  const { t } = useTranslation('recruitment');
  const { t: tCommon } = useTranslation('common');
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>(params.jobId || 'all');
  const [sortBy, setSortBy] = useState<
    | "candidateId"
    | "firstName"
    | "lastName"
    | "appliedDate"
    | "yearsOfExperience"
    | "expectedSalary"
  >("candidateId");
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchCandidates = useCallback(
    async (keyword?: string, jobId?: string, append = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        if (jobId && jobId !== 'all') {
            // Fetch candidates by job posting - this doesn't support pagination yet
            // So we'll fetch all and paginate client-side
            const response = await recruitmentAPI.getApplicationsByJobId(
              Number(jobId)
            );
            const candidateList: CandidateListItem[] = response.data.map(
              (app) => ({
                candidateId: app.candidateId,
                fullname: `${app.firstName} ${app.lastName}`,
                email: app.email,
                status: app.status,
                createdAt: app.createdAt,
                score: app.score,
                applicationId: app.applicationId,
              })
            );
  
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

          const candidateList: CandidateListItem[] = response.data.map(
            (candidate: Candidate) => ({
              candidateId: candidate.candidateId,
              fullname: `${candidate.firstName} ${candidate.lastName}`,
              email: candidate.email,
              phoneNumber: candidate.phoneNumber,
              createdAt: candidate.createdAt,
            })
          );

          if (append) {
            setCandidates((prev) => [...prev, ...candidateList]);
          } else {
            setCandidates(candidateList);
          }
          setTotal(response.total || response.data.length);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
        Alert.alert("Error", "Failed to load candidates");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [page, sortBy, sortOrder]
  );

  const fetchJobs = useCallback(async () => {
    try {
      const response = await recruitmentAPI.getJobPostings({ limit: 100 });
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const keyword = searchTerm.trim() || undefined;
    const jobId = jobFilter !== "all" ? jobFilter : undefined;
    if (page === 0) {
      fetchCandidates(keyword, jobId, false);
    } else {
      fetchCandidates(keyword, jobId, true);
    }
  }, [page, jobFilter, sortBy, sortOrder, fetchCandidates]);

  // Debounce search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 0 && searchTerm) {
        const keyword = searchTerm.trim() || undefined;
        const jobId = jobFilter !== "all" ? jobFilter : undefined;
        fetchCandidates(keyword, jobId, false);
      } else if (page > 0 && searchTerm) {
        setPage(0);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    // Triggered by useEffect when page changes to 0
  };

  const handleLoadMore = () => {
    if (candidates.length < total && !loading && !loadingMore) {
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
        Alert.alert("No Data", "There are no candidates to export");
        return;
      }
      const candidatesData = candidates.map((c) => ({
        candidateId: c.candidateId,
        firstName: c.fullname.split(" ")[0] || "",
        lastName: c.fullname.split(" ").slice(1).join(" ") || "",
        email: c.email,
        phone: c.phoneNumber || "",
        status: c.status || "",
        yearsOfExperience: 0,
        expectedSalary: 0,
        skills: "",
        createdAt: c.createdAt,
      }));
      await exportService.exportCandidatesToCSV(candidatesData);
    } catch (error) {
      console.error("Error exporting candidates:", error);
      Alert.alert("Error", "Failed to export candidates");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
          <Text
            className="text-base font-bold mb-1"
            style={{ color: colors.text }}
          >
            {item.fullname}
          </Text>
          <Text
            className="text-sm mb-1"
            style={{ color: colors.textSecondary }}
          >
            {item.email}
          </Text>
          {item.phoneNumber && (
            <Text
              className="text-sm mb-1"
              style={{ color: colors.textTertiary }}
            >
              {item.phoneNumber}
            </Text>
          )}
          {item.jobTitle && (
            <Text className="text-xs mt-1" style={{ color: colors.primary }}>
              {t("appliedFor")} {item.jobTitle}
            </Text>
          )}
        </View>
        {item.status && (
          <View
            className="px-3 py-1 rounded-full ml-2"
            style={{ backgroundColor: getStatusBackground(item.status) }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: getStatusColor(item.status) }}
            >
              {getStatusLabel(item.status, t)}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            className="text-xs ml-1"
            style={{ color: colors.textSecondary }}
          >
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {item.score !== null && item.score !== undefined && (
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={14} color={colors.warning} />
            <Text
              className="text-xs font-semibold ml-1"
              style={{ color: colors.text }}
            >
              {t("score")} {item.score.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        icon="people-outline"
        title={t("noCandidates")}
        description={searchTerm ? t("tryAdjustingFilters") : t("addCandidate")}
        actionLabel={!searchTerm ? t("createCandidate") : undefined}
        onAction={!searchTerm ? () => router.push('/recruitment/candidates/form') : undefined}
      />
    );
  };

  const LoadingView = () => (
    <View className="flex-1 px-4 mt-2">
       {Array.from({ length: 6 }).map((_, index) => (
          <CandidateCardSkeleton key={index} />
        ))}
    </View>
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (jobFilter !== 'all') count++;
    return count;
  }, [jobFilter]);

  const resetFilters = () => {
    setJobFilter('all');
    setPage(0);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        className="px-4 pt-4 pb-2 border-b"
        style={{
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            className="text-2xl font-bold flex-1"
            style={{ color: colors.text }}
          >
            {t("candidates")}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setShowFilters(true)} className="p-2 relative">
               <Ionicons name="filter-outline" size={24} color={activeFiltersCount > 0 ? colors.primary : colors.secondary} />
                {activeFiltersCount > 0 && (
                  <View className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
                )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExport} className="p-2">
              <Ionicons
                name="download-outline"
                size={24}
                color={colors.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/recruitment/candidates/form")}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">{tCommon("add")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative mb-3">
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
            style={{ position: "absolute", left: 12, top: 12 }}
          />
          <TextInput
            className="rounded-lg pl-10 pr-4 py-3"
            placeholder={t("searchCandidates")}
            placeholderTextColor={colors.textTertiary}
            value={searchTerm}
            onChangeText={handleSearch}
            style={{ backgroundColor: colors.card, color: colors.text }}
          />
        </View>
      </View>

      {/* Candidates List */}
       <View className="flex-1">
        {loading && page === 0 ? <LoadingView /> : (
            <FlatList
                data={candidates}
                renderItem={renderCandidateItem}
                keyExtractor={(item) => item.candidateId.toString()}
                contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : (
                        <View className="h-8" />
                    )
                }
            />
        )}
      </View>

      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onReset={resetFilters}
        onApply={() => {
            setShowFilters(false);
            setPage(0);
        }}
      >
        {jobs.length > 0 && (
             <FilterSection
                title={t('jobs')}
                selectedValue={jobFilter}
                onSelect={setJobFilter}
                options={[
                    { value: 'all', label: t('allJobs') },
                    ...jobs.map(job => ({ value: job.jobPostingId.toString(), label: job.title }))
                ]}
            />
        )}

         <FilterSection
            title={t('sortBy')}
            selectedValue={sortBy}
            onSelect={(val) => setSortBy(val as any)}
            options={[
                  { value: "candidateId", label: t("sortByOptions.candidateId") },
                  { value: "firstName", label: t("sortByOptions.firstName") },
                  { value: "lastName", label: t("sortByOptions.lastName") },
                  { value: "appliedDate", label: t("sortByOptions.appliedDate") },
                  { value: "yearsOfExperience", label: t("sortByOptions.yearsOfExperience") },
                  { value: "expectedSalary", label: t("sortByOptions.expectedSalary") },
            ]}
         />
      </FilterBottomSheet>
    </View>
  );
}
