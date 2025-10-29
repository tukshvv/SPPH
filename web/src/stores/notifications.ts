import { defineStore } from 'pinia';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: 'info' | 'success' | 'error';
}

interface NotificationState {
  toasts: ToastMessage[];
}

export const useNotificationStore = defineStore('notifications', {
  state: (): NotificationState => ({
    toasts: []
  }),
  actions: {
    push(toast: Omit<ToastMessage, 'id'> & { id?: string; timeoutMs?: number }) {
      const id = toast.id ?? crypto.randomUUID();
      const entry: ToastMessage = {
        id,
        title: toast.title,
        description: toast.description,
        tone: toast.tone ?? 'info'
      };
      this.toasts.push(entry);

      const timeout = toast.timeoutMs ?? 4000;
      window.setTimeout(() => this.dismiss(id), timeout);
      return id;
    },
    dismiss(id: string) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    }
  }
});
