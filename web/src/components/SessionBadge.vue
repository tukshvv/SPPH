<template>
  <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">⚡</span>
    <div class="flex flex-col leading-tight">
      <span class="text-slate-500">Запросов за сессию</span>
      <span class="text-base font-semibold text-slate-900">{{ metrics.requestCount }}</span>
    </div>
    <button
      class="ml-3 text-xs font-semibold text-primary transition hover:text-primary-hover"
      type="button"
      @click="$emit('reset')"
    >
      Сбросить
    </button>
  </div>
</template>

<script setup lang="ts">
import { useMetricsStore } from '../stores/metrics';

const metrics = useMetricsStore();

defineEmits<{ (e: 'reset'): void }>();
</script>
