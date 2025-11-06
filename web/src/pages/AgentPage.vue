<template>
  <section class="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col gap-6 px-4 py-6">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="space-y-6">
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="space-y-2">
              <h1 class="text-2xl font-semibold text-slate-900">Агент SPPH</h1>
              <p class="text-sm text-slate-500">
                Постройте автономного помощника, который преобразует вашу задачу в пошаговый план, использует документы и
                фиксирует результаты каждого шага.
              </p>
            </div>
            <div class="flex flex-col items-end gap-2 text-xs text-slate-500">
              <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                {{ docsSummary }}
              </span>
              <span v-if="currentRun" class="text-slate-400">Активный план создан {{ createdAgo }}</span>
            </div>
          </div>
          <div
            v-if="!isRegistered"
            class="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-slate-600"
          >
            <h2 class="text-base font-semibold text-slate-900">Зарегистрируйтесь, чтобы запускать агента</h2>
            <p class="mt-2">Мы сохраняем ваши настройки и результаты шагов только для зарегистрированных пользователей.</p>
            <RouterLink
              to="/"
              class="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              Перейти к регистрации
            </RouterLink>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">1. Сформулируйте цель</h2>
              <p class="text-sm text-slate-500">
                Опишите конечный результат, который вы хотите получить. По желанию добавьте контекст и включите документы.
              </p>
            </div>
            <div class="flex gap-2 text-xs text-slate-500">
              <span v-if="currentRun" class="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                Шагов: {{ currentRun.steps.length }}
              </span>
              <span v-if="pendingSteps > 0" class="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                Осталось: {{ pendingSteps }}
              </span>
            </div>
          </header>

          <form class="mt-6 space-y-4" @submit.prevent="handlePlan">
            <div class="space-y-2">
              <label for="agent-goal" class="text-sm font-semibold text-slate-700">Цель агента</label>
              <input
                id="agent-goal"
                v-model="goal"
                type="text"
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Например, подготовить конспект по новой теме, спланировать недельный проект или собрать отчёт"
              />
            </div>

            <div class="space-y-2">
              <label for="agent-context" class="text-sm font-semibold text-slate-700">Дополнительный контекст</label>
              <textarea
                id="agent-context"
                v-model="context"
                rows="4"
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Укажите ограничения, готовые материалы или формат результата"
              />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <input v-model="useDocs" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span>
                  <span class="font-semibold text-slate-800">Использовать документы RAG</span>
                  <span class="block text-xs text-slate-500">{{ docsDescription }}</span>
                </span>
              </label>
              <label class="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <input v-model="autoRun" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span>
                  <span class="font-semibold text-slate-800">Автовыполнение плана</span>
                  <span class="block text-xs text-slate-500">Агент последовательно выполнит шаги после генерации плана.</span>
                </span>
              </label>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                :disabled="isPlanning || !goal.trim()"
              >
                <span v-if="isPlanning" class="flex items-center gap-2">
                  <span class="h-2 w-2 animate-ping rounded-full bg-white" />
                  Строим план...
                </span>
                <span v-else>Построить план</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!currentRun"
                @click="handleReset"
              >
                Сбросить
              </button>
            </div>
          </form>
        </div>

        <div v-if="currentRun" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">2. План действий</h2>
              <p class="text-sm text-slate-500">Следите за выполнением шагов, просматривайте результаты и корректируйте план.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isPlanning || isExecuting || currentRun.steps.length === 0"
                @click="handleAutoRunToggle"
              >
                <span v-if="autoRunning">Остановить автозапуск</span>
                <span v-else>Запустить автоматически</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                @click="() => agentStore.resetRun()"
              >
                Начать заново
              </button>
            </div>
          </header>

          <div v-if="currentRun.summary" class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Сводка плана</h3>
            <p class="mt-2 whitespace-pre-wrap leading-relaxed">{{ currentRun.summary }}</p>
          </div>

          <div class="mt-6 space-y-4">
            <div
              v-for="(step, index) in currentRun.steps"
              :key="step.id"
              class="rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Шаг {{ index + 1 }}</p>
                  <h3 class="text-lg font-semibold text-slate-900">{{ step.title }}</h3>
                  <p v-if="step.detail" class="text-sm leading-relaxed text-slate-600">{{ step.detail }}</p>
                </div>
                <span :class="statusBadge(step.status)">{{ statusLabel(step.status) }}</span>
              </div>

              <div v-if="step.result" class="mt-4 space-y-2 text-sm text-slate-600">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Результат</p>
                <pre class="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed">{{ step.result }}</pre>
              </div>

              <div v-if="step.error" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {{ step.error }}
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                  :disabled="isExecuting || isPlanning || step.status === 'running'"
                  @click="() => handleExecuteStep(step.id)"
                >
                  <span v-if="step.status === 'running'">Выполняется...</span>
                  <span v-else>Выполнить шаг</span>
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                  @click="() => agentStore.markStepComplete(step.id)"
                >
                  Отметить выполненным
                </button>
                <button
                  v-if="step.status !== 'pending'"
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-primary hover:text-primary"
                  @click="() => agentStore.resetStep(step.id)"
                >
                  Сбросить шаг
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">Как работает агент</h2>
          <ul class="mt-3 space-y-3 text-sm text-slate-600">
            <li class="flex gap-2">
              <span class="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Сформулируйте цель и контекст — агент построит структурированный план действий.
            </li>
            <li class="flex gap-2">
              <span class="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Включите документы, чтобы использовать RAG-контекст и закрепить знания из ваших материалов.
            </li>
            <li class="flex gap-2">
              <span class="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Запускайте шаги автоматически или вручную, фиксируйте результаты и отмечайте прогресс.
            </li>
          </ul>
          <RouterLink
            to="/docs"
            class="mt-4 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            Управлять документами
          </RouterLink>
        </div>

        <div v-if="currentRun?.successCriteria?.length" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">Критерии успеха</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li v-for="item in currentRun.successCriteria" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div v-if="currentRun" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-800">Журнал агента</h2>
            <span class="text-xs text-slate-400">{{ currentRun.log.length }} записей</span>
          </div>
          <div ref="logScroll" class="mt-3 max-h-80 space-y-3 overflow-y-auto pr-2 text-sm text-slate-600">
            <article
              v-for="entry in currentRun.log"
              :key="entry.id"
              class="rounded-2xl border border-slate-100 bg-slate-50 p-3"
            >
              <header class="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{{ entry.type === 'plan' ? 'Планирование' : 'Шаг выполнен' }}</span>
                <span>{{ formatTimestamp(entry.createdAt) }}</span>
              </header>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{{ entry.content }}</p>
            </article>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useAgentStore, type AgentStepStatus } from '../stores/agent';
