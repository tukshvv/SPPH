<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <section class="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <h2 class="text-xl font-semibold text-slate-900">Profile</h2>
      <p class="text-sm text-slate-500">Update your display name and review account details.</p>
      <form class="mt-4 space-y-4" @submit.prevent="save">
        <div>
          <label class="text-sm font-medium text-slate-700">Name</label>
          <input v-model="name" type="text" class="input" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Email</label>
          <input :value="auth.user?.email" disabled class="input bg-orange-50/50" />
        </div>
        <p v-if="auth.error" class="text-sm text-red-600">{{ auth.error }}</p>
        <button
          type="submit"
          class="rounded-xl bg-orange-500 px-4 py-3 text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:opacity-50"
          :disabled="auth.loading"
        >
          {{ auth.loading ? 'Saving...' : 'Save changes' }}
        </button>
      </form>
    </section>

    <section class="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <h2 class="text-xl font-semibold text-slate-900">Activity</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="stat-card">
          <p class="text-sm text-slate-500">Total messages</p>
          <p class="text-3xl font-bold text-orange-600">{{ activity?.totalMessages ?? 0 }}</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-slate-500">Sessions</p>
          <p class="text-3xl font-bold text-orange-600">{{ activity?.totalSessions ?? 0 }}</p>
        </div>
        <div class="stat-card sm:col-span-2">
          <p class="text-sm text-slate-500">Last active</p>
          <p class="text-lg font-semibold text-slate-800">
            {{ activity?.lastActiveAt ? new Date(activity.lastActiveAt).toLocaleString() : '—' }}
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <h2 class="text-xl font-semibold text-slate-900">Preferences</h2>
      <p class="text-sm text-slate-500">Control how SPPH responds.</p>
      <div class="mt-4 space-y-4">
        <div>
          <label class="text-sm font-medium text-slate-700">Preferred language</label>
          <select v-model="preferredLanguage" class="input">
            <option value="en">English</option>
            <option value="ru">Russian</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Response style</label>
          <select v-model="responseStyle" class="input">
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <button class="rounded-xl bg-orange-500 px-4 py-3 text-white shadow hover:bg-orange-600" @click="savePrefs">
          Save preferences
        </button>
      </div>
    </section>

    <section class="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-900">Tasks</h2>
        <button class="rounded-lg bg-orange-500 px-3 py-1 text-sm text-white" @click="addQuickTask">+ Add</button>
      </div>
      <p class="text-sm text-slate-500">Organize your study plan.</p>
      <div class="mt-4 space-y-3">
        <div v-for="task in tasks.tasks" :key="task.id" class="rounded-xl border border-orange-100 p-3">
          <div class="flex items-center justify-between">
            <p class="font-semibold text-slate-900">{{ task.title }}</p>
            <select v-model="task.status" class="rounded-lg border border-orange-200 px-2 py-1 text-sm" @change="updateTask(task)">
              <option value="todo">To-do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <p class="text-xs text-slate-500">Due: {{ task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—' }}</p>
        </div>
        <p v-if="tasks.tasks.length === 0" class="text-sm text-slate-500">No tasks yet.</p>
      </div>
    </section>

    <section class="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-900">Notes</h2>
        <button class="rounded-lg bg-orange-500 px-3 py-1 text-sm text-white" @click="addNote">+ Add</button>
      </div>
      <p class="text-sm text-slate-500">Save personal reminders per subject.</p>
      <div class="mt-4 space-y-3">
        <div v-for="note in notes.notes" :key="note.id" class="rounded-xl border border-orange-100 p-3">
          <p class="font-semibold text-slate-900">{{ note.title }} <span class="text-xs text-slate-500">{{ note.subject }}</span></p>
          <p class="text-sm text-slate-600 whitespace-pre-line">{{ note.content }}</p>
        </div>
        <p v-if="notes.notes.length === 0" class="text-sm text-slate-500">No notes yet.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import { useTaskStore } from '../stores/tasks';
import { useNoteStore } from '../stores/notes';
import { usePreferenceStore } from '../stores/preferences';

const auth = useAuthStore();
const chat = useChatStore();
const tasks = useTaskStore();
const notes = useNoteStore();
const prefs = usePreferenceStore();
const name = ref(auth.user?.name ?? '');
const preferredLanguage = ref('en');
const responseStyle = ref('balanced');

const activity = computed(() => chat.activity);

const save = async () => {
  if (!name.value.trim()) return;
  await auth.updateProfile(name.value.trim());
};

const savePrefs = async () => {
  await prefs.update({ preferredLanguage: preferredLanguage.value, responseStyle: responseStyle.value });
};

const addQuickTask = async () => {
  await tasks.addTask({ title: 'New task', status: 'todo' });
};

const updateTask = async (task: any) => {
  await tasks.updateTask(task.id, { status: task.status });
};

const addNote = async () => {
  await notes.create({ title: 'New note', subject: 'General', content: 'Add content' });
};

onMounted(async () => {
  await auth.fetchProfile();
  name.value = auth.user?.name ?? '';
  await chat.fetchActivity();
  await prefs.fetch();
  preferredLanguage.value = prefs.preferences?.preferredLanguage ?? 'en';
  responseStyle.value = prefs.preferences?.responseStyle ?? 'balanced';
  await tasks.fetch();
  await notes.fetch();
});
</script>

<style scoped>
.input {
  @apply mt-1 w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-slate-900 shadow-inner shadow-orange-50 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200;
}
.stat-card {
  @apply rounded-2xl bg-white/80 p-5 shadow ring-1 ring-orange-100;
}
</style>
