<template>
  <div class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
    <TransitionGroup name="message" tag="div" class="flex flex-col gap-4">
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex w-full"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div class="max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm transition" :class="bubbleClass(message)">
          <p class="whitespace-pre-wrap leading-relaxed">{{ message.content }}</p>
          <template v-if="message.role === 'assistant' && !message.pending">
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span v-if="message.intent">Цель: {{ intentLabel(message.intent) }}</span>
              <span v-if="message.responseMode">Ответ: {{ modeLabel(message.responseMode) }}</span>
              <span v-if="hasUsage(message)">
                Токены:
                <span v-if="message.usage.promptTokens !== undefined">prompt {{ message.usage.promptTokens }}</span>
                <span v-if="message.usage.completionTokens !== undefined" class="ml-1">
                  completion {{ message.usage.completionTokens }}
                </span>
              </span>
            </div>
            <p v-if="message.profileHint" class="mt-1 text-xs text-primary">{{ message.profileHint }}</p>
            <div v-if="message.citations && message.citations.length" class="mt-2 border-t border-slate-100 pt-2">
              <button
                type="button"
                class="text-xs font-medium text-primary hover:underline"
                @click="toggleCitations(message.id)"
              >
                Ссылки/цитаты ({{ message.citations.length }})
                <span class="ml-1">{{ citationsOpen(message.id) ? '▲' : '▼' }}</span>
              </button>
              <div v-if="citationsOpen(message.id)" class="mt-2 space-y-2 text-xs">
                <div
                  v-for="citation in message.citations"
                  :key="`${message.id}-${citation.docId}-${citation.chunkIdx}`"
                  class="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600"
                >
                  <p class="font-semibold text-slate-700">[{{ citation.docId }}:{{ citation.chunkIdx }}]</p>
                  <p class="mt-1 whitespace-pre-wrap leading-snug">
                    {{ chunkText(citation.docId, citation.chunkIdx) ?? 'Фрагмент не найден в локальном кеше.' }}
                  </p>
                </div>
              </div>
            </div>
          </template>
          <p class="mt-2 text-xs text-slate-500" v-else-if="message.pending">Мыслю…</p>
          <p class="mt-2 text-xs text-slate-400" v-else>{{ formatTimestamp(message.createdAt) }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ChatMessage } from '../stores/chat';
import { useDocsStore } from '../stores/docs';

defineProps<{ messages: ChatMessage[] }>();

const docsStore = useDocsStore();
const expanded = ref<Record<string, boolean>>({});

const bubbleClass = (message: ChatMessage) => {
  if (message.role === 'user') {
    return 'bg-primary text-white shadow-primary/20';
  }
  return 'bg-white text-slate-800 border border-slate-200';
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const modeLabel = (mode: NonNullable<ChatMessage['responseMode']>) => {
  switch (mode) {
    case 'rag':
      return 'RAG';
    default:
      return 'basic';
  }
};

const intentLabel = (intent: NonNullable<ChatMessage['intent']>) => {
  switch (intent) {
    case 'search':
      return 'поиск';
    case 'explain':
      return 'объяснение';
    default:
      return 'Q&A';
  }
};

const hasUsage = (message: ChatMessage) => {
  if (!message.usage) return false;
  return (
    message.usage.promptTokens !== undefined || message.usage.completionTokens !== undefined
  );
};

const toggleCitations = (id: string) => {
  expanded.value[id] = !expanded.value[id];
};

const citationsOpen = (id: string) => {
  return Boolean(expanded.value[id]);
};

const chunkText = (docId: string, chunkIdx: number) => {
  return docsStore.getChunkText(docId, chunkIdx);
};
</script>

<style scoped>
.message-enter-active,
.message-leave-active {
  transition: all 0.2s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
