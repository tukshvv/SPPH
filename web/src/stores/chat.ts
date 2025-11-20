import { defineStore } from 'pinia';
import { apiClient, type ActivitySummary, type ChatMessage, type ChatSessionDetail, type SessionSummary } from '../lib/api';
import { useAuthStore } from './auth';

interface ChatState {
  sessions: SessionSummary[];
  currentSession: ChatSessionDetail | null;
  loading: boolean;
  error: string | null;
  sending: boolean;
  activity: ActivitySummary | null;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    sessions: [],
    currentSession: null,
    loading: false,
    error: null,
    sending: false,
    activity: null
  }),
  actions: {
    async fetchSessions() {
      const auth = useAuthStore();
      auth.hydrate();
      if (!auth.token) return;
      this.loading = true;
      try {
        const { sessions } = await apiClient.listSessions(auth.token);
        this.sessions = sessions;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load sessions';
      } finally {
        this.loading = false;
      }
    },
    async fetchActivity() {
      const auth = useAuthStore();
      auth.hydrate();
      if (!auth.token) return;
      try {
        this.activity = await apiClient.getActivity(auth.token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load activity';
      }
    },
    async createSession(
      title: string,
      meta?: { mode?: string; subject?: string | null; goal?: string | null; dueDate?: string | null }
    ) {
      const auth = useAuthStore();
      if (!auth.token) throw new Error('Not authenticated');
      const { session } = await apiClient.createSession({ title, ...meta }, auth.token);
      this.sessions.unshift(session);
      this.currentSession = { ...session, messages: [] };
      return session.id;
    },
    async loadSession(sessionId: string) {
      const auth = useAuthStore();
      if (!auth.token) throw new Error('Not authenticated');
      this.loading = true;
      try {
        this.currentSession = await apiClient.getSession(sessionId, auth.token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load session';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async sendMessage(content: string) {
      const auth = useAuthStore();
      if (!auth.token || !this.currentSession) throw new Error('Not authenticated');
      this.sending = true;
      const sessionId = this.currentSession.id;
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };
      this.currentSession.messages.push(userMessage);
      try {
        const { reply } = await apiClient.sendMessage(sessionId, { content }, auth.token);
        this.currentSession.messages.push(reply);
        await this.fetchActivity();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to send message';
        this.currentSession.messages = this.currentSession.messages.filter((m) => m.id !== userMessage.id);
        throw error;
      } finally {
        this.sending = false;
      }
    },
    async react(messageId: string, value: number) {
      const auth = useAuthStore();
      if (!auth.token) return;
      try {
        await apiClient.sendFeedback({ messageId, value }, auth.token);
        if (this.currentSession) {
          const msg = this.currentSession.messages.find((m) => m.id === messageId);
          if (msg) {
            msg.feedback = { id: messageId, value };
          }
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to submit feedback';
      }
    }
  }
});
