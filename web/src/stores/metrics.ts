import { defineStore } from 'pinia';
import { apiClient, type UserStatsResponse } from '../lib/api';
import { useUserStore } from './user';

interface MetricsState {
  sessionId: string | null;
  requestCount: number;
  stats: UserStatsResponse | null;
  statsLoading: boolean;
  statsError: string | null;
  isBound: boolean;
  heartbeatHandle: number | null;
}

export const useMetricsStore = defineStore('metrics', {
  state: (): MetricsState => ({
    sessionId: null,
    requestCount: 0,
    stats: null,
    statsLoading: false,
    statsError: null,
    isBound: false,
    heartbeatHandle: null
  }),
  actions: {
    incrementRequests() {
      this.requestCount += 1;
    },
    resetRequests() {
      this.requestCount = 0;
    },
    async bindLifecycle() {
      if (this.isBound) return;
      this.isBound = true;
      const userStore = useUserStore();
      const userId = userStore.ensureUserId();
      if (userStore.authToken) {
        await this.startVisit(userId);
      }

      const handleBeforeUnload = () => {
        if (userStore.authToken) {
          void this.stopVisit(userId);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          void this.stopVisit(userId);
        } else if (document.visibilityState === 'visible') {
          void this.startVisit(userId);
        }
      });
    },
    async startVisit(userId: string) {
      const userStore = useUserStore();
      if (!userStore.authToken) return;
      try {
        const response = await apiClient.sendVisitEvent({
          userId,
          sessionId: this.sessionId ?? undefined,
          event: 'start'
        }, userStore.authToken);
        if (response.sessionId) {
          this.sessionId = response.sessionId;
        }
        this.scheduleHeartbeat(userId);
      } catch (error) {
        console.error(error);
      }
    },
    async stopVisit(userId: string) {
      const userStore = useUserStore();
      if (!userStore.authToken) return;
      try {
        if (!this.sessionId) return;
        await apiClient.sendVisitEvent({
          userId,
          sessionId: this.sessionId,
          event: 'stop'
        }, userStore.authToken);
        this.clearHeartbeat();
      } catch (error) {
        console.error(error);
      }
    },
    async heartbeat(userId: string) {
      const userStore = useUserStore();
      if (!this.sessionId || !userStore.authToken) return;
      try {
        await apiClient.sendVisitEvent({
          userId,
          sessionId: this.sessionId,
          event: 'heartbeat'
        }, userStore.authToken);
      } catch (error) {
        console.error(error);
      }
    },
    scheduleHeartbeat(userId: string) {
      this.clearHeartbeat();
      this.heartbeatHandle = window.setInterval(() => {
        void this.heartbeat(userId);
      }, 15000);
    },
    clearHeartbeat() {
      if (this.heartbeatHandle) {
        window.clearInterval(this.heartbeatHandle);
        this.heartbeatHandle = null;
      }
    },
    async fetchStats(userId: string) {
      const userStore = useUserStore();
      if (!userStore.authToken) {
        this.statsError = 'Необходимо войти, чтобы посмотреть статистику';
        return;
      }
      this.statsLoading = true;
      this.statsError = null;
      try {
        this.stats = await apiClient.fetchUserStats(userId, userStore.authToken);
      } catch (error) {
        this.statsError = error instanceof Error ? error.message : 'Не удалось загрузить статистику';
      } finally {
        this.statsLoading = false;
      }
    }
  }
});
