import { defineStore } from 'pinia';
import { apiClient } from '../lib/api';
import { useUserStore } from './user';
import { useMetricsStore } from './metrics';
import { useNotificationStore } from './notifications';

type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  pending?: boolean;
  intent?: 'qa' | 'search' | 'explain';
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
  profileHint?: string;
  citations?: Array<{ docId: string; chunkIdx: number }>;
  responseMode?: 'basic' | 'rag';
}

interface ChatState {
  messages: ChatMessage[];
  isSending: boolean;
  mode: 'auto' | 'rag' | 'basic';
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Привет! Я помогу сформировать идеи и ответы для команды SPPH. Чем займёмся сегодня?',
        createdAt: new Date().toISOString()
      }
    ],
    isSending: false,
    mode: 'auto'
  }),
  actions: {
    addMessage(message: ChatMessage) {
      this.messages.push(message);
    },
    resetConversation() {
      this.messages = [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Диалог сброшен. Чем могу помочь сейчас?',
          createdAt: new Date().toISOString()
        }
      ];
      const metricsStore = useMetricsStore();
      metricsStore.resetRequests();
    },
    setMode(mode: 'auto' | 'rag' | 'basic') {
      this.mode = mode;
    },
    async sendPrompt(content: string) {
      const trimmed = content.trim();
      if (!trimmed || this.isSending) return;
      const userStore = useUserStore();
      const metricsStore = useMetricsStore();
      const notifications = useNotificationStore();
      const userId = userStore.userId;

      if (!userId) {
        notifications.push({
          title: 'Требуется регистрация',
          description: 'Зарегистрируйтесь или войдите на главной странице, чтобы начать диалог с ассистентом.',
          tone: 'info'
        });
        return;
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString()
      };
      this.addMessage(userMessage);

      const placeholder: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '...',
        createdAt: new Date().toISOString(),
        pending: true
      };
      this.addMessage(placeholder);

      this.isSending = true;
      try {
        const response = await apiClient.chat({
          userId,
          message: trimmed,
          mode: this.mode
        });
        const lastIndex = this.messages.findIndex((msg) => msg.id === placeholder.id);
        if (lastIndex !== -1) {
          this.messages.splice(lastIndex, 1, {
            ...placeholder,
            pending: false,
            content: response.reply,
            createdAt: new Date().toISOString(),
            intent: response.intent,
            usage: response.usage,
            profileHint: response.profileHint,
            citations: response.citations,
            responseMode: response.mode
          });
        }
        metricsStore.incrementRequests();
        if (response.profileHint) {
          notifications.push({
            title: 'Уточните профиль',
            description: response.profileHint,
            tone: 'info'
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        notifications.push({
          title: 'Не удалось получить ответ',
          description: errorMessage,
          tone: 'error'
        });
        this.messages = this.messages.filter((msg) => msg.id !== placeholder.id);
      } finally {
        this.isSending = false;
      }
    }
  }
});
