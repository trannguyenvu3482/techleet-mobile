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
import { Picker } from '@react-native-picker/picker';
import { recruitmentAPI, Question } from '@/services/api/recruitment';

export default function QuestionsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchQuestions = useCallback(async (append = false) => {
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

      if (difficultyFilter !== 'all') {
        params.difficulty = difficultyFilter;
      }

      const response = await recruitmentAPI.getQuestions(params);
      if (append) {
        setQuestions((prev) => [...prev, ...response.data]);
      } else {
        setQuestions(response.data);
      }
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchTerm, difficultyFilter]);

  useEffect(() => {
    if (page === 0) {
      fetchQuestions(false);
    } else {
      fetchQuestions(true);
    }
  }, [page, searchTerm, difficultyFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchQuestions(false);
  };

  const handleLoadMore = () => {
    if (questions.length < total && !loading) {
      setPage((prev) => prev + 1);
      fetchQuestions(true);
    }
  };

  const handleQuestionPress = (question: Question) => {
    router.push(`/recruitment/questions/form?id=${question.questionId}`);
  };

  const handleCreateQuestion = () => {
    router.push('/recruitment/questions/form');
  };

  const handleDeleteQuestion = (question: Question) => {
    Alert.alert(
      'Delete Question',
      `Are you sure you want to delete this question?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recruitmentAPI.deleteQuestion(question.questionId);
              Alert.alert('Success', 'Question deleted successfully');
              fetchQuestions();
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('Error', 'Failed to delete question');
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const renderQuestionItem = ({ item }: { item: Question }) => (
    <TouchableOpacity
      onPress={() => handleQuestionPress(item)}
      className="bg-white p-4 mb-3 rounded-lg border border-gray-200"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {item.content}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className={`px-2 py-1 rounded border ${getDifficultyColor(item.difficulty)}`}>
              <Text className="text-xs font-medium capitalize">{item.difficulty}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteQuestion(item)}
          className="p-2"
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      {item.sampleAnswer && (
        <View className="mt-2 pt-2 border-t border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Sample Answer:</Text>
          <Text className="text-sm text-gray-700" numberOfLines={2}>
            {item.sampleAnswer}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Questions</Text>
            <Text className="text-sm text-gray-500 mt-1">
              {total} question{total !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreateQuestion}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">New</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View className="mb-4">
          <View className="relative mb-3">
            <Ionicons
              name="search-outline"
              size={20}
              color="#9ca3af"
              style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              placeholder="Search questions..."
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                setPage(0);
              }}
              className="bg-white pl-10 pr-4 py-3 rounded-lg border border-gray-200"
            />
          </View>

          <View className="bg-white rounded-lg border border-gray-200">
            <Picker
              selectedValue={difficultyFilter}
              onValueChange={(value) => {
                setDifficultyFilter(value);
                setPage(0);
              }}
              style={{ height: 50 }}
            >
              <Picker.Item label="All Difficulties" value="all" />
              <Picker.Item label="Easy" value="easy" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="Hard" value="hard" />
            </Picker>
          </View>
        </View>

        {/* Questions List */}
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : questions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="help-circle-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 text-center mt-4">
              No questions found
            </Text>
            <TouchableOpacity
              onPress={handleCreateQuestion}
              className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Create First Question</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={questions}
            renderItem={renderQuestionItem}
            keyExtractor={(item) => item.questionId.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            ListFooterComponent={
              questions.length < total ? (
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

