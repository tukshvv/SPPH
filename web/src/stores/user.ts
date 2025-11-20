import { defineStore } from 'pinia';
import { apiClient, type UserProfilePayload } from '../lib/api';

const STORAGE_KEY = 'spph:userId';
const TOKEN_KEY = 'spph:authToken';

interface UserState {
  userId: string | null;
  profile: UserProfilePayload | null;
  profileLoading: boolean;
  profileError: string | null;
  authToken: string | null;
  authLoading: boolean;
  authError: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userId: null,
    profile: null,
    profileLoading: false,
    profileError: null,
    authToken: null,
    authLoading: false,
    authError: null
  }),
  actions: {
    initialize() {
      if (this.userId && this.authToken) return;
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (stored) {
          this.userId = stored;
        }
        if (token) {
          this.authToken = token;
        }
      }
    },
    setUserId(userId: string) {
      this.userId = userId;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, userId);
      }
    },
    ensureUserId() {
      this.initialize();
      if (this.userId) return this.userId;

      const generated = crypto.randomUUID();
      this.setUserId(generated);
      return generated;
    },
    async login(password: string) {
      const userId = this.ensureUserId();
      this.authLoading = true;
      this.authError = null;
      try {
        const session = await apiClient.login({ userId, password });
        this.authToken = session.token;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(TOKEN_KEY, session.token);
        }
        await this.fetchProfile();
      } catch (error) {
        this.authError = error instanceof Error ? error.message : 'Не удалось войти';
        throw error;
      } finally {
        this.authLoading = false;
      }
    },
    logout() {
      this.authToken = null;
      this.profile = null;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    },
    async fetchProfile() {
      if (!this.userId || !this.authToken) {
        this.profileError = 'Необходимо войти, чтобы загрузить профиль';
        return;
      }
      this.profileLoading = true;
      this.profileError = null;
      try {
        this.profile = await apiClient.fetchUserProfile(this.userId, this.authToken);
      } catch (error) {
        this.profileError = error instanceof Error ? error.message : 'Не удалось загрузить профиль';
      } finally {
        this.profileLoading = false;
      }
    },
    async updateProfile(patch: Partial<UserProfilePayload> & { topics?: string[] }) {
      if (!this.userId || !this.authToken) {
        throw new Error('User ID is not set');
      }
      this.profileLoading = true;
      this.profileError = null;
      try {
        this.profile = await apiClient.updateUserProfile({ userId: this.userId, patch }, this.authToken);
      } catch (error) {
        this.profileError = error instanceof Error ? error.message : 'Не удалось обновить профиль';
        throw error;
      } finally {
        this.profileLoading = false;
      }
    }
  }
});
