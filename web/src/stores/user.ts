import { defineStore } from 'pinia';

const STORAGE_KEY = 'spph:userId';

interface UserState {
  userId: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userId: null
  }),
  actions: {
    ensureUserId() {
      if (this.userId) return this.userId;

      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.userId = stored;
          return stored;
        }

        const generated = crypto.randomUUID();
        this.userId = generated;
        window.localStorage.setItem(STORAGE_KEY, generated);
        return generated;
      }

      const fallback = crypto.randomUUID();
      this.userId = fallback;
      return fallback;
    }
  }
});
