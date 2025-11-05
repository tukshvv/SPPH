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
              <span v-if="message.intent">Режим: {{ intentLabel(message.intent) }}</span>
              <span v-if="hasUsage(message)">
                Токены:
                <span v-if="message.usage.promptTokens !== undefined">prompt {{ message.usage.promptTokens }}</span>
                <span v-if="message.usage.completionTokens !== undefined" class="ml-1">
                  completion {{ message.usage.completionTokens }}
                </span>
              </span>
            </div>
            <p v-if="message.profileHint" class="mt-1 text-xs text-primary">{{ message.profileHint }}</p>
          </template>
          <p class="mt-2 text-xs text-slate-500" v-else-if="message.pending">Мыслю…</p>
          <p class="mt-2 text-xs text-slate-400" v-else>{{ formatTimestamp(message.createdAt) }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../stores/chat';

defineProps<{ messages: ChatMessage[] }>();

const bubbleClass = (message: ChatMessage) => {
  if (message.role === 'user') {
    return 'bg-primary text-white shadow-primary/20';
  }
  return 'bg-white text-slate-800 border border-slate-200';
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
