<template>
  <section class="mx-auto w-full max-w-6xl px-4 py-12">
    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div class="space-y-8">
        <div class="space-y-4">
          <span class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Новая стартовая страница
          </span>
          <h1 class="text-4xl font-semibold tracking-tight text-slate-900">
            Персональный ассистент для SPPH с аналитикой и документами
          </h1>
          <p class="text-lg text-slate-600">
            Зарегистрируйтесь, чтобы сохранять профиль, загружать материалы и получать персональные ответы. После
            регистрации вам станет доступен чат, загрузка документов для RAG и детальная статистика.
          </p>
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Настройка профиля и интересов</span>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <span class="h-2 w-2 rounded-full bg-sky-400"></span>
              <span>Документы для умных ответов</span>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <span class="h-2 w-2 rounded-full bg-violet-400"></span>
              <span>Дашборд с метриками</span>
            </div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">Чат</h2>
            <p class="mt-2 text-sm text-slate-500">Диалог с ассистентом в выбранном режиме, мгновенные подсказки.</p>
            <RouterLink
              to="/chat"
              class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-hover"
            >
              Перейти в чат →
            </RouterLink>
          </div>
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">Документы</h2>
            <p class="mt-2 text-sm text-slate-500">Загружайте выдержки и конспекты для RAG-ответов ассистента.</p>
            <RouterLink
              to="/docs"
              class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-hover"
            >
              Управлять документами →
            </RouterLink>
          </div>
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">Дашборд</h2>
            <p class="mt-2 text-sm text-slate-500">Следите за сессиями, токенами и эффективностью работы ассистента.</p>
            <RouterLink
              to="/dashboard"
              class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-hover"
            >
              Посмотреть аналитику →
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 class="text-xl font-semibold text-slate-900">Регистрация</h2>
        <p class="mt-2 text-sm text-slate-500">
          Введите контактные данные и расскажите о своих интересах. Мы создадим уникальный идентификатор, который можно
          использовать в API и для входа с других устройств.
        </p>

        <div
          v-if="isAlreadyRegistered"
          class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <p class="font-semibold">Вы уже зарегистрированы.</p>
          <p class="mt-1">
            Обновите контактные данные или перейдите сразу в чат и другие разделы.
          </p>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Имя и фамилия</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Например: Алия Бекетова"
            />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="university@example.com"
            />
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Специализация</label>
              <input
                v-model="form.major"
                type="text"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Экономика здравоохранения"
              />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Уровень</label>
              <input
                v-model="form.level"
                type="text"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="магистратура"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Темы (через запятую)</label>
            <input
              v-model="form.topics"
              type="text"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="устойчивое развитие, цифровое здоровье"
            />
          </div>

          <button
            type="submit"
            class="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Создание аккаунта…</span>
            <span v-else>{{ isAlreadyRegistered ? 'Обновить данные' : 'Зарегистрироваться' }}</span>
          </button>
        </form>

        <div v-if="userStore.userId" class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p class="font-semibold text-slate-800">Ваш текущий идентификатор:</p>
          <p class="mt-1 break-all font-mono text-sm text-slate-900">{{ userStore.userId }}</p>
          <p class="mt-2">
            Сохраните ID — он понадобится для доступа к чату и API. Обновить данные можно на странице профиля.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useNotificationStore } from '../stores/notifications';
import { useMetricsStore } from '../stores/metrics';

const router = useRouter();
const userStore = useUserStore();
const notifications = useNotificationStore();
const metricsStore = useMetricsStore();

const form = reactive({
  name: '',
  email: '',
  major: '',
  level: '',
  topics: ''
});

const isSubmitting = ref(false);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isAlreadyRegistered = computed(() => userStore.isRegistered);

watch(
  () => userStore.registration,
  (registration) => {
    if (registration) {
      form.name = registration.name;
      form.email = registration.email;
    }
  },
  { immediate: true }
);

watch(
  () => userStore.profile,
  (profile) => {
    if (profile) {
      form.major = profile.major ?? '';
      form.level = profile.level ?? '';
      form.topics = profile.topics.join(', ');
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (userStore.userId) {
    void userStore.fetchProfile();
  }
});

const parseTopics = (input: string) =>
  input
    .split(',')
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  if (!form.name.trim()) {
    notifications.push({
      title: 'Введите имя',
      description: 'Пожалуйста, укажите имя и фамилию.',
      tone: 'error'
    });
    return;
  }
  if (!emailPattern.test(form.email.trim())) {
    notifications.push({
      title: 'Некорректный e-mail',
      description: 'Проверьте адрес электронной почты и попробуйте ещё раз.',
      tone: 'error'
    });
    return;
  }

  isSubmitting.value = true;
  const topics = parseTopics(form.topics);

  try {
    if (isAlreadyRegistered.value && userStore.userId) {
      userStore.updateRegistrationMeta({
        name: form.name.trim(),
        email: form.email.trim()
      });

      const patch: { major?: string; level?: string; topics?: string[] } = {};
      if (form.major.trim()) patch.major = form.major.trim();
      if (form.level.trim()) patch.level = form.level.trim();
      if (topics.length > 0) patch.topics = topics;

      if (Object.keys(patch).length > 0) {
        await userStore.updateProfile(patch);
      } else {
        await userStore.fetchProfile();
      }

      notifications.push({
        title: 'Данные обновлены',
        description: 'Контактная информация и профиль сохранены.',
        tone: 'success'
      });
      await router.push('/chat');
      return;
    }

    const { userId, previousId } = await userStore.registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      major: form.major.trim() || undefined,
      level: form.level.trim() || undefined,
      topics
    });

    if (previousId && previousId !== userId) {
      await metricsStore.stopVisit(previousId);
    }

    await metricsStore.startVisit(userId);

    notifications.push({
      title: 'Аккаунт создан',
      description: 'Теперь вы можете перейти в чат и загрузить документы для RAG.',
      tone: 'success'
    });

    await router.push('/chat');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось завершить регистрацию';
    notifications.push({
      title: 'Ошибка регистрации',
      description: message,
      tone: 'error'
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
