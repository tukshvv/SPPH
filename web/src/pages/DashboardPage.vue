<template>
  <section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold text-slate-900">Аналитика пользователя</h1>
      <p class="text-sm text-slate-500">
        Отслеживайте использование ассистента: сессии, длину промптов и эффективность модели.
      </p>
    </div>

    <div v-if="metrics.statsLoading" class="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
      Загружаем статистику…
    </div>

    <div v-else-if="metrics.statsError" class="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
      {{ metrics.statsError }}
    </div>

    <div v-else-if="metrics.stats" class="flex flex-col gap-6">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Всего запросов" :value="metrics.stats.totalRequests" />
        <StatCard title="Сессии" :value="metrics.stats.sessionsCount" :description="sessionHint" />
        <StatCard title="Время на сайте" :value="totalTime" :description="'Сумма завершённых визитов'" />
        <StatCard title="Средняя длина промпта" :value="`${Math.round(metrics.stats.avgPromptLength)} символов`" :description="`Ответ: ${Math.round(metrics.stats.avgResponseLength)} символов`" />
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Последние взаимодействия</h2>
            <p class="text-xs text-slate-500">Последние 20 записей</p>
          </div>
          <button class="text-sm font-semibold text-primary transition hover:text-primary-hover" @click="refresh">
            Обновить
          </button>
        </header>
        <div v-if="metrics.stats.recentInteractions.length === 0" class="px-6 py-12 text-center text-sm text-slate-500">
          Пока нет взаимодействий. Вернитесь в чат и отправьте запрос.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-6 py-3">Время</th>
                <th class="px-6 py-3">Промпт</th>
                <th class="px-6 py-3">Ответ</th>
                <th class="px-6 py-3">Модель</th>
                <th class="px-6 py-3">Токены</th>
                <th class="px-6 py-3">Стоимость</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="interaction in metrics.stats.recentInteractions" :key="interaction.id" class="hover:bg-slate-50">
                <td class="px-6 py-3 text-slate-600">{{ formatDate(interaction.createdAt) }}</td>
                <td class="px-6 py-3 text-slate-600">{{ interaction.promptLen }} симв.</td>
                <td class="px-6 py-3 text-slate-600">{{ interaction.responseLen }} симв.</td>
                <td class="px-6 py-3 text-slate-600">{{ interaction.model }}</td>
                <td class="px-6 py-3 text-slate-600">{{ interaction.promptTokens + interaction.completionTokens }}</td>
                <td class="px-6 py-3 text-slate-600">
                  <span v-if="interaction.costUsd">${{ interaction.costUsd.toFixed(4) }}</span>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMetricsStore } from '../stores/metrics';
import { useUserStore } from '../stores/user';
import StatCard from '../components/StatCard.vue';

const metrics = useMetricsStore();
const userStore = useUserStore();

const totalTime = computed(() => {
  if (!metrics.stats) return '0 мин.';
  const minutes = Math.round(metrics.stats.totalTimeMs / 60000);
  return minutes < 1 ? '<1 мин.' : `${minutes} мин.`;
});

const sessionHint = computed(() => {
  if (!metrics.stats) return '';
  return metrics.stats.sessionsCount === 1 ? 'Одна активная сессия' : 'Уникальные визиты пользователя';
});

const refresh = () => {
  const userId = userStore.ensureUserId();
  void metrics.fetchStats(userId);
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short'
  });

onMounted(() => {
  refresh();
});
</script>
