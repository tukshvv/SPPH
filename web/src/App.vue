<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary-hover">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">SP</span>
          <span>SPPH Chat</span>
        </RouterLink>
        <nav class="flex items-center gap-3 text-sm font-medium text-slate-600">
          <RouterLink to="/" custom v-slot="{ href, navigate, isExactActive }">
            <a
              :href="href"
              @click.prevent="navigate"
              :class="navClasses(isExactActive)"
            >
              Чат
            </a>
          </RouterLink>
          <RouterLink to="/dashboard" custom v-slot="{ href, navigate, isExactActive }">
            <a
              :href="href"
              @click.prevent="navigate"
              :class="navClasses(isExactActive)"
            >
              Дашборд
            </a>
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <RouterView />
    </main>
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import ToastHost from './components/ToastHost.vue';

const navClasses = (active: boolean) =>
  [
    'rounded-full px-3 py-1 transition',
    active ? 'bg-primary text-white shadow-sm' : 'hover:bg-primary/10 hover:text-primary'
  ];
</script>