import { useDocsStore } from '../stores/docs';
import { useUserStore } from '../stores/user';

const agentStore = useAgentStore();
const docsStore = useDocsStore();
const userStore = useUserStore();

const goal = ref('');
const context = ref('');
const useDocs = ref(false);
const autoRun = ref(true);

const currentRun = computed(() => agentStore.currentRun);
const isPlanning = computed(() => agentStore.isPlanning);
const isExecuting = computed(() => agentStore.isExecuting);
const autoRunning = computed(() => agentStore.autoRunning);
const hasDocs = computed(() => docsStore.documents.length > 0);
const pendingSteps = computed(() => agentStore.pendingSteps.length);
const isRegistered = computed(() => userStore.isRegistered);

watch(
  hasDocs,
  (value) => {
    if (value && !currentRun.value) {
      useDocs.value = true;
    }
  },
  { immediate: true }
);

const logScroll = ref<HTMLDivElement | null>(null);

watch(
  () => currentRun.value?.log.length,
  () => {
    const target = logScroll.value;
    if (!target) return;
    requestAnimationFrame(() => {
      if (!logScroll.value) return;
      logScroll.value.scrollTop = logScroll.value.scrollHeight;
    });
  }
);

const formatTimestamp = (iso: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short'
  });
};

const docsSummary = computed(() => {
  const count = docsStore.documents.length;
  if (count === 0) return 'Документов RAG нет';
  if (count === 1) return '1 документ RAG';
  return `${count} документа RAG`;
});

const docsDescription = computed(() => {
  if (docsStore.documents.length === 0) {
    return 'Нет загруженных материалов. Загляните на страницу документов, чтобы добавить конспекты.';
  }
  return 'Агент сможет цитировать ваши материалы при выполнении шагов.';
});

const createdAgo = computed(() => {
  if (!currentRun.value) return '';
  return formatTimestamp(currentRun.value.createdAt);
});

const handlePlan = async () => {
  if (isPlanning.value) return;
  try {
    await agentStore.planRun({
      goal: goal.value,
      context: context.value,
      useDocs: useDocs.value,
      autoStart: autoRun.value
    });
    if (autoRun.value) {
      await agentStore.autoRunSteps();
    }
  } catch (error) {
    // Ошибки обрабатываются через уведомления
  }
};

const handleExecuteStep = async (stepId: string) => {
  try {
    await agentStore.executeStep(stepId);
  } catch (error) {
    // Ошибки обрабатываются через уведомления
  }
};

const handleAutoRunToggle = async () => {
  if (!currentRun.value) return;
  if (autoRunning.value) {
    agentStore.cancelAutoRun();
  } else {
    await agentStore.autoRunSteps();
  }
};

const handleReset = () => {
  agentStore.resetRun();
};

const statusLabel = (status: AgentStepStatus) => {
  switch (status) {
    case 'pending':
      return 'Ожидает запуска';
    case 'running':
      return 'Выполняется';
    case 'complete':
      return 'Завершено';
    case 'error':
      return 'Ошибка';
    default:
      return status;
  }
};

const statusBadge = (status: AgentStepStatus) => {
  const base = 'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold';
  switch (status) {
    case 'pending':
      return `${base} bg-slate-100 text-slate-600`;
    case 'running':
      return `${base} bg-amber-100 text-amber-700`;
    case 'complete':
      return `${base} bg-emerald-100 text-emerald-700`;
    case 'error':
      return `${base} bg-rose-100 text-rose-700`;
    default:
      return base;
  }
};
</script>
