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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, QuestionSet } from '@/services/api/recruitment';

export default function QuestionSetsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchQuestionSets = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const params: any = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'DESC' as const,
      };

      if (searchTerm.trim()) {
        params.text = searchTerm.trim();
      }

      const response = await recruitmentAPI.getQuestionSets(params);
      if (append) {
        setQuestionSets((prev) => [...prev, ...response.data]);
      } else {
        setQuestionSets(response.data);
      }
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching question sets:', error);
      Alert.alert('Error', 'Failed to load question sets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    if (page === 0) {
      fetchQuestionSets(false);
    } else {
      fetchQuestionSets(true);
    }
  }, [page, searchTerm]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchQuestionSets(false);
  };

  const handleLoadMore = () => {
    if (questionSets.length < total && !loading) {
      setPage((prev) => prev + 1);
      fetchQuestionSets(true);
    }
  };

  const handleQuestionSetPress = (questionSet: QuestionSet) => {
    router.push(`/recruitment/question-sets/${questionSet.setId}`);
  };

  const handleCreateQuestionSet = () => {
    router.push('/recruitment/question-sets/form');
  };

  const handleEditQuestionSet = (questionSet: QuestionSet) => {
    router.push(`/recruitment/question-sets/form?id=${questionSet.setId}`);
  };

  const handleDeleteQuestionSet = (questionSet: QuestionSet) => {
    Alert.alert(
      'Delete Question Set',
      `Are you sure you want to delete "${questionSet.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recruitmentAPI.deleteQuestionSet(questionSet.setId);
              Alert.alert('Success', 'Question set deleted successfully');
              fetchQuestionSets();
            } catch (error) {
              console.error('Error deleting question set:', error);
              Alert.alert('Error', 'Failed to delete question set');
            }
          },
        },
      ]
    );
  };

  const renderQuestionSetItem = ({ item }: { item: QuestionSet }) => {
    const questionCount = item.questionSetItems?.length || 0;
    return (
      <TouchableOpacity
        onPress={() => handleQuestionSetPress(item)}
        className="bg-white p-4 mb-3 rounded-lg border border-gray-200"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {item.title}
            </Text>
            {item.description && (
              <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View className="flex-row items-center mt-2">
              <View className="bg-blue-50 px-2 py-1 rounded border border-blue-200">
                <Text className="text-xs font-medium text-blue-700">
                  {questionCount} question{questionCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => handleEditQuestionSet(item)}
              className="p-2 mr-1"
            >
              <Ionicons name="pencil-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteQuestionSet(item)}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Question Sets</Text>
            <Text className="text-sm text-gray-500 mt-1">
              {total} set{total !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreateQuestionSet}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">New</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="mb-4">
          <View className="relative">
            <Ionicons
              name="search-outline"
              size={20}
              color="#9ca3af"
              style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              placeholder="Search question sets..."
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                setPage(0);
              }}
              className="bg-white pl-10 pr-4 py-3 rounded-lg border border-gray-200"
            />
          </View>
        </View>

        {/* Question Sets List */}
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : questionSets.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="folder-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 text-center mt-4">
              No question sets found
            </Text>
            <TouchableOpacity
              onPress={handleCreateQuestionSet}
              className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Create First Question Set</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={questionSets}
            renderItem={renderQuestionSetItem}
            keyExtractor={(item) => item.setId.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            ListFooterComponent={
              questionSets.length < total ? (
                <View className="py-4">
                  <TouchableOpacity
                    onPress={handleLoadMore}
                    disabled={loading}
                    className={`bg-blue-600 px-4 py-2 rounded-lg items-center ${
                      loading ? 'opacity-50' : ''
                    }`}
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
        )}
      </View>
    </View>
  );
}

