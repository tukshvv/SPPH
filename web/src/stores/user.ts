import { defineStore } from 'pinia';
import { apiClient, type UserProfilePayload } from '../lib/api';

const STORAGE_KEY = 'spph:userId';

interface UserState {
  userId: string | null;
  profile: UserProfilePayload | null;
  profileLoading: boolean;
  profileError: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userId: null,
    profile: null,
    profileLoading: false,
    profileError: null
  }),
  actions: {
    initialize() {
      if (this.userId) return;
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.userId = stored;
          return;
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
    async fetchProfile() {
      if (!this.userId) return;
      this.profileLoading = true;
      this.profileError = null;
      try {
        this.profile = await apiClient.fetchUserProfile(this.userId);
      } catch (error) {
        this.profileError = error instanceof Error ? error.message : 'Не удалось загрузить профиль';
      } finally {
        this.profileLoading = false;
      }
    },
    async updateProfile(patch: Partial<UserProfilePayload> & { topics?: string[] }) {
      if (!this.userId) {
        throw new Error('User ID is not set');
      }
      this.profileLoading = true;
      this.profileError = null;
      try {
        this.profile = await apiClient.updateUserProfile({ userId: this.userId, patch });
      } catch (error) {
        this.profileError = error instanceof Error ? error.message : 'Не удалось обновить профиль';
        throw error;
      } finally {
        this.profileLoading = false;
      }
    }
  }
});
