<template>
  <div class="space-y-6">
    <div class="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 p-8 text-white shadow-xl">
      <p class="text-sm uppercase tracking-wide opacity-80">Dashboard</p>
      <div class="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">Welcome back, {{ auth.user?.name ?? 'Explorer' }}!</h1>
          <p class="mt-2 text-white/80">Track your conversations and jump into a new chat.</p>
        </div>
        <button
          class="rounded-xl bg-white px-4 py-3 text-orange-600 shadow-lg shadow-orange-200 transition hover:shadow-xl"
          @click="startChat"
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
        <button class="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-orange-600" @click="startChat">
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';

const auth = useAuthStore();
const chat = useChatStore();
const router = useRouter();

const startChat = async () => {
  const title = 'New conversation';
  const sessionId = await chat.createSession(title);
  router.push({ name: 'chat', params: { id: sessionId } });
};

onMounted(async () => {
  await auth.fetchProfile();
  await chat.fetchActivity();
  await chat.fetchSessions();
});

const activity = computed(() => chat.activity);
const sessions = computed(() => chat.sessions);
</script>

<style scoped>
.stat-card {
  @apply rounded-2xl bg-white/80 p-5 shadow ring-1 ring-orange-100;
}
</style>
