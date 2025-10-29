<template>
  <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
    <transition-group name="toast" tag="div">
      <div
        v-for="toast in notifications.toasts"
        :key="toast.id"
        class="pointer-events-auto rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
      >
        <div class="flex items-start gap-3">
          <div :class="iconClasses(toast.tone)" class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span v-if="toast.tone === 'error'">⚠️</span>
            <span v-else-if="toast.tone === 'success'">✅</span>
            <span v-else>💬</span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-slate-900">{{ toast.title }}</p>
            <p v-if="toast.description" class="mt-1 text-sm text-slate-600">{{ toast.description }}</p>
          </div>
          <button class="text-sm text-slate-400 hover:text-slate-600" @click="notifications.dismiss(toast.id)">
            ×
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../stores/notifications';

const notifications = useNotificationStore();

const iconClasses = (tone: string | undefined) => {
  if (tone === 'error') return 'text-rose-500';
  if (tone === 'success') return 'text-emerald-500';
  return 'text-primary';
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
