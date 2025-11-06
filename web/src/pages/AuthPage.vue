<template>
  <section class="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-5xl flex-col justify-center px-4 py-12">
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-8">
        <div class="space-y-4">
          <h1 class="text-4xl font-semibold tracking-tight text-slate-900">Войдите или зарегистрируйтесь</h1>
          <p class="text-lg text-slate-600">
            Создайте аккаунт, чтобы ассистент помнил ваш профиль, интересы и статистику. Если аккаунт уже есть — войдите по
            e-mail и паролю.
          </p>
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <span class="h-2 w-2 rounded-full bg-primary/60"></span>
              <span>Профиль и интересы</span>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <span class="h-2 w-2 rounded-full bg-amber-500/60"></span>
              <span>Сохранение истории</span>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <span class="h-2 w-2 rounded-full bg-violet-500/60"></span>
              <span>Доступ к аналитике</span>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-slate-900">Регистрация</h2>
          <p class="mt-2 text-sm text-slate-500">
            Укажите контакты и информацию об учёбе. После регистрации вы сможете перейти в чат и документы.
          </p>

          <div
            v-if="isAlreadyRegistered"
            class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <p class="font-semibold">Вы уже зарегистрированы.</p>
            <p class="mt-1">Обновите данные в профиле или просто войдите в аккаунт.</p>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="handleRegister">
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
            <div class="space-y-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Пароль</label>
              <input
                v-model="form.password"
                type="password"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-slate-100"
                placeholder="минимум 8 символов"
                :disabled="isAlreadyRegistered"
              />
              <p v-if="isAlreadyRegistered" class="text-xs text-slate-400">Пароль сохраняется, смена появится позднее.</p>
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
        </div>
      </div>

      <aside class="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 class="text-xl font-semibold text-slate-900">Вход</h2>
        <p class="mt-2 text-sm text-slate-500">Восстановите профиль и статистику, чтобы продолжить работу с ассистентом.</p>
        <form class="mt-6 space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</label>
            <input
              v-model="loginForm.email"
              type="email"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="university@example.com"
            />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Пароль</label>
            <input
              v-model="loginForm.password"
              type="password"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ваш пароль"
            />
          </div>
          <button
            type="submit"
            class="inline-flex w-full items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isLoginSubmitting"
          >
            <span v-if="isLoginSubmitting">Вход…</span>
            <span v-else>Войти</span>
          </button>
        </form>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useNotificationStore } from '../stores/notifications';
import { useMetricsStore } from '../stores/metrics';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const notifications = useNotificationStore();
const metricsStore = useMetricsStore();

const form = reactive({
  name: '',
  email: '',
  password: '',
  major: '',
  level: '',
  topics: ''
});

const loginForm = reactive({
  email: '',
  password: ''
});

const isSubmitting = ref(false);
const isLoginSubmitting = ref(false);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isAlreadyRegistered = computed(() => userStore.isRegistered);

watch(
  () => userStore.registration,
  (registration) => {
    if (registration) {
      form.name = registration.name;
      form.email = registration.email;
      loginForm.email = registration.email;
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

const parseTopics = (input: string) =>
  input
    .split(',')
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);

const resolveRedirect = () => {
  const redirectParam = route.query.redirect;
  if (typeof redirectParam === 'string' && redirectParam.startsWith('/')) {
    return redirectParam === '/auth' ? '/' : redirectParam;
  }
  return '/';
};

const handleRegister = async () => {
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
  if (form.password.trim().length < 8 && !isAlreadyRegistered.value) {
    notifications.push({
      title: 'Пароль слишком короткий',
      description: 'Придумайте пароль длиной не менее 8 символов.',
      tone: 'error'
    });
    return;
  }

  isSubmitting.value = true;
  const topics = parseTopics(form.topics);

  try {
    if (isAlreadyRegistered.value && userStore.userId) {
      await userStore.updateAccount({
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
      await router.push(resolveRedirect());
      return;
    }

    const { userId, previousId } = await userStore.registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
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

    form.password = '';
    await router.push(resolveRedirect());
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

const handleLogin = async () => {
  if (isLoginSubmitting.value) return;
  if (!emailPattern.test(loginForm.email.trim())) {
    notifications.push({
      title: 'Некорректный e-mail',
      description: 'Проверьте адрес электронной почты и попробуйте ещё раз.',
      tone: 'error'
    });
    return;
  }
  if (!loginForm.password.trim()) {
    notifications.push({
      title: 'Введите пароль',
      description: 'Пароль обязателен для входа.',
      tone: 'error'
    });
    return;
  }

  isLoginSubmitting.value = true;
  try {
    const { userId, previousId } = await userStore.login({
      email: loginForm.email.trim(),
      password: loginForm.password.trim()
    });
    if (previousId && previousId !== userId) {
      await metricsStore.stopVisit(previousId);
    }
    await metricsStore.startVisit(userId);
    notifications.push({
      title: 'Добро пожаловать',
      description: 'Профиль и статистика восстановлены.',
      tone: 'success'
    });
    loginForm.password = '';
    await router.push(resolveRedirect());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось войти';
    notifications.push({
      title: 'Ошибка входа',
      description: message,
      tone: 'error'
    });
  } finally {
    isLoginSubmitting.value = false;
  }
};
</script>
