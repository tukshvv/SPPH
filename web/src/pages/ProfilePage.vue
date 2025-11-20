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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';

const auth = useAuthStore();
const chat = useChatStore();
const name = ref(auth.user?.name ?? '');

const activity = computed(() => chat.activity);

const save = async () => {
  if (!name.value.trim()) return;
  await auth.updateProfile(name.value.trim());
};

onMounted(async () => {
  await auth.fetchProfile();
  name.value = auth.user?.name ?? '';
  await chat.fetchActivity();
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
