<template>
  <div class="rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Activity calendar</h3>
        <p class="text-sm text-slate-500">Messages and sessions over time</p>
      </div>
      <div class="flex items-center gap-1 text-xs text-slate-500">
        <span class="legend bg-slate-100"></span> none
        <span class="legend bg-orange-100"></span> low
        <span class="legend bg-orange-300"></span> medium
        <span class="legend bg-orange-500"></span> high
      </div>
    </div>
    <div class="mt-4 overflow-x-auto">
      <div class="flex gap-1">
        <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="flex flex-col gap-1">
          <div
            v-for="day in week"
            :key="day.date"
            :title="tooltip(day)"
            class="h-3.5 w-3.5 rounded-sm"
            :class="intensityClass(day.score)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface DayUsage {
  date: string;
  messages: number;
  sessions: number;
}

const props = defineProps<{ days: DayUsage[] }>();

const sortedDays = computed(() =>
  [...props.days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
);

const filledDays = computed(() => {
  if (sortedDays.value.length === 0) return [] as DayUsage[];
  const map = new Map(sortedDays.value.map((d) => [d.date, d] as const));
  const first = new Date(sortedDays.value[0].date);
  const last = new Date(sortedDays.value[sortedDays.value.length - 1].date);
  const days: DayUsage[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const existing = map.get(key);
    days.push(existing ?? { date: key, messages: 0, sessions: 0 });
  }
  return days;
});

const weeks = computed(() => {
  const chunks: { date: string; score: number }[][] = [];
  let currentWeek: { date: string; score: number }[] = [];
  filledDays.value.forEach((day, index) => {
    const date = new Date(day.date);
    const score = day.messages + day.sessions;
    if (index === 0) {
      for (let i = 0; i < date.getDay(); i++) {
        currentWeek.push({ date: `${day.date}-pad-${i}`, score: 0 });
      }
    }
    currentWeek.push({ date: day.date, score });
    if (date.getDay() === 6) {
      chunks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length) chunks.push(currentWeek);
  return chunks;
});

const intensityClass = (score: number) => {
  if (score === 0) return 'bg-slate-100';
  if (score <= 2) return 'bg-orange-100';
  if (score <= 5) return 'bg-orange-300';
  if (score <= 10) return 'bg-orange-500';
  return 'bg-orange-700';
};

const tooltip = (day: { date: string; score: number }) => `${day.date}: ${day.score} interactions`;
</script>

<style scoped>
.legend {
  @apply h-3 w-3 rounded-sm border border-orange-100;
}
</style>
