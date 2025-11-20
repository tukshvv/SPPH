import { defineStore } from 'pinia';
import { apiClient, type AuthResponse, type ProfilePayload } from '../lib/api';

interface AuthState {
  token: string | null;
  user: ProfilePayload | null;
  loading: boolean;
  error: string | null;
}

const TOKEN_KEY = 'spph:token';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    hydrate() {
      if (typeof window === 'undefined' || this.token) return;
      const saved = window.localStorage.getItem(TOKEN_KEY);
      if (saved) this.token = saved;
    },
    persistToken(token: string) {
      this.token = token;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
    },
    clear() {
      this.token = null;
      this.user = null;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    },
    async handleAuthResponse(response: AuthResponse) {
      this.persistToken(response.token);
      this.user = { ...response.user } as ProfilePayload;
      await this.fetchProfile();
    },
    async register(name: string, email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.register({ name, email, password });
        await this.handleAuthResponse(response);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to register';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.login({ email, password });
        await this.handleAuthResponse(response);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to login';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async fetchProfile() {
      this.hydrate();
      if (!this.token) return;
      try {
        this.user = await apiClient.getProfile(this.token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load profile';
      }
    },
    async updateProfile(name: string) {
      if (!this.token) return;
      this.loading = true;
      this.error = null;
      try {
        this.user = await apiClient.updateProfile({ name }, this.token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update profile';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
