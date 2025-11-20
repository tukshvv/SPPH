import { defineStore } from 'pinia';
import { apiClient, type NoteItem } from '../lib/api';
import { useAuthStore } from './auth';

interface NoteState {
  notes: NoteItem[];
  loading: boolean;
  error: string | null;
}

export const useNoteStore = defineStore('notes', {
  state: (): NoteState => ({ notes: [], loading: false, error: null }),
  actions: {
    async fetch(subject?: string) {
      const auth = useAuthStore();
      auth.hydrate();
      if (!auth.token) return;
      this.loading = true;
      try {
        const { notes } = await apiClient.listNotes(auth.token, subject);
        this.notes = notes;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load notes';
      } finally {
        this.loading = false;
      }
    },
    async create(payload: { title: string; subject?: string | null; content: string }) {
      const auth = useAuthStore();
      if (!auth.token) return;
      const { note } = await apiClient.createNote(payload, auth.token);
      this.notes.unshift(note);
      return note;
    },
    async update(id: string, payload: Partial<NoteItem>) {
      const auth = useAuthStore();
      if (!auth.token) return;
      const { note } = await apiClient.updateNote(id, payload, auth.token);
      this.notes = this.notes.map((n) => (n.id === id ? note : n));
    },
    async remove(id: string) {
      const auth = useAuthStore();
      if (!auth.token) return;
      await apiClient.deleteNote(id, auth.token);
      this.notes = this.notes.filter((n) => n.id !== id);
    }
  }
});
