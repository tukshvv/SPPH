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
      </div>
      <aside class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

const chatStore = useChatStore();
const draft = ref('');
const scrollArea = ref<HTMLDivElement | null>(null);
const userStore = useUserStore();
const metricsStore = useMetricsStore();
const notifications = useNotificationStore();

const ensuredUserId = userStore.ensureUserId();
const userIdInput = ref(ensuredUserId);

const profileForm = reactive({
  major: '',
  level: '',
  topics: ''
});

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
