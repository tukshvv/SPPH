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
      userStore.initialize();

      let activeUserId: string | null = userStore.isRegistered ? userStore.userId : null;

      if (activeUserId) {
        await this.startVisit(activeUserId);
      }

      const handleBeforeUnload = () => {
        if (activeUserId) {
          void this.stopVisit(activeUserId);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('visibilitychange', () => {
        if (!activeUserId) return;
        if (document.visibilityState === 'hidden') {
          void this.stopVisit(activeUserId);
        } else if (document.visibilityState === 'visible') {
          void this.startVisit(activeUserId);
        }
      });

      userStore.$subscribe(async (_, state) => {
        if (state.userId === activeUserId) return;

        if (activeUserId) {
          await this.stopVisit(activeUserId);
          this.sessionId = null;
        }

        activeUserId = state.userId && state.registration ? state.userId : null;

        if (activeUserId) {
          await this.startVisit(activeUserId);
        }
      });
    },
    async startVisit(userId: string) {
      try {
        const response = await apiClient.sendVisitEvent({
          userId,
          sessionId: this.sessionId ?? undefined,
          event: 'start'
        });
        if (response.sessionId) {
          this.sessionId = response.sessionId;
        }
        this.scheduleHeartbeat(userId);
      } catch (error) {
        console.error(error);
      }
    },
    async stopVisit(userId: string) {
      try {
        if (!this.sessionId) return;
        await apiClient.sendVisitEvent({
          userId,
          sessionId: this.sessionId,
          event: 'stop'
        });
        this.clearHeartbeat();
        this.sessionId = null;
      } catch (error) {
        console.error(error);
      }
    },
    async heartbeat(userId: string) {
      if (!this.sessionId) return;
      try {
        await apiClient.sendVisitEvent({
          userId,
          sessionId: this.sessionId,
          event: 'heartbeat'
        });
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
      this.statsLoading = true;
      this.statsError = null;
      try {
        this.stats = await apiClient.fetchUserStats(userId);
      } catch (error) {
        this.statsError = error instanceof Error ? error.message : 'Не удалось загрузить статистику';
      } finally {
        this.statsLoading = false;
      }
    }
  }
});
