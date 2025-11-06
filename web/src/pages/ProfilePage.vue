<template>
  <section class="mx-auto w-full max-w-6xl px-4 py-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold text-slate-900">Профиль и идентификатор</h1>
      <p class="text-sm text-slate-500">
        Управляйте контактной информацией, учебным профилем и идентификатором, который используется в чате и API.
      </p>
    </div>

    <div v-if="!userStore.userId" class="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
      <h2 class="text-lg font-semibold text-slate-900">Аккаунт не создан</h2>
      <p class="mt-2">Перейдите на главную страницу и пройдите регистрацию, чтобы открыть доступ к настройкам профиля.</p>
      <RouterLink
        to="/"
        class="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
      >
        На главную
      </RouterLink>
    </div>

    <div v-else class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-6">
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Контакты</h2>
          <p class="mt-1 text-sm text-slate-500">Имя и e-mail используются в уведомлениях и подсказках ассистента.</p>

          <form class="mt-4 space-y-3" @submit.prevent="handleAccountSave">
            <div>
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Имя и фамилия</label>
              <input
                v-model="accountForm.name"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Имя пользователя"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</label>
              <input
                v-model="accountForm.email"
                type="email"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="user@example.com"
              />
            </div>
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isUpdatingAccount"
            >
              <span v-if="isUpdatingAccount">Сохранение…</span>
              <span v-else>Сохранить контакты</span>
            </button>
          </form>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Учебный профиль</h2>
          <p class="mt-1 text-sm text-slate-500">
            Эти данные влияют на подсказки модели и рекомендации по улучшению запросов.
          </p>

          <form class="mt-4 space-y-3" @submit.prevent="handleProfileSave">
            <div>
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Специализация</label>
              <input
                v-model="profileForm.major"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Например: международное здравоохранение"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Уровень</label>
              <input
                v-model="profileForm.level"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="бакалавриат, магистратура…"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Темы</label>
              <input
                v-model="profileForm.topics"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="через запятую, например: устойчивое развитие, фармаэкономика"
              />
            </div>
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isUpdatingProfile"
            >
              <span v-if="isUpdatingProfile">Обновляем…</span>
              <span v-else>Обновить профиль</span>
            </button>
            <p v-if="userStore.profileError" class="text-xs text-rose-500">{{ userStore.profileError }}</p>
          </form>
        </div>
      </div>

      <aside class="space-y-6">
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Ваш ID</h2>
          <p class="mt-1 text-sm text-slate-500">
            Используйте идентификатор для авторизации в API и восстановления профиля на другом устройстве.
          </p>
          <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="font-mono text-sm text-slate-900 break-all">{{ userStore.userId }}</p>
            <p v-if="userStore.registration" class="mt-2 text-xs text-slate-500">
              Зарегистрирован: {{ formatRegisteredAt(userStore.registration.registeredAt) }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                @click="handleCopyId"
              >
                Скопировать ID
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Сменить пользователя</h2>
          <p class="mt-1 text-sm text-slate-500">
            Если у вас уже есть сохранённый ID, введите его, чтобы переключиться и загрузить профиль.
          </p>
          <form class="mt-4 space-y-3" @submit.prevent="handleSwitchUser">
            <input
              v-model="switchForm.userId"
              type="text"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Вставьте существующий UUID"
            />
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSwitching"
            >
              <span v-if="isSwitching">Переключаем…</span>
              <span v-else>Переключиться</span>
            </button>
          </form>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useMetricsStore } from '../stores/metrics';
import { useNotificationStore } from '../stores/notifications';

const userStore = useUserStore();
const metricsStore = useMetricsStore();
const notifications = useNotificationStore();

const accountForm = reactive({ name: '', email: '' });
const profileForm = reactive({ major: '', level: '', topics: '' });
const switchForm = reactive({ userId: '' });

const isUpdatingAccount = ref(false);
const isUpdatingProfile = ref(false);
const isSwitching = ref(false);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registration = computed(() => userStore.registration);

