<template>
  <div class="space-y-6">
    <div class="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 p-8 text-white shadow-xl">
      <p class="text-sm uppercase tracking-wide opacity-80">Dashboard</p>
      <div class="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">Welcome back, {{ auth.user?.name ?? 'Explorer' }}!</h1>
          <p class="mt-2 text-white/80">Track your conversations, tasks, and notes. Start a new study chat with a mode.</p>
        </div>
        <button
          class="rounded-xl bg-white px-4 py-3 text-orange-600 shadow-lg shadow-orange-200 transition hover:shadow-xl"
          @click="openNewChat = true"
        >
          Start a new chat
        </button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="stat-card">
        <p class="text-sm text-slate-500">Total messages</p>
        <p class="text-3xl font-bold text-orange-600">{{ activity?.totalMessages ?? 0 }}</p>
      </div>
      <div class="stat-card">
        <p class="text-sm text-slate-500">Chat sessions</p>
        <p class="text-3xl font-bold text-orange-600">{{ activity?.totalSessions ?? 0 }}</p>
      </div>
      <div class="stat-card">
        <p class="text-sm text-slate-500">Last active</p>
        <p class="text-lg font-semibold text-slate-800">
          {{ activity?.lastActiveAt ? new Date(activity.lastActiveAt).toLocaleString() : '—' }}
        </p>
      </div>
    </div>

    <div class="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-slate-900">Your chats</h2>
        <button class="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-orange-600" @click="openNewChat = true">
          New chat
        </button>
      </div>
      <div class="mt-4 divide-y divide-orange-50">
        <div v-for="session in sessions" :key="session.id" class="flex items-center justify-between py-3">
          <div>
            <p class="font-semibold text-slate-900">{{ session.title }}</p>
            <p class="text-sm text-slate-500">Updated {{ new Date(session.lastMessageAt).toLocaleString() }}</p>
          </div>
          <RouterLink
            :to="{ name: 'chat', params: { id: session.id } }"
            class="rounded-lg border border-orange-100 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
          >
            Open
          </RouterLink>
        </div>
        <p v-if="sessions.length === 0" class="py-6 text-center text-slate-500">No chats yet. Start one!</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl bg-white p-6 shadow ring-1 ring-orange-100">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">Tasks</h3>
          <RouterLink class="text-sm font-semibold text-orange-600" to="/profile">Manage</RouterLink>
        </div>
        <p class="mt-1 text-sm text-slate-500">Nearest tasks to keep you on track.</p>
        <div class="mt-4 space-y-3">
          <div v-for="task in upcomingTasks" :key="task.id" class="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-slate-900">{{ task.title }}</p>
              <span v-if="task.dueDate" class="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                Due {{ new Date(task.dueDate).toLocaleDateString() }}
              </span>
            </div>
            <p class="text-xs text-slate-500">Status: {{ task.status }}</p>
          </div>
          <p v-if="upcomingTasks.length === 0" class="text-sm text-slate-500">No tasks yet.</p>
        </div>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow ring-1 ring-orange-100">
        <h3 class="text-lg font-semibold text-slate-900">Analytics</h3>
        <p class="mt-1 text-sm text-slate-500">Your personal learning pulse.</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="stat-card">
            <p class="text-xs text-slate-500">Total chats</p>
            <p class="text-2xl font-bold text-orange-600">{{ dashboard?.totalChats ?? 0 }}</p>
          </div>
          <div class="stat-card">
            <p class="text-xs text-slate-500">Tasks done</p>
            <p class="text-2xl font-bold text-orange-600">{{ dashboard?.tasksDone ?? 0 }}</p>
          </div>
          <div class="stat-card">
            <p class="text-xs text-slate-500">Most used mode</p>
            <p class="text-lg font-semibold text-slate-900">{{ dashboard?.mostUsedMode ?? 'general' }}</p>
          </div>
          <div class="stat-card">
            <p class="text-xs text-slate-500">Recent subjects</p>
            <p class="text-sm font-semibold text-slate-900">{{ (dashboard?.recentSubjects ?? []).join(', ') || '—' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="openNewChat" class="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4">
      <div class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">New study chat</h3>
          <button class="text-slate-500" @click="openNewChat = false">✕</button>
        </div>
        <div class="mt-4 space-y-3">
          <label class="block text-sm font-semibold text-slate-700">Mode</label>
          <select v-model="newChat.mode" class="w-full rounded-xl border border-orange-200 px-3 py-2">
            <option value="general">General help</option>
            <option value="explain">Explain concepts</option>
            <option value="quiz">Make practice questions / quiz</option>
            <option value="study-plan">Create study plan</option>
            <option value="brainstorm">Brainstorm ideas / essay structure</option>
          </select>
          <div>
            <label class="block text-sm font-semibold text-slate-700">Subject</label>
            <input v-model="newChat.subject" class="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2" placeholder="e.g. Statistics" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700">Goal</label>
            <textarea
              v-model="newChat.goal"
              class="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2"
              rows="3"
              placeholder="Prepare for stats quiz on hypothesis tests"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700">Due date</label>
            <input v-model="newChat.dueDate" type="date" class="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button class="rounded-xl border border-orange-200 px-4 py-2 text-slate-600" @click="openNewChat = false">Cancel</button>
          <button class="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white shadow" @click="startChat">Start chat</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import { useTaskStore } from '../stores/tasks';
import { apiClient, type DashboardSummary } from '../lib/api';

const auth = useAuthStore();
const chat = useChatStore();
const tasks = useTaskStore();
const router = useRouter();
const openNewChat = ref(false);
const dashboard = ref<DashboardSummary | null>(null);
const newChat = reactive({ mode: 'general', subject: '', goal: '', dueDate: '' });

const startChat = async () => {
  const title = newChat.goal || 'New conversation';
  const sessionId = await chat.createSession(title, {
    mode: newChat.mode,
    subject: newChat.subject,
    goal: newChat.goal,
    dueDate: newChat.dueDate ? new Date(newChat.dueDate).toISOString() : undefined
  });
  openNewChat.value = false;
  router.push({ name: 'chat', params: { id: sessionId } });
};

onMounted(async () => {
  await auth.fetchProfile();
  await chat.fetchActivity();
  await chat.fetchSessions();
  await tasks.fetch();
  if (auth.token) {
    dashboard.value = await apiClient.getDashboard(auth.token);
  }
});

const activity = computed(() => chat.activity);
const sessions = computed(() => chat.sessions);
const upcomingTasks = computed(() => tasks.tasks.slice(0, 4));
</script>

<style scoped>
.stat-card {
  @apply rounded-2xl bg-white/80 p-5 shadow ring-1 ring-orange-100;
}
</style>
