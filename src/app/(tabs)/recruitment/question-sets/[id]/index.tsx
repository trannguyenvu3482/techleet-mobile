import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentAPI, QuestionSet, Question, QuestionSetItem } from '@/services/api/recruitment';

export default function QuestionSetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  const questionSetId = params.id && params.id !== 'index' && params.id.trim() !== ''
    ? Number(params.id)
    : null;

  const isValidId = questionSetId !== null && !isNaN(questionSetId) && questionSetId > 0;

  const fetchQuestionSet = useCallback(async () => {
    if (!isValidId || !questionSetId) {
      Alert.alert('Error', 'Invalid question set ID');
      router.back();
      return;
    }

    try {
      setLoading(true);
      // Use getQuestionSetById which handles pagination internally
      const foundSet = await recruitmentAPI.getQuestionSetById(questionSetId);
      setQuestionSet(foundSet);
    } catch (error) {
      console.error('Error fetching question set:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load question set';
      Alert.alert('Error', errorMessage);
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [questionSetId, isValidId, router]);

  useEffect(() => {
    if (isValidId) {
      fetchQuestionSet();
    } else if (params.id && params.id !== 'index') {
      Alert.alert('Error', 'Invalid question set ID');
      router.back();
    }
  }, [isValidId, params.id, fetchQuestionSet, router]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestionSet();
  };

  const fetchAvailableQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const response = await recruitmentAPI.getQuestions({ limit: 100 });
      const currentQuestionIds = questionSet?.questionSetItems?.map(
        (item) => item.question.questionId
      ) || [];
      const filtered = response.data.filter(
        (q) => !currentQuestionIds.includes(q.questionId)
      );
      setAvailableQuestions(filtered);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to load available questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setSearchTerm('');
    setSelectedQuestionIds([]);
    fetchAvailableQuestions();
  };

  const handleToggleQuestionSelect = (questionId: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleAddQuestions = async () => {
    if (!questionSet || selectedQuestionIds.length === 0) {
      Alert.alert('Error', 'Please select at least one question');
      return;
    }

    try {
      for (const questionId of selectedQuestionIds) {
        await recruitmentAPI.addQuestionToSet(questionSet.setId, questionId);
      }
      Alert.alert('Success', `Added ${selectedQuestionIds.length} question(s) to set`);
      setShowAddModal(false);
      setSelectedQuestionIds([]);
      fetchQuestionSet();
    } catch (error) {
      console.error('Error adding questions:', error);
      Alert.alert('Error', 'Failed to add questions to set');
    }
  };

  const handleRemoveQuestion = (item: QuestionSetItem) => {
    Alert.alert(
      'Remove Question',
      'Are you sure you want to remove this question from the set?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await recruitmentAPI.removeQuestionFromSet(item.setItemId);
              Alert.alert('Success', 'Question removed from set');
              fetchQuestionSet();
            } catch (error) {
              console.error('Error removing question:', error);
              Alert.alert('Error', 'Failed to remove question from set');
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

  const filteredAvailableQuestions = availableQuestions.filter((q) =>
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderQuestionItem = ({ item }: { item: QuestionSetItem }) => (
    <View className="bg-white p-4 mb-3 rounded-lg border border-gray-200">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {item.question.content}
          </Text>
          <View className="flex-row items-center mt-2">
            <View
              className={`px-2 py-1 rounded border ${getDifficultyColor(item.question.difficulty)}`}
            >
              <Text className="text-xs font-medium capitalize">
                {item.question.difficulty}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveQuestion(item)}
          className="p-2"
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      {item.question.sampleAnswer && (
        <View className="mt-2 pt-2 border-t border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Sample Answer:</Text>
          <Text className="text-sm text-gray-700" numberOfLines={2}>
            {item.question.sampleAnswer}
          </Text>
        </View>
      )}
    </View>
  );

  if (!isValidId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (!questionSet) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Question set not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const questions = questionSet.questionSetItems || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                {questionSet.title}
              </Text>
              {questionSet.description && (
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                  {questionSet.description}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/recruitment/question-sets/form?id=${questionSet.setId}`)}
            className="p-2"
          >
            <Ionicons name="pencil-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* Actions */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              {questions.length} Question{questions.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              onPress={handleOpenAddModal}
              className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add Questions</Text>
            </TouchableOpacity>
          </View>

          {/* Questions List */}
          {questions.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="help-circle-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-4">
                No questions in this set
              </Text>
              <TouchableOpacity
                onPress={handleOpenAddModal}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Add Questions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={questions}
              renderItem={renderQuestionItem}
              keyExtractor={(item) => item.setItemId.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>

        {/* Add Questions Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1">
              {/* Modal Header */}
              <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">
                  Add Questions
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View className="px-4 pt-4">
                <View className="relative">
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color="#9ca3af"
                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                  />
                  <TextInput
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    className="bg-white pl-10 pr-4 py-3 rounded-lg border border-gray-200"
                  />
                </View>
              </View>

              {/* Questions List */}
              {loadingQuestions ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#2563eb" />
                </View>
              ) : filteredAvailableQuestions.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-gray-500">No available questions</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredAvailableQuestions}
                  keyExtractor={(item) => item.questionId.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleToggleQuestionSelect(item.questionId)}
                      className={`bg-white p-4 mb-3 rounded-lg border ${
                        selectedQuestionIds.includes(item.questionId)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <View className="flex-row items-start">
                        <View className="mr-3 mt-1">
                          <Ionicons
                            name={
                              selectedQuestionIds.includes(item.questionId)
                                ? 'checkbox'
                                : 'square-outline'
                            }
                            size={24}
                            color={
                              selectedQuestionIds.includes(item.questionId)
                                ? '#2563eb'
                                : '#9ca3af'
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                            {item.content}
                          </Text>
                          <View
                            className={`px-2 py-1 rounded border ${getDifficultyColor(item.difficulty)} self-start`}
                          >
                            <Text className="text-xs font-medium capitalize">
                              {item.difficulty}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Modal Footer */}
              <View className="bg-white px-4 py-3 border-t border-gray-200 flex-row justify-end">
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="px-4 py-2 mr-2"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddQuestions}
                  disabled={selectedQuestionIds.length === 0}
                  className={`bg-blue-600 px-6 py-2 rounded-lg ${
                    selectedQuestionIds.length === 0 ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-white font-semibold">
                    Add ({selectedQuestionIds.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

