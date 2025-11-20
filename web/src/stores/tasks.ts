import { defineStore } from 'pinia';
import { apiClient, type TaskItem } from '../lib/api';
import { useAuthStore } from './auth';

interface TaskState {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
}

export const useTaskStore = defineStore('tasks', {
  state: (): TaskState => ({ tasks: [], loading: false, error: null }),
  getters: {
    byStatus: (state) => (status: string) => state.tasks.filter((t) => t.status === status)
  },
  actions: {
    async fetch(status?: string) {
      const auth = useAuthStore();
      auth.hydrate();
      if (!auth.token) return;
      this.loading = true;
      try {
        const { tasks } = await apiClient.listTasks(auth.token, status);
        this.tasks = tasks;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load tasks';
      } finally {
        this.loading = false;
      }
    },
    async addTask(payload: Partial<TaskItem>) {
      const auth = useAuthStore();
      if (!auth.token) return;
      const { task } = await apiClient.createTask(payload, auth.token);
      this.tasks.unshift(task);
      return task;
    },
    async updateTask(id: string, payload: Partial<TaskItem>) {
      const auth = useAuthStore();
      if (!auth.token) return;
      const { task } = await apiClient.updateTask(id, payload, auth.token);
      this.tasks = this.tasks.map((t) => (t.id === id ? task : t));
    },
    async removeTask(id: string) {
      const auth = useAuthStore();
      if (!auth.token) return;
      await apiClient.deleteTask(id, auth.token);
      this.tasks = this.tasks.filter((t) => t.id !== id);
    },
    async createFromText(text: string, chatSessionId?: string) {
      const auth = useAuthStore();
      if (!auth.token) return [];
      const { tasks } = await apiClient.createTasksFromText({ text, chatSessionId }, auth.token);
      this.tasks = [...tasks, ...this.tasks];
      return tasks;
    }
  }
});
