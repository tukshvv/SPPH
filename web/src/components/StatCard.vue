<template>
  <div class="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p class="text-sm font-medium text-slate-500">{{ title }}</p>
    <p class="text-3xl font-semibold text-slate-900">{{ value }}</p>
    <p v-if="description" class="text-xs text-slate-400">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  description?: string;
}>();
</script>
