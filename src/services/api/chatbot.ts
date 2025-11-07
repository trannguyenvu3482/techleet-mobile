import { api } from './client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

export interface ChatSession {
  sessionId: string;
  userId: number;
  messages: ChatMessage[];
  context: SessionContext;
  lastActiveAt: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionContext {
  currentFocus: 'job_postings' | 'candidates' | 'applications' | 'interviews' | 'general';
  recentEntityIds: number[];
  preferences: {
    language: 'vi' | 'en';
    responseStyle: 'detailed' | 'concise';
    includeSources: boolean;
  };
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponseSource {
  type: string;
  title: string;
  url?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatResponseToolCall {
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

export interface ChatResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  data: {
    reply: string;
    sessionId: string;
    sources: ChatResponseSource[];
    toolCalls: ChatResponseToolCall[];
  };
}

export interface ChatbotState {
  isOpen: boolean;
  isLoading: boolean;
  messages: ChatMessage[];
  sessionId?: string;
  error?: string;
}

type ChatResponseData = ChatResponse['data'];

export const chatbotAPI = {
  async createSession(userId: number): Promise<ChatSession> {
    const response = await api.post<ChatSession>(
      '/api/v1/recruitment-service/chatbot-agent/session',
      {
        userId,
      }
    );
    return response;
  },

  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await api.get<ChatSession>(
      `/api/v1/recruitment-service/chatbot-agent/session/${sessionId}`
    );
    return response;
  },

  async sendMessage(request: ChatRequest): Promise<ChatResponseData> {
    return api.post<ChatResponseData>(
      '/api/v1/recruitment-service/chatbot-agent/chat',
      request
    );
  },

  async triggerIndexing(
    entityTypes?: string[],
    forceReindex?: boolean
  ): Promise<void> {
    return api.post<void>(
      '/api/v1/recruitment-service/chatbot-agent/index/trigger',
      {
        entityTypes,
        forceReindex,
      }
    );
  },
};

