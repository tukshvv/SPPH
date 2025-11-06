<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary-hover">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">SP</span>
          <span>SPPH Chat</span>
        </RouterLink>
        <nav class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            custom
            v-slot="{ href, navigate, isExactActive, isActive }"
          >
            <a
              :href="href"
              @click.prevent="navigate"
              :class="navClasses(link.exact ? isExactActive : isActive)"
            >
              {{ link.label }}
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

interface NavLink {
  to: string;
  label: string;
  exact?: boolean;
}

const navLinks: NavLink[] = [
  { to: '/', label: 'Главная', exact: true },
  { to: '/chat', label: 'Чат' },
  { to: '/agent', label: 'Агент' },
  { to: '/docs', label: 'Документы' },
  { to: '/profile', label: 'Профиль' },
  { to: '/dashboard', label: 'Дашборд' }
];

const navClasses = (active: boolean) =>
  [
    'rounded-full px-3 py-1 transition',
    active ? 'bg-primary text-white shadow-sm' : 'hover:bg-primary/10 hover:text-primary'
  ];
</script>
