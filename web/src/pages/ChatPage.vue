<template>
  <section class="mx-auto flex h-full min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col gap-4 px-4 py-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="flex-1">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">Чат с ассистентом</h1>
            <p class="mt-1 text-sm text-slate-500">
              Используйте чат, чтобы быстро получать идеи и ответы. История сохранится, пока вкладка открыта.
            </p>
          </div>
          <SessionBadge @reset="chatStore.resetConversation" />
        </div>
        <form class="mt-4 flex flex-col gap-2 md:flex-row md:items-end" @submit.prevent="handleUserIdSave">
          <div class="flex-1">
            <label class="text-xs font-medium uppercase tracking-wide text-slate-500">User ID</label>
            <input
              v-model="userIdInput"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="UUID пользователя"
            />
          </div>
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/40"
          >
            Сохранить ID
          </button>
        </form>
        <div class="mt-4">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Режим ответа</p>
          <div class="mt-2 grid gap-2 md:grid-cols-3">
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
        </div>
      </div>
      <aside class="w-full max-w-md space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-slate-800">Профиль</h2>
              <p class="text-xs text-slate-500">Настройте специализацию и темы, чтобы ответы были точнее.</p>
            </div>
            <span v-if="userStore.profileLoading" class="text-xs text-slate-400">Обновление…</span>
          </header>
          <dl class="mt-3 space-y-2 text-sm text-slate-600">
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Специализация</dt>
              <dd class="font-medium text-slate-800">{{ userStore.profile?.major ?? 'не задано' }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-slate-500">Уровень</dt>
              <dd class="font-medium text-slate-800">{{ userStore.profile?.level ?? 'не задан' }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Темы</dt>
              <dd class="mt-1 flex flex-wrap gap-1">
                <span
                  v-if="!userStore.profile || userStore.profile.topics.length === 0"
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                >
                  пока пусто
                </span>
                <span
                  v-for="topic in userStore.profile?.topics ?? []"
                  :key="topic"
                  class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {{ topic }}
                </span>
              </dd>
            </div>
          </dl>
          <form class="mt-4 space-y-2" @submit.prevent="handleProfileSubmit">
            <div>
              <label class="text-xs text-slate-500">Специализация</label>
              <input
                v-model="profileForm.major"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Например: Экономика"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Уровень</label>
              <input
                v-model="profileForm.level"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Например: магистратура"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Темы (через запятую)</label>
              <input
                v-model="profileForm.topics"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Например: устойчивое развитие, экономика здоровья"
              />
            </div>
            <button
              type="submit"
              class="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              Обновить профиль
            </button>
          </form>
          <p v-if="userStore.profileError" class="mt-2 text-xs text-red-500">{{ userStore.profileError }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header>
            <h2 class="text-sm font-semibold text-slate-800">Docs</h2>
            <p class="mt-1 text-xs text-slate-500">Загрузите конспекты или выдержки, чтобы использовать их в RAG-ответах.</p>
          </header>
          <form class="mt-3 space-y-2" @submit.prevent="handleDocIngest">
            <div>
              <label class="text-xs text-slate-500">Doc ID (опционально)</label>
              <input
                v-model="docForm.id"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Если оставить пустым, ID создастся автоматически"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Раздел/секция</label>
              <input
                v-model="docForm.section"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Например: лекция 3, глава 2"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Текст</label>
              <textarea
                v-model="docForm.text"
                rows="5"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Вставьте текст документа для индексации"
              />
            </div>
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/40 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="docsStore.isIngesting"
            >
              <span v-if="docsStore.isIngesting">Загрузка…</span>
              <span v-else>Ingest</span>
            </button>
          </form>
          <div class="mt-4">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Загруженные документы</h3>
            <p v-if="docsStore.documents.length === 0" class="mt-2 text-xs text-slate-400">
              Пока ничего не загружено.
            </p>
            <ul v-else class="mt-2 space-y-2 text-sm">
              <li
                v-for="doc in docsStore.documents"
                :key="doc.id"
                class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p class="font-semibold text-slate-700">{{ doc.id }}</p>
                <p class="text-xs text-slate-500">Фрагментов: {{ doc.chunks.length }} · {{ formatDocTimestamp(doc.createdAt) }}</p>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
    <div ref="scrollArea" class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <ChatMessageList :messages="chatStore.messages" />
      <ChatInput v-model="draft" :disabled="chatStore.isSending" @submit="handleSubmit" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '../stores/chat';
import ChatMessageList from '../components/ChatMessageList.vue';
import ChatInput from '../components/ChatInput.vue';
import SessionBadge from '../components/SessionBadge.vue';
import { useUserStore } from '../stores/user';
import { useMetricsStore } from '../stores/metrics';
import { useNotificationStore } from '../stores/notifications';
import { useDocsStore } from '../stores/docs';

const chatStore = useChatStore();
const draft = ref('');
const scrollArea = ref<HTMLDivElement | null>(null);
const userStore = useUserStore();
const metricsStore = useMetricsStore();
const notifications = useNotificationStore();
const docsStore = useDocsStore();

const ensuredUserId = userStore.ensureUserId();
const userIdInput = ref(ensuredUserId);

const profileForm = reactive({
  major: '',
  level: '',
  topics: ''
});

const docForm = reactive({
  id: '',
  section: '',
  text: ''
});

const modeOptions: Array<{ value: 'auto' | 'rag' | 'basic'; label: string; helper: string }> = [
  { value: 'auto', label: 'Auto', helper: 'Автовыбор: ассистент сам решает, когда использовать RAG' },
  { value: 'rag', label: 'RAG-only', helper: 'Ответ только по загруженным документам' },
  { value: 'basic', label: 'Basic', helper: 'Обычный ответ без контекста RAG' }
];

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

const handleUserIdSave = async () => {
  const trimmed = userIdInput.value.trim();
  if (!trimmed) {
    notifications.push({
      title: 'ID не сохранён',
      description: 'Введите корректный идентификатор пользователя',
      tone: 'error'
    });
    return;
  }

  const previousId = userStore.userId;
  userStore.setUserId(trimmed);
  await userStore.fetchProfile();
  chatStore.resetConversation();
  if (previousId && previousId !== trimmed) {
    await metricsStore.stopVisit(previousId);
    metricsStore.sessionId = null;
    await metricsStore.startVisit(trimmed);
  }
  notifications.push({
    title: 'ID обновлён',
    description: 'Локальный идентификатор пользователя сохранён',
    tone: 'success'
  });
};

const handleDocIngest = async () => {
  const meta: Record<string, string> = {};
  if (docForm.section.trim()) {
    meta.section = docForm.section.trim();
  }

  try {
    await docsStore.ingestDocument({
      id: docForm.id.trim() ? docForm.id.trim() : undefined,
      text: docForm.text,
      meta: Object.keys(meta).length > 0 ? meta : undefined
    });
    notifications.push({
      title: 'Документ загружен',
      description: `Сохранено фрагментов: ${docsStore.lastInserted?.chunks ?? '-'}`,
      tone: 'success'
    });
    if (!docForm.id.trim() && docsStore.lastInserted?.docId) {
      docForm.id = docsStore.lastInserted.docId;
    }
    docForm.text = '';
    docForm.section = '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить документ';
    notifications.push({
      title: 'Ошибка загрузки',
      description: message,
      tone: 'error'
    });
  }
};

const formatDocTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });

const handleProfileSubmit = async () => {
  const patch: { major?: string; level?: string; topics?: string[] } = {};
  if (profileForm.major.trim()) {
    patch.major = profileForm.major.trim();
  }
  if (profileForm.level.trim()) {
    patch.level = profileForm.level.trim();
  }
  const topics = profileForm.topics
    .split(',')
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);
  if (topics.length > 0) {
    patch.topics = topics;
  }

  if (Object.keys(patch).length === 0) {
    notifications.push({
      title: 'Нет изменений',
      description: 'Укажите хотя бы одно поле для обновления профиля',
      tone: 'info'
    });
    return;
  }

  try {
    await userStore.updateProfile(patch);
    notifications.push({
      title: 'Профиль обновлён',
      description: 'Данные профиля сохранены',
      tone: 'success'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить профиль';
    notifications.push({
      title: 'Ошибка',
      description: message,
      tone: 'error'
    });
  }
};

watch(
  () => userStore.profile,
  (profile) => {
    profileForm.major = profile?.major ?? '';
    profileForm.level = profile?.level ?? '';
    profileForm.topics = profile?.topics?.join(', ') ?? '';
  },
  { immediate: true }
);

watch(
  () => userStore.userId,
  (value) => {
    if (value && value !== userIdInput.value) {
      userIdInput.value = value;
    }
  }
);

onMounted(async () => {
  await userStore.fetchProfile();
  scrollToBottom();
});
</script>