watch(
  registration,
  (value) => {
    accountForm.name = value?.name ?? '';
    accountForm.email = value?.email ?? '';
  },
  { immediate: true }
);

watch(
  () => userStore.profile,
  (profile) => {
    profileForm.major = profile?.major ?? '';
    profileForm.level = profile?.level ?? '';
    profileForm.topics = profile?.topics?.join(', ') ?? '';
  },
  { immediate: true }
);

const parseTopics = (input: string) =>
  input
    .split(',')
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);

const handleAccountSave = () => {
  if (isUpdatingAccount.value) return;
  if (!accountForm.name.trim()) {
    notifications.push({
      title: 'Введите имя',
      description: 'Имя необходимо для персонализации ассистента.',
      tone: 'error'
    });
    return;
  }
  if (!emailPattern.test(accountForm.email.trim())) {
    notifications.push({
      title: 'Некорректный e-mail',
      description: 'Проверьте адрес и попробуйте ещё раз.',
      tone: 'error'
    });
    return;
  }

  isUpdatingAccount.value = true;
  userStore.updateRegistrationMeta({
    name: accountForm.name.trim(),
    email: accountForm.email.trim()
  });
  notifications.push({
    title: 'Контакты сохранены',
    description: 'Имя и почта обновлены.',
    tone: 'success'
  });
  isUpdatingAccount.value = false;
};

const handleProfileSave = async () => {
  if (!userStore.userId || isUpdatingProfile.value) return;
  const patch: { major?: string; level?: string; topics?: string[] } = {};
  if (profileForm.major.trim()) patch.major = profileForm.major.trim();
  if (profileForm.level.trim()) patch.level = profileForm.level.trim();
  const topics = parseTopics(profileForm.topics);
  if (topics.length > 0) patch.topics = topics;

  if (Object.keys(patch).length === 0) {
    notifications.push({
      title: 'Нет изменений',
      description: 'Укажите хотя бы одно поле для обновления профиля.',
      tone: 'info'
    });
    return;
  }

  isUpdatingProfile.value = true;
  try {
    await userStore.updateProfile(patch);
    notifications.push({
      title: 'Профиль обновлён',
      description: 'Данные сохранены.',
      tone: 'success'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить профиль';
    notifications.push({
      title: 'Ошибка',
      description: message,
      tone: 'error'
    });
  } finally {
    isUpdatingProfile.value = false;
  }
};

const handleSwitchUser = async () => {
  if (isSwitching.value) return;
  if (!switchForm.userId.trim()) {
    notifications.push({
      title: 'Укажите идентификатор',
      description: 'Вставьте существующий UUID пользователя.',
      tone: 'error'
    });
    return;
  }

  isSwitching.value = true;
  try {
    const previousId = await userStore.switchUser(switchForm.userId);
    if (previousId && previousId !== userStore.userId) {
      await metricsStore.stopVisit(previousId);
    }
    if (userStore.userId) {
      await metricsStore.startVisit(userStore.userId);
    }
    notifications.push({
      title: 'Пользователь обновлён',
      description: 'Профиль и контакты загружены.',
      tone: 'success'
    });
    switchForm.userId = '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось переключиться';
    notifications.push({
      title: 'Ошибка',
      description: message,
      tone: 'error'
    });
  } finally {
    isSwitching.value = false;
  }
};

const handleCopyId = async () => {
  if (!userStore.userId) return;
  try {
    await navigator.clipboard.writeText(userStore.userId);
    notifications.push({
      title: 'Скопировано',
      description: 'Идентификатор добавлен в буфер обмена.',
      tone: 'success'
    });
  } catch (error) {
    console.error(error);
    notifications.push({
      title: 'Не удалось скопировать',
      description: 'Скопируйте ID вручную.',
      tone: 'error'
    });
  }
};

const formatRegisteredAt = (value: string) =>
  new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

onMounted(() => {
  if (userStore.userId) {
    void userStore.fetchProfile();
  }
});
</script>
