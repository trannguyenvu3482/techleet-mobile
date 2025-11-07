import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import {
  chatbotAPI,
  ChatMessage,
  ChatRequest,
  ChatbotState,
} from "@/services/api/chatbot";
import { useAuthStore } from "@/store/auth-store";

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [state, setState] = useState<ChatbotState>({
    isOpen: true,
    isLoading: false,
    messages: [],
  });
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const initializeSession = useCallback(async () => {
    if (!user?.employeeId) return;

    try {
      const session = await chatbotAPI.createSession(user.employeeId);
      setState((prev) => ({
        ...prev,
        sessionId: session.sessionId,
        messages: session.messages || [],
      }));
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      if (error instanceof Error && error.message.includes("401")) {
        return;
      }
      setState((prev) => ({
        ...prev,
        error: "Unable to initialize chat session. Please try again.",
      }));
    }
  }, [user?.employeeId]);

  useEffect(() => {
    if (user?.employeeId && !state.sessionId) {
      initializeSession();
    }
  }, [user?.employeeId, state.sessionId, initializeSession]);

  useEffect(() => {
    if (state.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [state.messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !state.sessionId || !user?.employeeId) return;

    const messageText = inputText.trim();
    setInputText("");

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      isLoading: true,
      messages: [...prev.messages, userMessage],
      error: undefined,
    }));

    try {
      const request: ChatRequest = {
        message: messageText,
        sessionId: state.sessionId,
      };

      const response = await chatbotAPI.sendMessage(request);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, assistantMessage],
        sessionId: response.sessionId || state.sessionId,
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Unable to send message. Please try again.",
      }));
    }
  }, [inputText, state.sessionId, user?.employeeId]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View
        className={`flex-row mb-4 ${isUser ? "justify-end" : "justify-start"}`}
      >
        <View
          className={`max-w-[80%] rounded-lg px-4 py-3 ${
            isUser
              ? "bg-blue-600 rounded-tr-none"
              : "bg-gray-200 rounded-tl-none"
          }`}
        >
          {isUser ? (
            <Text className="text-base text-white">{item.content}</Text>
          ) : (
            <Markdown
              style={{
                body: {
                  color: "#111827",
                  fontSize: 16,
                  lineHeight: 24,
                },
                paragraph: {
                  marginTop: 0,
                  marginBottom: 8,
                },
                heading1: {
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 12,
                  marginBottom: 8,
                  color: "#111827",
                },
                heading2: {
                  fontSize: 20,
                  fontWeight: "bold",
                  marginTop: 10,
                  marginBottom: 6,
                  color: "#111827",
                },
                heading3: {
                  fontSize: 18,
                  fontWeight: "bold",
                  marginTop: 8,
                  marginBottom: 4,
                  color: "#111827",
                },
                code_inline: {
                  backgroundColor: "#f3f4f6",
                  color: "#dc2626",
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontSize: 14,
                  fontFamily: "monospace",
                },
                code_block: {
                  backgroundColor: "#1f2937",
                  color: "#f9fafb",
                  padding: 12,
                  borderRadius: 8,
                  marginVertical: 8,
                  fontSize: 14,
                  fontFamily: "monospace",
                },
                fence: {
                  backgroundColor: "#1f2937",
                  color: "#f9fafb",
                  padding: 12,
                  borderRadius: 8,
                  marginVertical: 8,
                  fontSize: 14,
                  fontFamily: "monospace",
                },
                link: {
                  color: "#2563eb",
                  textDecorationLine: "underline",
                },
                list_item: {
                  marginBottom: 4,
                },
                bullet_list: {
                  marginBottom: 8,
                },
                ordered_list: {
                  marginBottom: 8,
                },
                strong: {
                  fontWeight: "bold",
                  color: "#111827",
                },
                em: {
                  fontStyle: "italic",
                },
                blockquote: {
                  backgroundColor: "#f3f4f6",
                  borderLeftWidth: 4,
                  borderLeftColor: "#2563eb",
                  paddingLeft: 12,
                  paddingVertical: 8,
                  marginVertical: 8,
                },
                table: {
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  marginVertical: 8,
                },
                thead: {
                  backgroundColor: "#f9fafb",
                },
                th: {
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  padding: 8,
                  fontWeight: "bold",
                },
                td: {
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  padding: 8,
                },
                hr: {
                  backgroundColor: "#e5e7eb",
                  height: 1,
                  marginVertical: 12,
                },
              }}
            >
              {item.content}
            </Markdown>
          )}
          <Text
            className={`text-xs mt-1 ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (!user?.employeeId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Please login to use chat</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center justify-between"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-3">
              <Ionicons name="chatbubble-ellipses" size={20} color="white" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">
                AI Assistant
              </Text>
              <Text className="text-xs text-gray-500">
                {state.sessionId ? "Online" : "Connecting..."}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={state.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="chatbubble-outline" size={64} color="#d1d5db" />
              <Text className="text-lg font-semibold text-gray-500 mt-4">
                Start a conversation
              </Text>
              <Text className="text-gray-400 mt-2 text-center px-8">
                Ask me anything about recruitment, candidates, jobs, or
                applications
              </Text>
            </View>
          }
          ListFooterComponent={
            state.isLoading ? (
              <View className="flex-row justify-start mb-4">
                <View className="bg-gray-200 rounded-lg rounded-tl-none px-4 py-3">
                  <ActivityIndicator size="small" color="#6b7280" />
                </View>
              </View>
            ) : null
          }
        />

        {/* Error Message */}
        {state.error && (
          <View className="bg-red-50 border-t border-red-200 px-4 py-2">
            <Text className="text-red-600 text-sm">{state.error}</Text>
          </View>
        )}

        {/* Input Area */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row items-center">
            <TextInput
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              className="flex-1 bg-gray-100 rounded-lg px-4 py-3 mr-2 text-base"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || state.isLoading}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                !inputText.trim() || state.isLoading
                  ? "bg-gray-300"
                  : "bg-blue-600"
              }`}
            >
              {state.isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
