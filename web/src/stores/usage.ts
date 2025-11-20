import { defineStore } from 'pinia';
import { apiClient, type DailyUsageResponse } from '../lib/api';
import { useAuthStore } from './auth';

interface UsageState {
  data: DailyUsageResponse | null;
  loading: boolean;
  error: string | null;
}

export const useUsageStore = defineStore('usage', {
  state: (): UsageState => ({ data: null, loading: false, error: null }),
  actions: {
    async fetch(range?: { from?: string; to?: string }) {
      const auth = useAuthStore();
      auth.hydrate();
      if (!auth.token) return;
      this.loading = true;
      this.error = null;
      try {
        this.data = await apiClient.getDailyUsage(auth.token, range);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load usage';
      } finally {
        this.loading = false;
      }
    }
  }
});
