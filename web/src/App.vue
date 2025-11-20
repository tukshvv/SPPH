<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 text-slate-900">
    <header v-if="auth.isAuthenticated" class="border-b border-orange-100 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <RouterLink to="/home" class="flex items-center gap-3 text-lg font-bold text-orange-600">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xl">⚡</span>
          <span>SPPH</span>
        </RouterLink>
        <nav class="flex items-center gap-3 text-sm font-medium text-slate-700">
          <RouterLink to="/home" class="nav-link" active-class="active">Home</RouterLink>
          <RouterLink to="/chat" class="nav-link" active-class="active">Chat</RouterLink>
          <RouterLink to="/profile" class="nav-link" active-class="active">Profile</RouterLink>
          <button class="rounded-full bg-orange-500 px-3 py-1 text-white shadow hover:bg-orange-600" @click="logout">Logout</button>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
auth.hydrate();
const router = useRouter();

const logout = () => {
  auth.clear();
  router.push({ name: 'login' });
};
</script>

<style scoped>
.nav-link {
  @apply rounded-full px-3 py-1 transition hover:bg-orange-100 hover:text-orange-600;
}
.nav-link.active {
  @apply bg-orange-500 text-white shadow;
}
</style>
