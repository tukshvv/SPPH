<template>
  <section class="mx-auto flex h-full min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col gap-6 px-4 py-6">
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="space-y-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="space-y-2">
              <h1 class="text-2xl font-semibold text-slate-900">Чат с ассистентом</h1>
              <p class="text-sm text-slate-500">
                Обсуждайте проекты, получайте объяснения и идеи. Зарегистрируйтесь, чтобы сохранять прогресс и настраивать профиль.
              </p>
            </div>
            <SessionBadge @reset="chatStore.resetConversation" />
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Режим ответа</p>
          <div class="mt-3 grid gap-3 md:grid-cols-3">
            <button
              v-for="option in modeOptions"
              :key="option.value"
              type="button"
              :class="modeButtonClass(option.value)"
              @click="handleModeChange(option.value)"
            >
              <span class="font-semibold">{{ option.label }}</span>
              <span class="text-[11px] leading-snug text-slate-500">{{ option.helper }}</span>
            </button>
          </div>
          <p class="mt-3 text-xs text-slate-400">
            Переключайтесь между обычным ответом, использованием ваших документов и автоматическим режимом.
          </p>
        </div>

        <div
          v-if="!isRegistered"
          class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600"
        >
          <h2 class="text-base font-semibold text-slate-900">Начните с регистрации</h2>
          <p class="mt-2">
            Чтобы ассистент помнил ваш профиль и рассчитывал статистику, создайте аккаунт на странице авторизации.
          </p>
          <RouterLink
            to="/auth"
            class="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            Перейти к авторизации
          </RouterLink>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <header class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-slate-800">Ваш профиль</h2>
              <p class="text-xs text-slate-500">Ключевые сведения об учёбе и интересах.</p>
            </div>
            <RouterLink
              to="/profile"
              class="text-xs font-semibold text-primary transition hover:text-primary-hover"
            >
              Настроить
            </RouterLink>
          </header>
          <dl v-if="userStore.profile" class="mt-4 space-y-2 text-sm text-slate-600">
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Специализация</dt>
              <dd class="font-medium text-slate-800">{{ userStore.profile.major ?? '—' }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Уровень</dt>
              <dd class="font-medium text-slate-800">{{ userStore.profile.level ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Темы</dt>
              <dd class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="topic in userStore.profile.topics"
                  :key="topic"
                  class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {{ topic }}
                </span>
                <span v-if="userStore.profile.topics.length === 0" class="text-xs text-slate-400">пока пусто</span>
              </dd>
            </div>
          </dl>
          <div v-else class="mt-4 text-xs text-slate-400">Профиль ещё не заполнен.</div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">Документы RAG</h2>
          <p class="mt-1 text-xs text-slate-500">
            Загрузите выдержки и конспекты на отдельной странице, чтобы ассистент использовал их в ответах.
          </p>
          <p class="mt-3 text-sm font-semibold text-slate-800">
            Загружено документов: <span class="text-primary">{{ docsCount }}</span>
          </p>
          <RouterLink
            to="/docs"
            class="mt-3 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            Управлять документами
          </RouterLink>
        </div>
      </aside>
    </div>

    <div ref="scrollArea" class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <ChatMessageList :messages="chatStore.messages" />
      <ChatInput v-model="draft" :disabled="chatStore.isSending || !userStore.userId" @submit="handleSubmit" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useChatStore } from '../stores/chat';
import ChatMessageList from '../components/ChatMessageList.vue';
import ChatInput from '../components/ChatInput.vue';
import SessionBadge from '../components/SessionBadge.vue';
import { useUserStore } from '../stores/user';
import { useDocsStore } from '../stores/docs';

const chatStore = useChatStore();
const userStore = useUserStore();
const docsStore = useDocsStore();

const draft = ref('');
const scrollArea = ref<HTMLDivElement | null>(null);

const modeOptions: Array<{ value: 'auto' | 'rag' | 'basic'; label: string; helper: string }> = [
  { value: 'auto', label: 'Auto', helper: 'Автовыбор подходящего режима ответа' },
  { value: 'rag', label: 'RAG-only', helper: 'Использует только загруженные документы' },
  { value: 'basic', label: 'Basic', helper: 'Отвечает без дополнительного контекста' }
];

const isRegistered = computed(() => userStore.isRegistered);
const docsCount = computed(() => docsStore.documents.length);

const scrollToBottom = () => {
  nextTick(() => {
    const container = scrollArea.value;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  });
};

watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom();
  }
);

const handleSubmit = () => {
  if (!draft.value.trim()) return;
  void chatStore.sendPrompt(draft.value);
  draft.value = '';
};

const handleModeChange = (value: 'auto' | 'rag' | 'basic') => {
  chatStore.setMode(value);
};

const modeButtonClass = (value: 'auto' | 'rag' | 'basic') => {
  const base = 'w-full rounded-xl border px-3 py-2 text-left text-sm transition flex flex-col gap-1';
  if (chatStore.mode === value) {
    return `${base} border-primary bg-primary/10 text-primary shadow-sm`;
  }
  return `${base} border-slate-200 text-slate-600 hover:border-primary/60`;
};

watch(
  () => userStore.userId,
  (value) => {
    if (value) {
      void userStore.fetchProfile();
    } else {
      chatStore.resetConversation();
    }
  },
  { immediate: true }
);

onMounted(() => {
  scrollToBottom();
});
</script>
