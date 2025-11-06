import { defineStore } from 'pinia';
import {
  apiClient,
  type AuthSuccessPayload,
  type LoginPayload,
  type RegisterUserPayload,
  type RegistrationMetaPayload,
  type UserProfilePayload
} from '../lib/api';

const STORAGE_KEY = 'spph:user';
const LEGACY_STORAGE_KEY = 'spph:userId';

export interface RegistrationMeta {
  name: string;
  email: string;
  registeredAt: string;
}

interface StoredUserRecord extends Partial<RegistrationMeta> {
  userId: string;
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
              if (parsed.name && parsed.email && parsed.registeredAt) {
                this.registration = {
                  name: parsed.name,
                  email: parsed.email,
                  registeredAt: parsed.registeredAt
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
    setUserContext(result: AuthSuccessPayload) {
      this.userId = result.userId;
      this.profile = result.profile;
      this.registration = result.registration
        ? { ...result.registration }
        : this.registration;
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
    async registerUser(payload: RegisterUserPayload) {
      const previousId = this.userId;
      const result = await apiClient.registerUser(payload);
      this.userId = result.userId;
      this.profile = result.profile;
      this.registration = result.registration ?? {
        name: payload.name,
        email: payload.email.toLowerCase(),
        registeredAt: new Date().toISOString()
      };
      this.persistState();
      return { userId: result.userId, previousId };
    },
    async login(payload: LoginPayload) {
      const previousId = this.userId;
      const result = await apiClient.login(payload);
      if (!result.registration) {
        throw new Error('У аккаунта отсутствуют контактные данные. Обновите профиль.');
      }
      this.setUserContext(result);
      return { userId: result.userId, previousId };
    },
    logout() {
      const previousId = this.userId;
      this.userId = null;
      this.profile = null;
      this.profileError = null;
      this.profileLoading = false;
      this.registration = null;
      this.persistState();
      return previousId;
    },
    setRegistration(meta: RegistrationMetaPayload | null) {
      this.registration = meta ? { ...meta } : null;
      this.persistState();
    },
    async updateAccount(payload: { name: string; email: string }) {
      if (!this.userId) {
        throw new Error('User ID is not set');
      }
      const registration = await apiClient.updateAccount({
        userId: this.userId,
        name: payload.name,
        email: payload.email
      });
      this.registration = registration;
      this.persistState();
      return registration;
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
