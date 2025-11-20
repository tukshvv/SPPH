import { defineStore } from 'pinia';
import { apiClient, type PreferencesPayload } from '../lib/api';
import { useAuthStore } from './auth';

interface PreferenceState {
  preferences: PreferencesPayload | null;
  loading: boolean;
  error: string | null;
}

export const usePreferenceStore = defineStore('preferences', {
  state: (): PreferenceState => ({ preferences: null, loading: false, error: null }),
  actions: {
    async fetch() {
      const auth = useAuthStore();
      auth.hydrate();
      if (!auth.token) return;
      this.loading = true;
      try {
        this.preferences = await apiClient.getPreferences(auth.token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load preferences';
      } finally {
        this.loading = false;
      }
    },
    async update(payload: Partial<PreferencesPayload>) {
      const auth = useAuthStore();
      if (!auth.token) return;
      this.preferences = await apiClient.updatePreferences(payload, auth.token);
      return this.preferences;
    }
  }
});
