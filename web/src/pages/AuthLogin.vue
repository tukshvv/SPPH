<template>
  <div class="grid gap-8 rounded-2xl bg-white/80 p-8 shadow-xl ring-1 ring-orange-100 lg:grid-cols-2">
    <div class="flex flex-col justify-center gap-4">
      <p class="text-sm font-semibold uppercase tracking-wide text-orange-500">Welcome back</p>
      <h1 class="text-3xl font-bold text-slate-900">Sign in to continue</h1>
      <p class="text-slate-600">Access your chats, track activity, and continue learning.</p>
      <div class="flex items-center gap-3 text-sm text-slate-600">
        <span class="h-px flex-1 bg-orange-100"></span>
        <span>New here?</span>
        <RouterLink class="font-semibold text-orange-600 hover:text-orange-700" to="/auth/register">
          Create an account
        </RouterLink>
      </div>
    </div>
    <form class="space-y-4" @submit.prevent="handleLogin">
      <div>
        <label class="text-sm font-medium text-slate-700">Email</label>
        <input v-model="email" type="email" required class="input" placeholder="you@example.com" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">Password</label>
        <input v-model="password" type="password" required class="input" placeholder="••••••••" />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button
        type="submit"
        class="w-full rounded-xl bg-orange-500 px-4 py-3 text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:opacity-50"
        :disabled="auth.loading"
      >
        {{ auth.loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push({ name: 'home' });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to login';
  }
};
</script>

<style scoped>
.input {
  @apply mt-1 w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-slate-900 shadow-inner shadow-orange-50 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200;
}
</style>
