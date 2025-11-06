import { defineStore } from 'pinia';
import { apiClient, type UserProfilePayload } from '../lib/api';

const STORAGE_KEY = 'spph:user';
const LEGACY_STORAGE_KEY = 'spph:userId';

interface StoredUserRecord {
  userId: string;
  name?: string;
  email?: string;
  registeredAt?: string;
}

export interface RegistrationMeta {
  name: string;
  email: string;
  registeredAt: string;
}

interface UserState {
  userId: string | null;
  profile: UserProfilePayload | null;
  profileLoading: boolean;
  profileError: string | null;
  registration: RegistrationMeta | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userId: null,
    profile: null,
    profileLoading: false,
    profileError: null,
    registration: null
  }),
  getters: {
    isRegistered: (state) => Boolean(state.userId && state.registration)
  },
  actions: {
    initialize() {
      if (this.userId) return;
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as StoredUserRecord;
            if (parsed.userId) {
              this.userId = parsed.userId;
              if (parsed.name || parsed.email || parsed.registeredAt) {
                this.registration = {
                  name: parsed.name ?? '',
                  email: parsed.email ?? '',
                  registeredAt: parsed.registeredAt ?? new Date().toISOString()
                };
              }
              return;
            }
          } catch (error) {
            console.warn('Unable to parse stored user record', error);
          }
        }
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          this.userId = legacy;
          return;
        }
      }
    },
    setUserId(userId: string) {
      this.userId = userId;
      this.persistState();
    },
    ensureUserId() {
      this.initialize();
      if (this.userId) return this.userId;

      const generated = crypto.randomUUID();
      this.setUserId(generated);
      return generated;
    },
    setRegistration(meta: RegistrationMeta | null) {
      this.registration = meta;
      this.persistState();
    },
    persistState() {
      if (typeof window === 'undefined') return;
      if (this.userId) {
        const payload: StoredUserRecord = { userId: this.userId };
        if (this.registration) {
          payload.name = this.registration.name;
          payload.email = this.registration.email;
          payload.registeredAt = this.registration.registeredAt;
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        window.localStorage.setItem(LEGACY_STORAGE_KEY, this.userId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    },
    async registerUser(payload: {
      name: string;
      email: string;
      major?: string;
      level?: string;
      topics?: string[];
    }) {
      const newId = crypto.randomUUID();
      const previousId = this.userId;
      this.userId = newId;
      this.registration = {
        name: payload.name,
        email: payload.email,
        registeredAt: new Date().toISOString()
      };
      this.persistState();

      const patch: Partial<UserProfilePayload> & { topics?: string[] } = {};
      if (payload.major) patch.major = payload.major;
      if (payload.level) patch.level = payload.level;
      if (payload.topics && payload.topics.length > 0) {
        patch.topics = payload.topics;
      }

      if (Object.keys(patch).length > 0) {
        try {
          await this.updateProfile(patch);
        } catch (error) {
          throw error;
        }
      } else {
        await this.fetchProfile();
      }

      return { userId: newId, previousId };
    },
    async switchUser(userId: string) {
      const trimmed = userId.trim();
      if (!trimmed) {
        throw new Error('User ID is not set');
      }
      const previousId = this.userId;
      this.userId = trimmed;
      this.registration = null;
      this.persistState();
      await this.fetchProfile();
      return previousId;
    },
    updateRegistrationMeta(patch: Partial<Pick<RegistrationMeta, 'name' | 'email'>>) {
      const base: RegistrationMeta =
        this.registration ?? {
          name: '',
          email: '',
          registeredAt: new Date().toISOString()
        };
      this.registration = {
        ...base,
        ...patch
      };
      this.persistState();
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
