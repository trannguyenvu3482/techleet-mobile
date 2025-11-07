import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recruitmentAPI, Examination, ExamQuestion } from '@/services/api/recruitment';

export default function CandidateExamDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; examId: string }>();
  const insets = useSafeAreaInsets();
  const [exam, setExam] = useState<Examination | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingScores, setEditingScores] = useState<Record<number, number>>({});
  const [showEditMode, setShowEditMode] = useState(false);

  const fetchExam = useCallback(async (examId: number) => {
    try {
      setLoading(true);
      const examData = await recruitmentAPI.getExaminationDetail(examId);
      setExam(examData);
      
      // Initialize editing scores with current scores
      const scores: Record<number, number> = {};
      if (examData.examQuestions) {
        examData.examQuestions.forEach((eq) => {
          if (eq.examinationQuestionId && eq.score !== null && eq.score !== undefined) {
            scores[eq.examinationQuestionId] = eq.score;
          }
        });
      }
      setEditingScores(scores);
    } catch (error) {
      console.error('Error fetching exam:', error);
      Alert.alert('Error', 'Failed to load examination details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.examId) {
      fetchExam(Number(params.examId));
    }
  }, [params.examId, fetchExam]);

  const handleScoreChange = (examQuestionId: number, score: string) => {
    const numScore = parseFloat(score) || 0;
    if (numScore < 0 || numScore > 10) {
      Alert.alert('Invalid Score', 'Score must be between 0 and 10');
      return;
    }
    setEditingScores((prev) => ({
      ...prev,
      [examQuestionId]: numScore,
    }));
  };

  const handleSaveScores = async () => {
    if (!exam || !exam.examQuestions) return;

    try {
      setSaving(true);
      const updates: { examQuestionId: number; score: number }[] = [];

      exam.examQuestions.forEach((eq) => {
        const newScore = editingScores[eq.examinationQuestionId];
        if (
          newScore !== undefined &&
          eq.score !== null &&
          newScore !== eq.score
        ) {
          updates.push({
            examQuestionId: eq.examinationQuestionId,
            score: newScore,
          });
        }
      });

      if (updates.length > 0) {
        // Update each question's score individually
        await Promise.all(
          updates.map((update) =>
            recruitmentAPI.updateExamScore(update.examQuestionId, update.score)
          )
        );

        // Revaluate examination after updating all scores
        if (exam.examinationId) {
          await recruitmentAPI.revaluateExamination(exam.examinationId);
        }

        // Reload exam data
        if (params.examId) {
          await fetchExam(Number(params.examId));
        }
        setShowEditMode(false);
        Alert.alert('Success', 'Scores updated successfully');
      } else {
        Alert.alert('Info', 'No scores to update');
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      Alert.alert('Error', 'Failed to update scores');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return '#6b7280';
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading examination details...</Text>
        </View>
      </View>
    );
  }

  if (!exam) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-semibold text-gray-500 mt-4">
            Examination not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Examination #{exam.examinationId}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-1 rounded-full`}
                style={{ backgroundColor: `${getStatusColor(exam.status)}20` }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: getStatusColor(exam.status) }}
                >
                  {getStatusLabel(exam.status)}
                </Text>
              </View>
              {exam.totalScore !== null && exam.totalScore !== undefined && (
                <View className="flex-row items-center ml-3">
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text className="text-sm font-bold text-gray-900 ml-1">
                    {exam.totalScore.toFixed(1)}/10
                  </Text>
                </View>
              )}
            </View>
          </View>
          {exam.status === 'completed' && (
            <TouchableOpacity
              onPress={() => setShowEditMode(!showEditMode)}
              className="ml-2"
            >
              <Ionicons
                name={showEditMode ? 'checkmark-outline' : 'create-outline'}
                size={24}
                color="#2563eb"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Metadata */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-600">Submitted</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDate(exam.submittedAt)}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-600">Questions</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {exam.examQuestions?.length || 0}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Questions */}
        {exam.examQuestions && exam.examQuestions.length > 0 ? (
          <View className="space-y-4">
            {exam.examQuestions.map((question, index) => (
              <View
                key={question.examinationQuestionId}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <Text className="text-sm font-bold text-gray-900 flex-1">
                    Question {index + 1}
                  </Text>
                  {question.question?.difficulty && (
                    <View
                      className={`px-2 py-1 rounded-full ml-2`}
                      style={{
                        backgroundColor: `${getDifficultyColor(question.question.difficulty)}20`,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getDifficultyColor(question.question.difficulty) }}
                      >
                        {question.question.difficulty}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Question Content */}
                <View className="mb-3">
                  <Text className="text-sm text-gray-700 leading-6">
                    {question.question?.content || 'N/A'}
                  </Text>
                </View>

                {/* Answer */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-gray-700 mb-1">Answer</Text>
                  <View className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <Text className="text-sm text-gray-900">
                      {question.answerText || 'No answer provided'}
                    </Text>
                  </View>
                </View>

                {/* Score */}
                <View className="flex-row items-center justify-between border-t border-gray-200 pt-3">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="star-outline" size={16} color="#f59e0b" />
                    <Text className="text-sm font-semibold text-gray-700 ml-2">Score</Text>
                  </View>
                  {showEditMode && exam.status === 'completed' ? (
                    <View className="flex-row items-center flex-1 justify-end">
                      <TextInput
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 w-20 text-center"
                        value={
                          editingScores[question.examinationQuestionId]?.toString() || '0'
                        }
                        onChangeText={(text) =>
                          handleScoreChange(question.examinationQuestionId, text)
                        }
                        keyboardType="numeric"
                        placeholder="0-10"
                        maxLength={4}
                      />
                      <Text className="text-sm text-gray-600 ml-2">/ 10</Text>
                    </View>
                  ) : (
                    <Text className="text-sm font-bold text-gray-900">
                      {question.score !== null && question.score !== undefined
                        ? `${question.score.toFixed(1)}/10`
                        : 'N/A'}
                    </Text>
                  )}
                </View>

                {/* Reason/Comment */}
                {question.reason && (
                  <View className="mt-3 pt-3 border-t border-gray-200">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Comment</Text>
                    <Text className="text-xs text-gray-600">{question.reason}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text className="text-lg font-semibold text-gray-500 mt-4">
              No questions found
            </Text>
          </View>
        )}

        {/* Save Button */}
        {showEditMode && exam.status === 'completed' && (
          <TouchableOpacity
            onPress={handleSaveScores}
            disabled={saving}
            className={`bg-blue-600 px-6 py-4 rounded-lg mt-4 mb-6 ${
              saving ? 'opacity-50' : ''
            }`}
          >
            {saving ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold ml-2">Saving...</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-center">
                Save Scores
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

