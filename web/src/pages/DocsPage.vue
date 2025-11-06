<template>
  <section class="mx-auto w-full max-w-6xl px-4 py-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold text-slate-900">Документы для RAG</h1>
      <p class="text-sm text-slate-500">
        Загружайте выдержки и конспекты, чтобы ассистент использовал их в качестве источника знаний при ответе.
      </p>
    </div>

    <div
      v-if="!userStore.userId"
      class="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600"
    >
      <h2 class="text-lg font-semibold text-slate-900">Нужна регистрация</h2>
      <p class="mt-2">Только зарегистрированные пользователи могут загружать документы и использовать RAG-режим.</p>
      <RouterLink
        to="/auth"
        class="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
      >
        Перейти к авторизации
      </RouterLink>
    </div>

    <div v-else class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">Загрузка документа</h2>
        <p class="mt-1 text-sm text-slate-500">
          Текст автоматически разбивается на фрагменты и отправляется в индекс. Максимизируйте качество — очищайте форматирование и убирайте лишние пробелы.
        </p>

        <form class="mt-5 space-y-4" @submit.prevent="handleDocIngest">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Doc ID (опционально)</label>
            <input
              v-model="docForm.id"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Если оставить пустым, ID создастся автоматически"
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Раздел/секция</label>
            <input
              v-model="docForm.section"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Например: лекция 3, глава 2"
            />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Текст</label>
            <textarea
              v-model="docForm.text"
              rows="8"
              class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Вставьте текст документа для индексации"
            ></textarea>
          </div>
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="docsStore.isIngesting"
          >
            <span v-if="docsStore.isIngesting">Загрузка…</span>
            <span v-else>Загрузить в индекс</span>
          </button>
        </form>
      </div>

      <aside class="space-y-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Загруженные документы</h2>
          <p class="mt-1 text-sm text-slate-500">
            Все документы сохраняются локально для предпросмотра. При необходимости можно повторно загрузить документ, используя тот же ID.
          </p>
          <p v-if="docsStore.documents.length === 0" class="mt-4 text-sm text-slate-500">
            Пока ничего не загружено. Добавьте первый документ с левой стороны.
          </p>
          <ul v-else class="mt-4 space-y-3 text-sm">
            <li
              v-for="doc in docsStore.documents"
              :key="doc.id"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-slate-800">{{ doc.id }}</p>
                  <p v-if="doc.meta?.section" class="text-xs text-slate-500">{{ doc.meta.section }}</p>
                </div>
                <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {{ doc.chunks.length }} фраг.
                </span>
              </div>
              <p class="mt-2 text-xs text-slate-500">Добавлено: {{ formatDocTimestamp(doc.createdAt) }}</p>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useDocsStore } from '../stores/docs';
import { useNotificationStore } from '../stores/notifications';
import { useUserStore } from '../stores/user';

const docsStore = useDocsStore();
const notifications = useNotificationStore();
const userStore = useUserStore();

const docForm = reactive({
  id: '',
  section: '',
  text: ''
});

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
  new Date(timestamp).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
</script>
